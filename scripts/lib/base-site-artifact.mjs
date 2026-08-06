import { createHash } from "node:crypto";
import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const sha256Pattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{7,64}$/;
const versionPattern = /^v\d+\.\d+\.\d+$/;
const artifactIdPattern = /^[a-z0-9][a-z0-9._-]+$/;

export const CONTENT_SLOT_CAPABILITY_CONTRACT_VERSION = "content-slot-registry-v1";
export const CONTENT_SLOT_CAPABILITY_CONTRACT = Object.freeze({
  contentKinds: ["content", "article", "practice", "profile", "businessObservation"],
  registeredTargets: "ContentSlotRegistry",
  mediaContract: "approved-media-manifest-v1",
  routeContract: "content-target-path-v1",
  fieldContract: ["logicalContentId", "activeReceiptId", "predecessorReceiptId", "packageRevisionId", "receiptHash", "projectionHash", "snapshotHash"],
});

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function canonical(value) {
  return JSON.stringify(value);
}

export function hashArtifactValue(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function sourceBundleHash(entries) {
  return hashArtifactValue(entries.map(({ path: relativePath, sha256 }) => ({ path: relativePath, sha256 })));
}

async function fileEntries(rootDirectory, current = "") {
  const entries = [];
  for (const entry of await readdir(path.join(rootDirectory, current), { withFileTypes: true })) {
    const relative = path.posix.join(current.split(path.sep).join("/"), entry.name);
    const absolute = path.join(rootDirectory, current, entry.name);
    if (entry.isDirectory()) entries.push(...await fileEntries(rootDirectory, relative));
    else if (entry.isFile()) {
      const sha256 = createHash("sha256").update(await readFile(absolute)).digest("hex");
      entries.push({ path: relative, sha256 });
    }
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

const excludedBundleRoots = new Set([
  ".git",
  ".content-workspace",
  ".obsidian",
  "dist",
  "node_modules",
  "docs",
  "tests",
]);

function excluded(relative) {
  const first = relative.split("/")[0];
  if (excludedBundleRoots.has(first)) return true;
  return [
    "content/observations",
    "content/articles",
    "content/products",
    "content/media",
    "content/business-observations",
    "content/profile",
    "public/media",
  ].some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`));
}

async function copyStableSource(fromDirectory, toDirectory, current = "") {
  for (const entry of await readdir(path.join(fromDirectory, current), { withFileTypes: true })) {
    const relative = path.posix.join(current.split(path.sep).join("/"), entry.name);
    if (excluded(relative)) continue;
    const from = path.join(fromDirectory, current, entry.name);
    const to = path.join(toDirectory, relative);
    if (entry.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copyStableSource(fromDirectory, toDirectory, relative);
    } else if (entry.isFile()) {
      await mkdir(path.dirname(to), { recursive: true });
      await cp(from, to);
    }
  }
}

async function isDirectory(directory) {
  try { return (await stat(directory)).isDirectory(); } catch { return false; }
}

export async function hashSourceBundle(sourceDirectory) {
  if (!(await isDirectory(sourceDirectory))) throw new Error(`baseSiteArtifact source bundle is missing: ${sourceDirectory}`);
  const entries = await fileEntries(sourceDirectory);
  return { entries, sourceBundleHash: sourceBundleHash(entries) };
}

export function validateBaseSiteArtifact(artifact, { sourceRoot } = {}) {
  if (!artifact || typeof artifact !== "object") throw new Error("immutable baseSiteArtifact is required");
  for (const field of ["baseSiteArtifactId", "productVersion", "productCommit", "releaseManifestHash", "artifactContentHash", "sourceDeploymentId", "sourceDirectory", "sourceBundleHash"]) {
    if (!hasText(artifact[field])) throw new Error(`baseSiteArtifact.${field} is required`);
  }
  if (!artifactIdPattern.test(artifact.baseSiteArtifactId)) throw new Error("baseSiteArtifact.baseSiteArtifactId is invalid");
  if (!versionPattern.test(artifact.productVersion)) throw new Error("baseSiteArtifact.productVersion is invalid");
  if (!commitPattern.test(artifact.productCommit)) throw new Error("baseSiteArtifact.productCommit is invalid");
  for (const field of ["releaseManifestHash", "artifactContentHash", "sourceBundleHash"]) {
    if (!sha256Pattern.test(artifact[field])) throw new Error(`baseSiteArtifact.${field} must be SHA-256`);
  }
  if (!path.isAbsolute(artifact.sourceDirectory)) throw new Error("baseSiteArtifact.sourceDirectory must be absolute");
  if (sourceRoot && path.resolve(artifact.sourceDirectory) === path.resolve(sourceRoot)) {
    throw new Error("baseSiteArtifact.sourceDirectory must not be the mutable canonical sourceRoot");
  }
  if (!Array.isArray(artifact.sourceBundle) || artifact.sourceBundle.length === 0) throw new Error("baseSiteArtifact.sourceBundle must contain source files");
  if (sourceBundleHash(artifact.sourceBundle) !== artifact.sourceBundleHash) throw new Error("baseSiteArtifact sourceBundle hash is invalid");
  return artifact;
}

export function assertBaseSiteArtifactCompatible(artifact, { requiredCapabilities = [] } = {}) {
  validateBaseSiteArtifact(artifact);
  if (!Array.isArray(requiredCapabilities) || requiredCapabilities.some((value) => typeof value !== "string" || value.trim() === "")) {
    throw new Error("required baseSiteArtifact capabilities must be non-empty strings");
  }
  const capabilities = Array.isArray(artifact.capabilities) ? new Set(artifact.capabilities) : null;
  if (capabilities && requiredCapabilities.some((value) => !capabilities.has(value))) {
    throw new Error("baseSiteArtifact capabilities are incompatible with content target");
  }
  return artifact;
}

export function assertContentSlotArtifactCompatible(artifact, { registryMode = "legacy", requiredKinds = [] } = {}) {
  validateBaseSiteArtifact(artifact);
  if (!artifact.capabilityContractVersion && !artifact.capabilityContract) {
    if (registryMode === "legacy") return { artifact, legacy: true };
    throw new Error("baseSiteArtifact content slot capability contract is unknown");
  }
  if (artifact.capabilityContractVersion !== CONTENT_SLOT_CAPABILITY_CONTRACT_VERSION) {
    throw new Error(`baseSiteArtifact content slot capability contract is incompatible: ${artifact.capabilityContractVersion || "missing"}`);
  }
  const contract = artifact.capabilityContract;
  if (!contract || contract.registeredTargets !== "ContentSlotRegistry" || contract.mediaContract !== CONTENT_SLOT_CAPABILITY_CONTRACT.mediaContract || contract.routeContract !== CONTENT_SLOT_CAPABILITY_CONTRACT.routeContract) {
    throw new Error("baseSiteArtifact content slot capability contract is incompatible");
  }
  const kinds = new Set(contract.contentKinds || []);
  if (JSON.stringify([...kinds].sort()) !== JSON.stringify([...CONTENT_SLOT_CAPABILITY_CONTRACT.contentKinds].sort())
    || JSON.stringify(contract.fieldContract || []) !== JSON.stringify(CONTENT_SLOT_CAPABILITY_CONTRACT.fieldContract)) {
    throw new Error("baseSiteArtifact content slot field contract is incompatible");
  }
  if (requiredKinds.some((kind) => !kinds.has(kind))) throw new Error("baseSiteArtifact content slot kind contract is incompatible");
  return { artifact, legacy: false };
}

export async function createBaseSiteArtifact({ sourceRoot, productVersion, productCommit, release, contentManifest, sourceDeploymentId = "prepared-dist" } = {}) {
  if (!hasText(sourceRoot) || !path.isAbsolute(sourceRoot)) throw new Error("baseSiteArtifact sourceRoot must be absolute");
  if (!versionPattern.test(productVersion || "") || !commitPattern.test(productCommit || "")) throw new Error("baseSiteArtifact product identity is invalid");
  const baseSiteArtifactId = `${productVersion}-${productCommit.slice(0, 12)}`;
  const artifactRoot = path.join(sourceRoot, ".content-workspace", "base-site-artifacts", baseSiteArtifactId);
  const sourceDirectory = path.join(artifactRoot, "source");
  await rm(artifactRoot, { recursive: true, force: true });
  await mkdir(sourceDirectory, { recursive: true });
  await copyStableSource(sourceRoot, sourceDirectory);
  const { entries, sourceBundleHash: bundleHash } = await hashSourceBundle(sourceDirectory);
  const descriptor = validateBaseSiteArtifact({
    baseSiteArtifactId,
    productVersion,
    productCommit,
    releaseManifestHash: hashArtifactValue(release),
    artifactContentHash: hashArtifactValue({ release, contentManifest }),
    sourceDeploymentId,
    capabilityContractVersion: CONTENT_SLOT_CAPABILITY_CONTRACT_VERSION,
    capabilityContract: CONTENT_SLOT_CAPABILITY_CONTRACT,
    sourceDirectory,
    sourceBundle: entries,
    sourceBundleHash: bundleHash,
  }, { sourceRoot });
  await writeFile(path.join(artifactRoot, "base-site-artifact.json"), `${JSON.stringify(descriptor, null, 2)}\n`);
  return descriptor;
}

export async function readBaseSiteArtifact({ sourceRoot, baseSiteArtifact, artifactPath } = {}) {
  let selected = baseSiteArtifact;
  if (typeof selected === "string") {
    const resolved = path.resolve(sourceRoot, selected);
    selected = JSON.parse(await readFile(resolved, "utf8"));
  }
  if (!selected && artifactPath) {
    const resolved = path.resolve(sourceRoot, artifactPath);
    const rootDirectory = path.resolve(sourceRoot);
    if (resolved !== rootDirectory && !resolved.startsWith(`${rootDirectory}${path.sep}`)) throw new Error("baseSiteArtifact path must stay inside source root");
    selected = JSON.parse(await readFile(resolved, "utf8"));
  }
  if (!selected) throw new Error("explicit immutable baseSiteArtifact is required; implicit dist fallback is disabled");
  const descriptor = validateBaseSiteArtifact(selected, { sourceRoot });
  const { entries, sourceBundleHash: actualHash } = await hashSourceBundle(descriptor.sourceDirectory);
  if (actualHash !== descriptor.sourceBundleHash || JSON.stringify(entries) !== JSON.stringify(descriptor.sourceBundle)) {
    throw new Error("baseSiteArtifact source bundle drift detected");
  }
  return descriptor;
}
