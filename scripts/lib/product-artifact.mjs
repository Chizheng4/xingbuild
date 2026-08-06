import { readFile } from "node:fs/promises";
import path from "node:path";
import { hashArtifactValue, readBaseSiteArtifact } from "./base-site-artifact.mjs";

export const PRODUCT_ARTIFACT_CONTRACT_VERSION = "product-artifact-v1";
export const PRODUCT_ARTIFACT_IDENTITY_FIELDS = Object.freeze([
  "artifactContractVersion",
  "productArtifactId",
  "productVersion",
  "productCommit",
  "baseSiteArtifactId",
  "productArtifactHash",
  "releaseManifestHash",
  "contentManifestHash",
  "artifactContentHash",
  "sourceBundleHash",
]);

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`ProductArtifact ${field} is missing`);
  return value;
}
function expectedBaseSiteArtifactId(version, commit) {
  return `${version}-${commit.slice(0, 12)}`;
}

function assertDocumentObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`ProductArtifact ${label} is missing`);
  }
  return value;
}

function identityValue({ release, contentManifest, baseSiteArtifact } = {}) {
  return {
    artifactContractVersion: PRODUCT_ARTIFACT_CONTRACT_VERSION,
    productVersion: release.version,
    productCommit: release.commit,
    productArtifactId: baseSiteArtifact.baseSiteArtifactId,
    baseSiteArtifactId: baseSiteArtifact.baseSiteArtifactId,
    releaseManifestHash: hashArtifactValue(release),
    contentManifestHash: hashArtifactValue(contentManifest),
    artifactContentHash: hashArtifactValue({ release, contentManifest }),
    sourceBundleHash: baseSiteArtifact.sourceBundleHash,
  };
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

/**
 * The only boundary adapter from the three immutable ProductArtifact
 * manifests to the runtime identity consumed by snapshots and publication.
 * Raw documents deliberately remain behind the adapter; callers receive
 * them only under the read-only `documents` field.
 */
export function resolveProductArtifactIdentity({ release, contentManifest, baseSiteArtifact } = {}, { version, commit } = {}) {
  assertDocumentObject(release, "release.json");
  assertDocumentObject(contentManifest, "content-manifest.json");
  assertDocumentObject(baseSiteArtifact, "base-site-artifact.json");
  const expectedVersion = text(version || release.version, "version");
  const expectedCommit = text(commit || release.commit, "commit");
  const expectedBaseId = expectedBaseSiteArtifactId(expectedVersion, expectedCommit);
  for (const [actual, expected, field] of [
    [release.version, expectedVersion, "release.json version"],
    [release.commit, expectedCommit, "release.json commit"],
    [contentManifest.version, expectedVersion, "content-manifest.json version"],
    [contentManifest.commit, expectedCommit, "content-manifest.json commit"],
    [baseSiteArtifact.productVersion, expectedVersion, "base-site-artifact productVersion"],
    [baseSiteArtifact.productCommit, expectedCommit, "base-site-artifact productCommit"],
    [baseSiteArtifact.baseSiteArtifactId, expectedBaseId, "base-site-artifact baseSiteArtifactId"],
    [release.baseSiteArtifactId, expectedBaseId, "release.json baseSiteArtifactId"],
    [contentManifest.baseSiteArtifactId, expectedBaseId, "content-manifest.json baseSiteArtifactId"],
  ]) {
    if (actual !== expected) throw new Error(`ProductArtifact ${field} mismatch: expected ${expected}, got ${actual ?? "missing"}`);
  }
  if (baseSiteArtifact.productArtifactContractVersion && baseSiteArtifact.productArtifactContractVersion !== PRODUCT_ARTIFACT_CONTRACT_VERSION) {
    throw new Error("ProductArtifact contract version mismatch");
  }
  const expectedReleaseManifestHash = hashArtifactValue(release);
  if (baseSiteArtifact.releaseManifestHash !== expectedReleaseManifestHash) throw new Error("ProductArtifact releaseManifestHash drift");
  const expectedArtifactContentHash = hashArtifactValue({ release, contentManifest });
  if (baseSiteArtifact.artifactContentHash !== expectedArtifactContentHash) throw new Error("ProductArtifact artifactContentHash drift");
  const identity = identityValue({ release, contentManifest, baseSiteArtifact });
  identity.productArtifactId = expectedBaseId;
  return Object.freeze({
    ...identity,
    productArtifactHash: hashArtifactValue(identity),
    documents: deepFreeze({ release, contentManifest, baseSiteArtifact }),
  });
}

// Kept as a named export for existing adapter callers. It always returns the
// normalized flat identity; it never returns a second nested identity shape.
export const productArtifactIdentity = resolveProductArtifactIdentity;

export function productArtifactHash(artifact) {
  if (artifact?.productArtifactHash) return artifact.productArtifactHash;
  if (artifact?.documents) {
    const { release, contentManifest, baseSiteArtifact } = artifact.documents;
    return hashArtifactValue(identityValue({ release, contentManifest, baseSiteArtifact }));
  }
  return hashArtifactValue(identityValue(artifact));
}

/**
 * Validate a runtime identity without consulting or deriving from nested
 * manifest documents. SiteSnapshot and downstream publication objects use
 * this shape check at their boundaries.
 */
export function assertProductArtifactIdentityShape(identity = {}) {
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    throw new Error("ProductArtifact identity is required");
  }
  for (const field of ["productArtifactId", "productVersion", "productCommit", "baseSiteArtifactId"]) {
    text(identity[field], `identity.${field}`);
  }
  const expectedBaseId = expectedBaseSiteArtifactId(identity.productVersion, identity.productCommit);
  if (identity.productArtifactId !== expectedBaseId || identity.baseSiteArtifactId !== expectedBaseId) {
    throw new Error("ProductArtifact identity tuple mismatch");
  }
  for (const field of ["productArtifactHash", "releaseManifestHash", "contentManifestHash", "artifactContentHash", "sourceBundleHash"]) {
    if (identity[field] != null && !/^[a-f0-9]{64}$/.test(identity[field])) {
      throw new Error(`ProductArtifact identity ${field} is invalid`);
    }
  }
  if (identity.documents) {
    const resolved = resolveProductArtifactIdentity(identity.documents);
    for (const field of ["productArtifactId", "productVersion", "productCommit", "baseSiteArtifactId", "productArtifactHash", "releaseManifestHash", "contentManifestHash", "artifactContentHash", "sourceBundleHash"]) {
      if (identity[field] != null && identity[field] !== resolved[field]) {
        throw new Error(`ProductArtifact identity ${field} drift`);
      }
    }
  }
  return Object.fromEntries(PRODUCT_ARTIFACT_IDENTITY_FIELDS
    .filter((field) => identity[field] != null)
    .map((field) => [field, identity[field]]));
}

export function assertProductArtifactIdentity({ release, contentManifest, baseSiteArtifact } = {}, options = {}) {
  return resolveProductArtifactIdentity({ release, contentManifest, baseSiteArtifact }, options);
}

async function readJson(file, label) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`ProductArtifact ${label} is missing or unreadable: ${error.message}`);
  }
}

export async function readProductArtifact({ clientDirectory, sourceRoot, version, commit } = {}) {
  const root = sourceRoot || process.cwd();
  if (typeof clientDirectory !== "string" || clientDirectory.trim() === "") throw new Error("ProductArtifact client directory is required");
  const release = await readJson(path.join(clientDirectory, "release.json"), "release.json");
  const contentManifest = await readJson(path.join(clientDirectory, "content-manifest.json"), "content-manifest.json");
  const baseSiteArtifact = await readJson(path.join(clientDirectory, "base-site-artifact.json"), "base-site-artifact.json");
  await readBaseSiteArtifact({ sourceRoot: root, baseSiteArtifact });
  return assertProductArtifactIdentity({ release, contentManifest, baseSiteArtifact }, { version, commit });
}
