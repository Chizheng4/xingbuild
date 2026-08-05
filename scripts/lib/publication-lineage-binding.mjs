import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { writeJsonAtomically } from "./content-release-state.mjs";
import {
  contentLogicalContentId,
  contentPackageSlotId,
  contentReceiptId,
  ensureContentSlotRegistry,
  resolveContentSlot,
  resolveContentSlotCandidate,
} from "./content-slot-registry.mjs";

export const PUBLICATION_LINEAGE_BINDING_VERSION = "publication-lineage-binding-v1";
export const PUBLICATION_LINEAGE_BINDING_DIRECTORY = ".content-workspace/publication-lineage-bindings";

function stableJson(value) {
  return JSON.stringify(value);
}

function hashValue(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

export class PublicationLineageBindingDriftError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PublicationLineageBindingDriftError";
    this.code = "PUBLICATION_LINEAGE_BINDING_DRIFT";
    Object.assign(this, details);
  }
}

export function publicationLineageBindingDirectory(sourceRoot) {
  return path.join(sourceRoot, PUBLICATION_LINEAGE_BINDING_DIRECTORY);
}

export function publicationLineageBindingPath(sourceRoot, lineageBindingId) {
  if (!hasText(lineageBindingId)) throw new Error("lineageBindingId is required");
  return path.join(publicationLineageBindingDirectory(sourceRoot), `${lineageBindingId}.json`);
}

export function publicationLineageBindingTuple({
  sitePublicationId,
  logicalContentId,
  packageRevisionId,
  candidateContentReleaseId,
  predecessorReceiptId,
  predecessorPackageId,
  registryRevision,
} = {}) {
  const values = {
    bindingVersion: PUBLICATION_LINEAGE_BINDING_VERSION,
    sitePublicationId,
    logicalContentId,
    packageRevisionId,
    candidateContentReleaseId,
    predecessorReceiptId,
    predecessorPackageId,
    registryRevision,
  };
  if (!hasText(values.sitePublicationId)
    || !hasText(values.logicalContentId)
    || !hasText(values.packageRevisionId)
    || !hasText(values.candidateContentReleaseId)
    || !hasText(values.predecessorReceiptId)
    || !hasText(values.predecessorPackageId)
    || !Number.isInteger(values.registryRevision)) {
    throw new Error("PublicationLineageBinding identity is incomplete");
  }
  return values;
}

export function publicationLineageBindingIdentity(tuple) {
  const bindingHash = hashValue(tuple);
  return {
    lineageBindingId: `lineage-binding-${bindingHash.slice(0, 24)}`,
    bindingHash,
  };
}

function assertBindingShape(binding) {
  if (!binding || binding.bindingVersion !== PUBLICATION_LINEAGE_BINDING_VERSION) {
    throw new PublicationLineageBindingDriftError("PublicationLineageBinding version is unsupported");
  }
  const tuple = publicationLineageBindingTuple(binding);
  const identity = publicationLineageBindingIdentity(tuple);
  if (binding.lineageBindingId !== identity.lineageBindingId || binding.bindingHash !== identity.bindingHash) {
    throw new PublicationLineageBindingDriftError("PublicationLineageBinding hash or id drift", { binding });
  }
  return binding;
}

export function validatePublicationLineageBinding(binding, expected = {}) {
  const actual = assertBindingShape(binding);
  for (const field of [
    "sitePublicationId",
    "logicalContentId",
    "packageRevisionId",
    "candidateContentReleaseId",
    "predecessorReceiptId",
    "predecessorPackageId",
    "registryRevision",
  ]) {
    if (expected[field] != null && actual[field] !== expected[field]) {
      throw new PublicationLineageBindingDriftError(`PublicationLineageBinding ${field} drift`, { expected, observed: actual });
    }
  }
  return actual;
}

export async function readPublicationLineageBinding({ sourceRoot, lineageBindingId, expected = {} } = {}) {
  const bindingPath = publicationLineageBindingPath(sourceRoot, lineageBindingId);
  let binding;
  try {
    binding = JSON.parse(await readFile(bindingPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") throw new PublicationLineageBindingDriftError(`PublicationLineageBinding is missing: ${bindingPath}`, { bindingPath });
    throw new PublicationLineageBindingDriftError(`PublicationLineageBinding is unreadable: ${bindingPath}: ${error.message}`, { bindingPath });
  }
  return validatePublicationLineageBinding(binding, expected);
}

export async function createOrReusePublicationLineageBinding({
  sourceRoot,
  sitePublicationId,
  candidate,
  registry: providedRegistry = null,
  expectedRegistryRevision = null,
  existingBinding = null,
  now = () => new Date().toISOString(),
} = {}) {
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) throw new Error("PublicationLineageBinding sourceRoot must be absolute");
  if (!hasText(sitePublicationId)) throw new Error("PublicationLineageBinding sitePublicationId is required");
  const logicalContentId = contentLogicalContentId(candidate);
  const packageRevisionId = candidate?.packageRevisionId || null;
  const candidateContentReleaseId = candidate?.contentReleaseId || null;
  if (!hasText(logicalContentId) || !hasText(packageRevisionId) || !hasText(candidateContentReleaseId)) {
    throw new Error("PublicationLineageBinding candidate revision identity is incomplete");
  }

  const registry = providedRegistry || await ensureContentSlotRegistry({ sourceRoot });
  if (expectedRegistryRevision != null && registry.registryRevision !== expectedRegistryRevision) {
    throw new PublicationLineageBindingDriftError("PublicationLineageBinding registry revision drift", {
      expectedRegistryRevision,
      observedRegistryRevision: registry.registryRevision,
      logicalContentId,
    });
  }
  const resolved = resolveContentSlotCandidate({ registry, candidate, allowLegacySelfReference: true });
  const tuple = publicationLineageBindingTuple({
    sitePublicationId,
    logicalContentId,
    packageRevisionId,
    candidateContentReleaseId,
    predecessorReceiptId: resolved.predecessorReceiptId,
    predecessorPackageId: resolved.predecessorPackageSlotId,
    registryRevision: registry.registryRevision,
  });
  const identity = publicationLineageBindingIdentity(tuple);
  const expected = { ...tuple, ...identity };
  if (existingBinding) {
    validatePublicationLineageBinding(existingBinding, expected);
  }

  const bindingPath = publicationLineageBindingPath(sourceRoot, identity.lineageBindingId);
  let persisted = null;
  try {
    persisted = JSON.parse(await readFile(bindingPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw new PublicationLineageBindingDriftError(`PublicationLineageBinding is unreadable: ${bindingPath}: ${error.message}`, { bindingPath });
  }
  if (persisted) {
    validatePublicationLineageBinding(persisted, expected);
    return { ...persisted, bindingPath, reused: true, resolved, registry };
  }

  const binding = {
    ...tuple,
    ...identity,
    createdAt: now(),
  };
  await writeJsonAtomically(bindingPath, binding);
  // Re-read after the atomic write so a concurrent writer cannot be silently
  // masked by the in-memory candidate.
  const persistedAfterWrite = JSON.parse(await readFile(bindingPath, "utf8"));
  validatePublicationLineageBinding(persistedAfterWrite, expected);
  return { ...persistedAfterWrite, bindingPath, reused: false, resolved, registry };
}

export async function resolvePublicationLineageBinding({ sourceRoot, sitePublicationId, candidate, registry = null, expectedRegistryRevision = null, existingBinding = null, now } = {}) {
  return createOrReusePublicationLineageBinding({ sourceRoot, sitePublicationId, candidate, registry, expectedRegistryRevision, existingBinding, now });
}

export function bindingPredecessor(binding) {
  const actual = assertBindingShape(binding);
  return {
    predecessorReceiptId: actual.predecessorReceiptId,
    predecessorPackageId: actual.predecessorPackageId,
    registryRevision: actual.registryRevision,
  };
}

export function publicationLineageBindingProjection(binding) {
  const actual = assertBindingShape(binding);
  return Object.fromEntries([
    "bindingVersion",
    "sitePublicationId",
    "logicalContentId",
    "packageRevisionId",
    "candidateContentReleaseId",
    "predecessorReceiptId",
    "predecessorPackageId",
    "registryRevision",
    "lineageBindingId",
    "bindingHash",
    "createdAt",
  ].map((field) => [field, actual[field]]));
}

export function assertBindingCandidate(binding, candidate = {}) {
  const actual = assertBindingShape(binding);
  const candidateReceiptId = contentReceiptId(candidate);
  const candidatePackageSlotId = contentPackageSlotId(candidate);
  if (candidateReceiptId !== `${actual.candidateContentReleaseId}@${actual.packageRevisionId}` || candidatePackageSlotId !== actual.packageRevisionId) {
    throw new PublicationLineageBindingDriftError("PublicationLineageBinding candidate identity drift", { binding: actual, candidate });
  }
  if (contentLogicalContentId(candidate) !== actual.logicalContentId) {
    throw new PublicationLineageBindingDriftError("PublicationLineageBinding logical identity drift", { binding: actual, candidate });
  }
  return actual;
}

export async function assertPublicationLineageBindingAgainstRegistry({ sourceRoot, binding, candidate = null } = {}) {
  const actual = validatePublicationLineageBinding(binding);
  if (candidate) assertBindingCandidate(actual, candidate);
  const registry = await ensureContentSlotRegistry({ sourceRoot });
  if (registry.registryRevision !== actual.registryRevision) {
    throw new PublicationLineageBindingDriftError("PublicationLineageBinding registry changed before finalize", {
      expectedRegistryRevision: actual.registryRevision,
      observedRegistryRevision: registry.registryRevision,
    });
  }
  const slot = resolveContentSlot(registry, actual.logicalContentId);
  if (slot.activeReceiptId === actual.candidateContentReleaseId || slot.activeReceiptId === `${actual.candidateContentReleaseId}@${actual.packageRevisionId}`) {
    return { binding: actual, registry, slot, alreadyActive: true };
  }
  if (slot.activeReceiptId !== actual.predecessorReceiptId || slot.activePackageSlotId !== actual.predecessorPackageId) {
    throw new PublicationLineageBindingDriftError("PublicationLineageBinding predecessor no longer matches Registry", {
      binding: actual,
      observedSlot: slot,
    });
  }
  return { binding: actual, registry, slot, alreadyActive: false };
}
