import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const CONTENT_RELEASE_RECEIPT_VERSION = "content-release-receipt-v1";

const targetCollections = Object.freeze({
  content: "publishedSlugs",
  article: "publishedArticleSlugs",
  practice: "practiceIds",
  profile: "profileIds",
  businessObservation: "businessObservationIds",
});

export const contentTargetCollectionNames = Object.freeze(Object.values(targetCollections));

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function exactStringArray(value, field, packageDirectory) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) {
    throw new Error(`content release receipt ${field} is invalid: ${packageDirectory}`);
  }
  return [...new Set(value)].sort();
}

export function receiptTargetCollections(receipt, { validateDeclared = true, packageDirectory = "content package" } = {}) {
  const collection = targetCollections[receipt?.kind];
  if (!collection || typeof receipt?.target !== "string" || !receipt.target) {
    throw new Error(`content release receipt target identity is invalid: ${packageDirectory}`);
  }
  const expected = Object.fromEntries(contentTargetCollectionNames.map((field) => [field, field === collection ? [receipt.target] : []]));
  if (validateDeclared) {
    for (const field of contentTargetCollectionNames) {
      if (receipt[field] == null) continue;
      const actual = exactStringArray(receipt[field], field, packageDirectory);
      if (JSON.stringify(actual) !== JSON.stringify(expected[field])) {
        throw new Error(`content release receipt ${field} does not match kind/target: ${packageDirectory}`);
      }
    }
  }
  return expected;
}

function requireString(value, field, packageDirectory) {
  if (typeof value !== "string" || !value) throw new Error(`content release receipt ${field} is missing: ${packageDirectory}`);
  return value;
}

function assertEqual(actual, expected, field, packageDirectory) {
  if (actual !== expected) throw new Error(`content release receipt ${field} mismatch: ${packageDirectory}`);
}

async function readProjection(packageDirectory, release, collections) {
  const projectionPath = path.join(packageDirectory, "dist", "client", "content-manifest.json");
  let projection;
  try {
    projection = JSON.parse(await readFile(projectionPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { projection: null, projectionPath, projectionStatus: "missing-legacy" };
    throw new Error(`content release projection is unreadable: ${projectionPath}: ${error.message}`);
  }
  for (const field of ["contentReleaseId", "contentHash", "kind", "target", "targetPath"]) {
    if (projection[field] == null) throw new Error(`content release projection is partial; missing ${field}: ${projectionPath}`);
    assertEqual(projection[field], release[field], `projection ${field}`, packageDirectory);
  }
  if (projection.packageRevisionId != null || release.packageRevisionId != null) {
    assertEqual(projection.packageRevisionId || null, release.packageRevisionId || null, "projection packageRevisionId", packageDirectory);
  }
  // Legacy intent projections were built before transport bound the current
  // ProductArtifact. A missing/null base id is tolerated; a declared id may
  // never drift from the lifecycle receipt.
  if (projection.baseSiteArtifactId != null) {
    assertEqual(projection.baseSiteArtifactId, release.baseSiteArtifactId, "projection baseSiteArtifactId", packageDirectory);
  }
  // A package projection is a derived, single-release view. Global active
  // collections belong to the Coordinator's ActiveContentSet and may be
  // absent or stale in legacy/finalized package output. The receipt and
  // completion facts above remain the only source for this release's target
  // collections.
  return {
    projection,
    projectionPath,
    projectionStatus: projection.baseSiteArtifactId == null ? "legacy-base-missing" : "verified",
  };
}

export async function readContentReleaseReceipt(packageDirectory) {
  const releasePath = path.join(packageDirectory, "content-release.json");
  let release;
  try {
    release = JSON.parse(await readFile(releasePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(`content release lifecycle fact is unreadable: ${releasePath}: ${error.message}`);
  }
  if (release.state !== "released") return null;
  for (const field of ["contentReleaseId", "contentHash", "kind", "target", "baseSiteArtifactId", "deploymentId"]) {
    requireString(release[field], field, packageDirectory);
  }
  if (!release.publicVerify || typeof release.publicVerify !== "object") {
    throw new Error(`content release receipt publicVerify is missing: ${packageDirectory}`);
  }
  const collections = receiptTargetCollections(release, { packageDirectory });
  const completionPath = path.join(packageDirectory, "completion.json");
  let completion;
  try {
    completion = JSON.parse(await readFile(completionPath, "utf8"));
  } catch (error) {
    throw new Error(`content release completion fact is missing or unreadable: ${completionPath}: ${error.message}`);
  }
  for (const field of ["contentReleaseId", "contentHash", "kind", "target", "baseSiteArtifactId"]) {
    requireString(completion[field], `completion ${field}`, packageDirectory);
    assertEqual(completion[field], release[field], `completion ${field}`, packageDirectory);
  }
  receiptTargetCollections(completion, { packageDirectory });
  if (completion.packageRevisionId != null || release.packageRevisionId != null) {
    assertEqual(completion.packageRevisionId || null, release.packageRevisionId || null, "completion packageRevisionId", packageDirectory);
  }
  for (const field of ["sitePublicationId", "deploymentId", "productVersion", "productCommit"]) {
    if (completion[field] != null) assertEqual(completion[field], release[field] ?? release[`base${field[0].toUpperCase()}${field.slice(1)}`], `completion ${field}`, packageDirectory);
  }
  const projectionEvidence = await readProjection(packageDirectory, release, collections);
  const receiptIdentity = {
    receiptVersion: CONTENT_RELEASE_RECEIPT_VERSION,
    contentReleaseId: release.contentReleaseId,
    packageRevisionId: release.packageRevisionId || null,
    contentHash: release.contentHash,
    kind: release.kind,
    target: release.target,
    targetPath: release.targetPath || null,
    baseSiteArtifactId: release.baseSiteArtifactId,
    ...collections,
  };
  return {
    ...release,
    ...collections,
    receiptVersion: CONTENT_RELEASE_RECEIPT_VERSION,
    receiptHash: stableHash(receiptIdentity),
    receiptIdentity,
    completion,
    completionPath,
    releasePath,
    packageDirectory,
    ...projectionEvidence,
  };
}

export function contentReceiptProjection(receipt, { baseSiteArtifactId = receipt.baseSiteArtifactId } = {}) {
  const collections = receiptTargetCollections(receipt, { packageDirectory: receipt.packageDirectory || receipt.contentReleaseId });
  const identity = {
    receiptVersion: CONTENT_RELEASE_RECEIPT_VERSION,
    contentReleaseId: receipt.contentReleaseId,
    packageRevisionId: receipt.packageRevisionId || null,
    contentHash: receipt.contentHash,
    kind: receipt.kind,
    target: receipt.target,
    targetPath: receipt.targetPath || null,
    baseSiteArtifactId,
    ...collections,
  };
  return { ...identity, receiptHash: stableHash(identity) };
}
