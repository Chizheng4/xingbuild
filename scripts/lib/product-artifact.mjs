import { readFile } from "node:fs/promises";
import path from "node:path";
import { hashArtifactValue, readBaseSiteArtifact } from "./base-site-artifact.mjs";

export const PRODUCT_ARTIFACT_CONTRACT_VERSION = "product-artifact-v1";

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`ProductArtifact ${field} is missing`);
  return value;
}
function expectedBaseSiteArtifactId(version, commit) {
  return `${version}-${commit.slice(0, 12)}`;
}

export function productArtifactIdentity({ release, contentManifest, baseSiteArtifact } = {}) {
  return {
    artifactContractVersion: PRODUCT_ARTIFACT_CONTRACT_VERSION,
    productVersion: release.version,
    productCommit: release.commit,
    baseSiteArtifactId: baseSiteArtifact.baseSiteArtifactId,
    releaseManifestHash: hashArtifactValue(release),
    contentManifestHash: hashArtifactValue(contentManifest),
    artifactContentHash: hashArtifactValue({ release, contentManifest }),
    sourceBundleHash: baseSiteArtifact.sourceBundleHash,
  };
}

export function productArtifactHash(artifact) {
  return hashArtifactValue(productArtifactIdentity(artifact));
}

export function assertProductArtifactIdentity({ release, contentManifest, baseSiteArtifact } = {}, { version, commit } = {}) {
  if (!release || typeof release !== "object") throw new Error("ProductArtifact release.json is missing");
  if (!contentManifest || typeof contentManifest !== "object") throw new Error("ProductArtifact content-manifest.json is missing");
  if (!baseSiteArtifact || typeof baseSiteArtifact !== "object") throw new Error("ProductArtifact base-site-artifact.json is missing");
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
  const artifact = { release, contentManifest, baseSiteArtifact };
  const identity = productArtifactIdentity(artifact);
  return {
    ...artifact,
    productArtifactId: expectedBaseId,
    productArtifactHash: productArtifactHash(artifact),
    identity,
  };
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
