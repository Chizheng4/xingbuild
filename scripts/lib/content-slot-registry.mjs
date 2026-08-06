import { access, readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { writeJsonAtomically } from "./content-release-state.mjs";

/**
 * The slot registry is the only authoritative active-content index.  Package
 * receipts remain immutable facts; this file only records which receipt is the
 * current leaf for each logical content slot.
 */
export const CONTENT_SLOT_REGISTRY_VERSION = "content-slot-registry-v1";
export const CONTENT_SLOT_REGISTRY_DIRECTORY = ".content-workspace/content-slot-registry";
export const CONTENT_SLOT_REGISTRY_FILE = "registry.json";

function stableJson(value) {
  return JSON.stringify(value);
}

function hashValue(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

const HASH_PATTERN = /^[a-f0-9]{64}$/;

export function contentSlotRegistryPath(sourceRoot) {
  return path.join(sourceRoot, CONTENT_SLOT_REGISTRY_DIRECTORY, CONTENT_SLOT_REGISTRY_FILE);
}

export function contentSlotRegistryDirectory(sourceRoot) {
  return path.join(sourceRoot, CONTENT_SLOT_REGISTRY_DIRECTORY);
}

export function contentLogicalContentId(value = {}) {
  if (hasText(value.logicalContentId)) return value.logicalContentId;
  if (hasText(value.kind) && hasText(value.target)) return `${value.kind}:${value.target}`;
  return null;
}

/**
 * A contentReleaseId is retained for legacy receipts.  Revisions reuse that
 * logical release id, so a revision-aware receipt key is needed in the slot
 * registry to keep every immutable receipt distinguishable.
 */
export function contentReceiptId(value = {}) {
  if (!hasText(value.contentReleaseId)) return null;
  return value.packageRevisionId ? `${value.contentReleaseId}@${value.packageRevisionId}` : value.contentReleaseId;
}

export function contentPackageSlotId(value = {}) {
  return value.packageRevisionId || value.contentReleaseId || null;
}

function conflict(code, logicalContentId, details = {}) {
  return { code, logicalContentId, ...details };
}

export class ContentSlotRegistryMigrationError extends Error {
  constructor(message, conflicts = []) {
    super(message);
    this.name = "ContentSlotRegistryMigrationError";
    this.code = "CONTENT_SLOT_REGISTRY_MIGRATION_CONFLICT";
    this.conflicts = conflicts;
  }
}

export class ContentSlotCompareAndSwapError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ContentSlotCompareAndSwapError";
    this.code = "CONTENT_SLOT_ACTIVE_CHANGED";
    Object.assign(this, details);
  }
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function assertRegistryShape(registry) {
  if (!registry || registry.schemaVersion !== CONTENT_SLOT_REGISTRY_VERSION) {
    throw new Error(`content slot registry schema is unsupported: ${registry?.schemaVersion || "missing"}`);
  }
  if (registry.mode !== "legacy" && registry.mode !== "authoritative") {
    throw new Error(`content slot registry mode is unsupported: ${registry.mode || "missing"}`);
  }
  if (!Number.isInteger(registry.registryRevision) || registry.registryRevision < 1) {
    throw new Error("content slot registry revision is invalid");
  }
  if (!Array.isArray(registry.slots)) throw new Error("content slot registry slots are missing");
  const seen = new Set();
  for (const slot of registry.slots) {
    if (!hasText(slot.logicalContentId) || !hasText(slot.kind) || !hasText(slot.target) || !hasText(slot.activeReceiptId)) {
      throw new Error("content slot registry slot identity is incomplete");
    }
    if (seen.has(slot.logicalContentId)) throw new Error(`content slot registry duplicate logicalContentId: ${slot.logicalContentId}`);
    seen.add(slot.logicalContentId);
    if (slot.activeReceiptId === slot.predecessorReceiptId) throw new Error(`content slot registry self predecessor: ${slot.logicalContentId}`);
  }
  if (registry.mode === "authoritative") {
    const migration = registry.migration;
    if (!migration
      || migration.type !== "ContentSlotRegistryLegacyMigration"
      || migration.version !== 1
      || !Array.isArray(migration.source)
      || !Number.isInteger(migration.sourceCount)
      || migration.sourceCount !== migration.source.length
      || !HASH_PATTERN.test(migration.sourceHash || "")) {
      throw new Error("authoritative content slot registry migration proof is incomplete");
    }
    if (hashValue(migration.source) !== migration.sourceHash) {
      throw new Error("authoritative content slot registry migration proof hash drift");
    }
    if (migration.conflicts != null && !Array.isArray(migration.conflicts)) {
      throw new Error("authoritative content slot registry migration conflicts are invalid");
    }
  }
  return registry;
}

export function validateContentSlotRegistry(registry) {
  return assertRegistryShape(registry);
}

async function collectReleasedPackages(releasesRoot, sourceRoot) {
  const packages = [];
  const rootEntries = await readdir(releasesRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of rootEntries) {
    if (!entry.isDirectory()) continue;
    const root = path.join(releasesRoot, entry.name);
    const directories = [root];
    for (const revision of await readdir(path.join(root, "revisions"), { withFileTypes: true }).catch(() => [])) {
      if (revision.isDirectory()) directories.push(path.join(root, "revisions", revision.name));
    }
    for (const packageDirectory of directories) {
      const releasePath = path.join(packageDirectory, "content-release.json");
      if (!(await exists(releasePath))) continue;
      let release;
      try { release = await readJson(releasePath); } catch (error) {
        throw new Error(`content slot registry release is unreadable: ${releasePath}: ${error.message}`);
      }
      if (release.state !== "released") continue;
      const logicalContentId = contentLogicalContentId(release);
      if (!logicalContentId || !hasText(release.contentReleaseId) || !hasText(release.kind) || !hasText(release.target)) {
        throw new ContentSlotRegistryMigrationError(`content slot registry released identity is incomplete: ${releasePath}`, [conflict("INCOMPLETE_RELEASE_IDENTITY", logicalContentId, { packageDirectory: releasePath })]);
      }
      packages.push({
        packageDirectory,
        packageRelativePath: path.relative(sourceRoot, packageDirectory),
        release,
        logicalContentId,
        packageSlotId: contentPackageSlotId(release),
        receiptId: contentReceiptId(release),
      });
    }
  }
  return packages.sort((a, b) => a.packageDirectory.localeCompare(b.packageDirectory));
}


function resolveGroup(logicalContentId, packages) {
  const conflicts = [];
  const bySlot = new Map();
  for (const entry of packages) {
    if (!entry.packageSlotId || !entry.receiptId) {
      conflicts.push(conflict("INCOMPLETE_PACKAGE_SLOT", logicalContentId, { packageDirectory: entry.packageDirectory }));
      continue;
    }
    if (bySlot.has(entry.packageSlotId)) {
      conflicts.push(conflict("DUPLICATE_PACKAGE_SLOT", logicalContentId, { packageSlotId: entry.packageSlotId, packageDirectories: [bySlot.get(entry.packageSlotId).packageDirectory, entry.packageDirectory] }));
      continue;
    }
    bySlot.set(entry.packageSlotId, entry);
  }
  const childParents = new Set();
  const predecessorBySlot = new Map();
  for (const entry of bySlot.values()) {
    if (!entry.release.packageRevisionId) continue;
    const predecessor = entry.release.supersedesPackageId || entry.release.revisionLineage?.supersedesPackageId || null;
    if (!predecessor) {
      conflicts.push(conflict("REVISION_PREDECESSOR_MISSING", logicalContentId, { packageRevisionId: entry.release.packageRevisionId, packageDirectory: entry.packageDirectory }));
      continue;
    }
    if (predecessor === entry.packageSlotId || predecessor === entry.receiptId) {
      conflicts.push(conflict("REVISION_PREDECESSOR_SELF", logicalContentId, { packageRevisionId: entry.release.packageRevisionId, predecessorReceiptId: predecessor }));
      continue;
    }
    if (!bySlot.has(predecessor)) {
      conflicts.push(conflict("REVISION_PREDECESSOR_MISSING_TARGET", logicalContentId, { packageRevisionId: entry.release.packageRevisionId, predecessorReceiptId: predecessor }));
      continue;
    }
    childParents.add(predecessor);
    predecessorBySlot.set(entry.packageSlotId, predecessor);
  }
  const leaves = [...bySlot.values()].filter((entry) => !childParents.has(entry.packageSlotId));
  if (leaves.length !== 1) {
    conflicts.push(conflict("ACTIVE_SLOT_NOT_UNIQUE", logicalContentId, { candidateReceiptIds: leaves.map((entry) => entry.receiptId).sort() }));
    return { conflicts, slot: null };
  }
  if (conflicts.length) return { conflicts, slot: null };
  const active = leaves[0];
  const predecessorSlotId = predecessorBySlot.get(active.packageSlotId) || null;
  const predecessor = predecessorSlotId ? bySlot.get(predecessorSlotId) : null;
  const slot = {
    logicalContentId,
    kind: active.release.kind,
    target: active.release.target,
    activeReceiptId: active.receiptId,
    activeContentReleaseId: active.release.contentReleaseId,
    activePackageRevisionId: active.release.packageRevisionId || null,
    activePackageSlotId: active.packageSlotId,
    activeContentHash: active.release.contentHash,
    predecessorReceiptId: predecessor?.receiptId || null,
    firstPublishedAt: active.release.firstPublishedAt || active.release.publishedAt || null,
    activePackageDirectory: active.packageRelativePath,
    activeBaseSiteArtifactId: active.release.baseSiteArtifactId || null,
  };
  return { conflicts, slot };
}

export async function scanLegacyContentSlotRegistry({ sourceRoot, releasesRoot = path.join(sourceRoot, ".content-workspace", "releases") } = {}) {
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) throw new Error("content slot registry sourceRoot must be absolute");
  const packages = await collectReleasedPackages(releasesRoot, sourceRoot);
  const byLogical = new Map();
  for (const entry of packages) (byLogical.get(entry.logicalContentId) || byLogical.set(entry.logicalContentId, []).get(entry.logicalContentId)).push(entry);
  const conflicts = [];
  const slots = [];
  for (const logicalContentId of [...byLogical.keys()].sort()) {
    const result = resolveGroup(logicalContentId, byLogical.get(logicalContentId));
    conflicts.push(...result.conflicts);
    if (result.slot) slots.push(result.slot);
  }
  const source = packages.map((entry) => ({
    packageDirectory: entry.packageRelativePath,
    logicalContentId: entry.logicalContentId,
    receiptId: entry.receiptId,
    packageSlotId: entry.packageSlotId,
    contentHash: entry.release.contentHash,
    packageRevisionId: entry.release.packageRevisionId || null,
    supersedesPackageId: entry.release.supersedesPackageId || entry.release.revisionLineage?.supersedesPackageId || null,
  }));
  const migration = {
    type: "ContentSlotRegistryLegacyMigration",
    version: 1,
    scannedAt: new Date().toISOString(),
    sourceCount: source.length,
    sourceHash: hashValue(source),
    source,
    conflicts,
  };
  if (conflicts.length) {
    throw new ContentSlotRegistryMigrationError(`content slot registry legacy migration found ${conflicts.length} conflict(s)`, conflicts);
  }
  return {
    schemaVersion: CONTENT_SLOT_REGISTRY_VERSION,
    mode: "legacy",
    registryRevision: 1,
    createdAt: migration.scannedAt,
    updatedAt: migration.scannedAt,
    migration,
    slots,
  };
}

export async function writeContentSlotRegistry({ sourceRoot, registry } = {}) {
  validateContentSlotRegistry(registry);
  const file = contentSlotRegistryPath(sourceRoot);
  await writeJsonAtomically(file, registry);
  return registry;
}

/**
 * Read the persisted authoritative registry without consulting the legacy
 * package corpus.  Once the registry is authoritative, its slots and
 * migration proof are the only active-slot inputs; the old corpus is history.
 */
export async function readAuthoritativeContentSlotRegistry({ sourceRoot } = {}) {
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) throw new Error("content slot registry sourceRoot must be absolute");
  const file = contentSlotRegistryPath(sourceRoot);
  if (!(await exists(file))) throw new Error(`authoritative content slot registry is missing: ${file}`);
  const registry = validateContentSlotRegistry(await readJson(file));
  if (registry.mode !== "authoritative") {
    throw new Error(`content slot registry is not authoritative: ${file}`);
  }
  return registry;
}

/**
 * Explicitly perform the one-time legacy bootstrap.  This is intentionally
 * the only runtime path that scans released package history.  A registry that
 * is already authoritative is immutable input and cannot be reinterpreted by
 * a migration scan.
 */
export async function bootstrapLegacyContentSlotRegistry({ sourceRoot, releasesRoot = path.join(sourceRoot || "", ".content-workspace", "releases") } = {}) {
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) throw new Error("content slot registry sourceRoot must be absolute");
  const file = contentSlotRegistryPath(sourceRoot);
  if (await exists(file)) {
    const existing = validateContentSlotRegistry(await readJson(file));
    if (existing.mode === "authoritative") {
      throw new Error(`content slot registry is already authoritative; legacy bootstrap is not allowed: ${file}`);
    }
    const scanned = await scanLegacyContentSlotRegistry({ sourceRoot, releasesRoot });
    if (existing.migration?.sourceHash && scanned.migration.sourceHash !== existing.migration.sourceHash) {
      const refreshed = {
        ...scanned,
        mode: existing.mode || "legacy",
        registryRevision: existing.registryRevision + 1,
        createdAt: existing.createdAt || scanned.createdAt,
        updatedAt: new Date().toISOString(),
        migration: { ...scanned.migration, refreshedFromRegistryRevision: existing.registryRevision },
      };
      await writeContentSlotRegistry({ sourceRoot, registry: refreshed });
      return refreshed;
    }
    return existing;
  }
  const registry = await scanLegacyContentSlotRegistry({ sourceRoot, releasesRoot });
  await writeContentSlotRegistry({ sourceRoot, registry });
  return registry;
}

export async function readContentSlotRegistry({ sourceRoot, migrate = true, releasesRoot } = {}) {
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) throw new Error("content slot registry sourceRoot must be absolute");
  const file = contentSlotRegistryPath(sourceRoot);
  if (await exists(file)) {
    const existing = validateContentSlotRegistry(await readJson(file));
    // Authoritative reads are deliberately corpus-independent.  This branch
    // must stay before any migration option handling so prepare/build/
    // transport/resume cannot accidentally re-enter the legacy scanner.
    if (existing.mode === "authoritative") return existing;
    if (!migrate) return existing;
    return bootstrapLegacyContentSlotRegistry({ sourceRoot, releasesRoot });
  }
  if (!migrate) throw new Error(`content slot registry is missing: ${file}`);
  return bootstrapLegacyContentSlotRegistry({ sourceRoot, releasesRoot });
}

export async function ensureContentSlotRegistry(options = {}) {
  return readContentSlotRegistry({ ...options, migrate: true });
}

export function resolveContentSlot(registry, logicalContentId) {
  validateContentSlotRegistry(registry);
  const slot = registry.slots.find((value) => value.logicalContentId === logicalContentId);
  if (!slot) throw new Error(`content slot registry logicalContentId is not registered: ${logicalContentId}`);
  return slot;
}

export function resolveContentSlotCandidate({ registry, candidate, allowLegacySelfReference = true } = {}) {
  const logicalContentId = contentLogicalContentId(candidate);
  if (!logicalContentId) throw new Error("content slot candidate logicalContentId is required");
  const slot = resolveContentSlot(registry, logicalContentId);
  const candidatePackageSlotId = contentPackageSlotId(candidate);
  const candidateReceiptId = contentReceiptId(candidate);
  if (!candidatePackageSlotId || !candidateReceiptId) throw new Error("content slot candidate immutable receipt identity is required");
  if (candidatePackageSlotId === slot.activePackageSlotId || candidateReceiptId === slot.activeReceiptId) {
    throw new Error(`content slot candidate is already active: ${logicalContentId}`);
  }
  // A legacy revision may carry the logical release id as its historical
  // supersedes projection. It is accepted only as input compatibility; the
  // resolver still returns the Registry predecessor and all exact physical
  // self references remain hard failures.
  if (candidate.supersedesPackageId === candidatePackageSlotId
    || candidate.supersedesPackageId === candidateReceiptId
    || (!allowLegacySelfReference && candidate.supersedesPackageId === candidate.contentReleaseId)
    || candidate.predecessorReceiptId === candidateReceiptId
    || candidate.predecessorReceiptId === candidatePackageSlotId
    || candidate.predecessorReceiptId === candidate.contentReleaseId) {
    throw new Error(`content slot candidate predecessor cannot reference itself: ${logicalContentId}`);
  }
  if (candidate.kind !== slot.kind || candidate.target !== slot.target) {
    throw new Error(`content slot candidate kind/target drift: ${logicalContentId}`);
  }
  return {
    logicalContentId,
    slot,
    candidateReceiptId,
    candidatePackageSlotId,
    predecessorReceiptId: slot.activeReceiptId,
    predecessorPackageSlotId: slot.activePackageSlotId,
  };
}

function registrySlotForTransition({ candidate, transition, previousSlot }) {
  const logicalContentId = contentLogicalContentId(candidate);
  const candidateReceiptId = contentReceiptId(candidate);
  const candidatePackageSlotId = contentPackageSlotId(candidate);
  if (!logicalContentId || !candidateReceiptId || !candidatePackageSlotId) throw new Error("content slot transition identity is incomplete");
  if (candidateReceiptId === previousSlot.activeReceiptId || candidatePackageSlotId === previousSlot.activePackageSlotId) {
    throw new Error(`content slot transition candidate is already active: ${logicalContentId}`);
  }
  if (candidate.predecessorReceiptId && candidate.predecessorReceiptId !== previousSlot.activeReceiptId) {
    throw new Error(`content slot transition predecessor drift: ${logicalContentId}`);
  }
  return {
    ...previousSlot,
    activeReceiptId: candidateReceiptId,
    activeContentReleaseId: candidate.contentReleaseId,
    activePackageRevisionId: candidate.packageRevisionId || null,
    activePackageSlotId: candidatePackageSlotId,
    activeContentHash: candidate.contentHash,
    predecessorReceiptId: previousSlot.activeReceiptId,
    firstPublishedAt: candidate.firstPublishedAt || previousSlot.firstPublishedAt || null,
    activePackageDirectory: transition.activePackageDirectory || previousSlot.activePackageDirectory,
    activeBaseSiteArtifactId: candidate.baseSiteArtifactId || previousSlot.activeBaseSiteArtifactId || null,
  };
}

function registrySlotForInitialCandidate({ candidate, transition = {} }) {
  const logicalContentId = contentLogicalContentId(candidate);
  const candidateReceiptId = contentReceiptId(candidate);
  const candidatePackageSlotId = contentPackageSlotId(candidate);
  if (!logicalContentId || !candidateReceiptId || !candidatePackageSlotId) throw new Error("content slot initial identity is incomplete");
  if (candidate.predecessorReceiptId || candidate.supersedesPackageId === candidatePackageSlotId || candidate.supersedesPackageId === candidateReceiptId) {
    throw new Error(`content slot initial predecessor is invalid: ${logicalContentId}`);
  }
  return {
    logicalContentId,
    kind: candidate.kind,
    target: candidate.target,
    activeReceiptId: candidateReceiptId,
    activeContentReleaseId: candidate.contentReleaseId,
    activePackageRevisionId: candidate.packageRevisionId || null,
    activePackageSlotId: candidatePackageSlotId,
    activeContentHash: candidate.contentHash,
    predecessorReceiptId: null,
    firstPublishedAt: candidate.firstPublishedAt || null,
    activePackageDirectory: transition.activePackageDirectory || null,
    activeBaseSiteArtifactId: candidate.baseSiteArtifactId || null,
  };
}

export async function registerInitialContentSlot({ sourceRoot, candidate, expectedRegistryRevision, activePackageDirectory, now = () => new Date().toISOString() } = {}) {
  const registry = await ensureContentSlotRegistry({ sourceRoot });
  if (expectedRegistryRevision != null && registry.registryRevision !== expectedRegistryRevision) {
    throw new ContentSlotCompareAndSwapError(`content slot registry revision changed: ${contentLogicalContentId(candidate)}`, { expectedRegistryRevision, observedRegistryRevision: registry.registryRevision });
  }
  const logicalContentId = contentLogicalContentId(candidate);
  const existing = registry.slots.find((slot) => slot.logicalContentId === logicalContentId);
  if (existing) throw new ContentSlotCompareAndSwapError(`content slot already exists: ${logicalContentId}`, { observedReceiptId: existing.activeReceiptId, previousSlot: existing });
  const nextSlot = registrySlotForInitialCandidate({ candidate, transition: { activePackageDirectory } });
  const updated = {
    ...registry,
    mode: "authoritative",
    registryRevision: registry.registryRevision + 1,
    updatedAt: now(),
    slots: [...registry.slots, nextSlot].sort((a, b) => a.logicalContentId.localeCompare(b.logicalContentId)),
    lastTransition: { logicalContentId, predecessorReceiptId: null, activeReceiptId: nextSlot.activeReceiptId, registryRevision: registry.registryRevision + 1, at: now(), type: "initial" },
  };
  await writeContentSlotRegistry({ sourceRoot, registry: updated });
  return { registry: updated, previousSlot: null, nextSlot };
}

export async function compareAndSwapContentSlot({ sourceRoot, logicalContentId, expectedReceiptId, expectedRegistryRevision, candidate, transition = {}, now = () => new Date().toISOString() } = {}) {
  const registry = await ensureContentSlotRegistry({ sourceRoot });
  const previousSlot = registry.slots.find((slot) => slot.logicalContentId === logicalContentId) || null;
  if (expectedRegistryRevision != null && registry.registryRevision !== expectedRegistryRevision) {
    throw new ContentSlotCompareAndSwapError(`content slot registry revision changed: ${logicalContentId}`, { expectedRegistryRevision, observedRegistryRevision: registry.registryRevision, previousSlot });
  }
  if (!previousSlot) {
    if (expectedReceiptId) throw new ContentSlotCompareAndSwapError(`content slot active receipt is missing: ${logicalContentId}`, { expectedReceiptId, observedReceiptId: null });
    return registerInitialContentSlot({ sourceRoot, candidate: { ...candidate, logicalContentId }, expectedRegistryRevision, activePackageDirectory: transition.activePackageDirectory, now });
  }
  if (expectedReceiptId && previousSlot.activeReceiptId !== expectedReceiptId) {
    throw new ContentSlotCompareAndSwapError(`content slot active receipt changed: ${logicalContentId}`, { expectedReceiptId, observedReceiptId: previousSlot.activeReceiptId, previousSlot });
  }
  const nextSlot = registrySlotForTransition({ candidate: { ...candidate, logicalContentId }, transition, previousSlot });
  const updated = {
    ...registry,
    mode: "authoritative",
    registryRevision: registry.registryRevision + 1,
    updatedAt: now(),
    slots: registry.slots.map((slot) => slot.logicalContentId === logicalContentId ? nextSlot : slot),
    lastTransition: {
      logicalContentId,
      predecessorReceiptId: previousSlot.activeReceiptId,
      activeReceiptId: nextSlot.activeReceiptId,
      registryRevision: registry.registryRevision + 1,
      at: now(),
    },
  };
  await writeContentSlotRegistry({ sourceRoot, registry: updated });
  return { registry: updated, previousSlot, nextSlot };
}

export async function restoreContentSlot({ sourceRoot, logicalContentId, expectedReceiptId, previousSlot, now = () => new Date().toISOString() } = {}) {
  const registry = await ensureContentSlotRegistry({ sourceRoot });
  const current = resolveContentSlot(registry, logicalContentId);
  if (expectedReceiptId && current.activeReceiptId !== expectedReceiptId) {
    throw new ContentSlotCompareAndSwapError(`content slot restore would overwrite a newer active receipt: ${logicalContentId}`, { expectedReceiptId, observedReceiptId: current.activeReceiptId, previousSlot });
  }
  if (!previousSlot || previousSlot.logicalContentId !== logicalContentId) throw new Error(`content slot restore previous slot is missing: ${logicalContentId}`);
  const updated = {
    ...registry,
    mode: "authoritative",
    registryRevision: registry.registryRevision + 1,
    updatedAt: now(),
    slots: registry.slots.map((slot) => slot.logicalContentId === logicalContentId ? previousSlot : slot),
    lastTransition: { logicalContentId, restoredReceiptId: previousSlot.activeReceiptId, registryRevision: registry.registryRevision + 1, at: now(), type: "restore" },
  };
  await writeContentSlotRegistry({ sourceRoot, registry: updated });
  return { registry: updated, restoredSlot: previousSlot };
}

export function activeSlotReceiptIds(registry) {
  validateContentSlotRegistry(registry);
  return registry.slots.map((slot) => slot.activeReceiptId).sort();
}
