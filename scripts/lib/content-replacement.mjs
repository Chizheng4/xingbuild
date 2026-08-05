import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { contentRootDirectory } from "./content-root.mjs";
import { hashFile } from "./observation-content.mjs";

export const CONTENT_PACKAGE_CONTRACT_VERSION = "content-package-revision-v1";
export const CONTENT_REPLACEMENT_STATES = Object.freeze(new Set(["prepared", "built", "recoverable", "transported", "verifying"]));

function stableJson(value) {
  return JSON.stringify(value);
}

function requireString(value, field, location) {
  if (typeof value !== "string" || !value) throw new Error(`content replacement ${field} is missing: ${location}`);
  return value;
}

function targetDirectory(kind) {
  return kind === "content" ? "observations"
    : kind === "article" ? "articles"
      : kind === "profile" ? "profile"
        : kind === "businessObservation" ? "business-observations"
          : "products";
}

export function contentPackageRevisionIdentity({ contentReleaseId, logicalContentId, contentHash, sourceHash, baseSiteArtifactId } = {}) {
  const tuple = { contentReleaseId, contentHash, sourceHash, baseSiteArtifactId, contractVersion: CONTENT_PACKAGE_CONTRACT_VERSION };
  if (logicalContentId) tuple.logicalContentId = logicalContentId;
  const revisionHash = createHash("sha256").update(stableJson(tuple)).digest("hex");
  return { tuple, revisionHash, packageRevisionId: `revision-${revisionHash.slice(0, 16)}` };
}

export function contentPackageSlotId(value) {
  return value?.packageRevisionId || value?.contentReleaseId || null;
}

export function contentLogicalSlotId(value) {
  return value?.logicalContentId || (value?.kind && value?.target ? `${value.kind}:${value.target}` : value?.contentReleaseId || null);
}

export function assertSameLogicalContent(actual, expected, location = "content replacement") {
  const logicalIdentity = actual?.logicalContentId || expected?.logicalContentId;
  if (logicalIdentity && contentLogicalSlotId(actual) !== contentLogicalSlotId(expected)) {
    throw new Error(`content replacement logical logicalContentId drift: ${location}`);
  }
  const fields = logicalIdentity ? ["kind", "target"] : ["contentReleaseId", "contentHash", "kind", "target"];
  for (const field of fields) {
    const actualValue = field === "logicalContentId" ? contentLogicalSlotId(actual) : actual?.[field];
    const expectedValue = field === "logicalContentId" ? contentLogicalSlotId(expected) : expected?.[field];
    if ((actualValue ?? null) !== (expectedValue ?? null)) {
      throw new Error(`content replacement logical ${field} drift: ${location}`);
    }
  }
  return true;
}

function assertReplacementFacts(candidate, activeReceipt, location) {
  for (const field of ["targetPath", "reviewedAt", "publishedAt"]) {
    if (activeReceipt?.[field] != null && candidate?.[field] !== activeReceipt[field]) {
      throw new Error(`content replacement ${field} drift: ${location}`);
    }
  }
  for (const field of ["sources", "sourceRefs"]) {
    if (Array.isArray(activeReceipt?.[field]) && activeReceipt[field].length > 0
      && stableJson(candidate?.[field] || []) !== stableJson(activeReceipt[field])) {
      throw new Error(`content replacement ${field} drift: ${location}`);
    }
  }
}

export async function assertContentPackageRevisionRecord(manifest, packageDirectory) {
  const location = packageDirectory || manifest?.packageRevisionId || "content revision";
  for (const field of ["contentReleaseId", "contentHash", "sourceHash", "baseSiteArtifactId", "packageRevisionId", "revisionHash", "supersedesPackageId"]) {
    requireString(manifest?.[field], field, location);
  }
  if (manifest.contractVersion !== CONTENT_PACKAGE_CONTRACT_VERSION) {
    throw new Error(`content replacement contractVersion drift: ${location}`);
  }
  const identity = contentPackageRevisionIdentity(manifest);
  if (manifest.packageRevisionId !== identity.packageRevisionId || manifest.revisionHash !== identity.revisionHash || stableJson(manifest.revisionTuple) !== stableJson(identity.tuple)) {
    throw new Error(`content replacement revision tuple drift: ${location}`);
  }
  if (packageDirectory && path.basename(packageDirectory) !== manifest.packageRevisionId) {
    throw new Error(`content replacement revision directory drift: ${location}`);
  }
  let lineage;
  try {
    lineage = JSON.parse(await readFile(path.join(packageDirectory, "package-lineage.json"), "utf8"));
  } catch (error) {
    throw new Error(`content replacement lineage is missing or unreadable: ${location}: ${error.message}`);
  }
  if (lineage.type !== "ContentPackageLineage"
    || lineage.contentReleaseId !== manifest.contentReleaseId
    || (manifest.logicalContentId != null && lineage.logicalContentId !== manifest.logicalContentId)
    || lineage.packageRevisionId !== manifest.packageRevisionId
    || lineage.supersedesPackageId !== manifest.supersedesPackageId
    || stableJson(lineage.revisionTuple) !== stableJson(identity.tuple)) {
    throw new Error(`content replacement lineage drift: ${location}`);
  }
  return { identity, lineage };
}

export async function selectReleasedContentPackage(candidates, contentReleaseId) {
  if (!candidates.length) return null;
  const location = contentReleaseId || candidates[0]?.release?.contentReleaseId || "content release";
  const baseline = candidates[0].release;
  const bySlot = new Map();
  for (const candidate of candidates) {
    assertSameLogicalContent(candidate.release, baseline, location);
    const slotId = contentPackageSlotId(candidate.release);
    if (!slotId || bySlot.has(slotId)) throw new Error(`released content package slot conflict: ${location}`);
    if (candidate.release.packageRevisionId) await assertContentPackageRevisionRecord(candidate.release, candidate.packageDirectory);
    bySlot.set(slotId, candidate);
  }
  const superseded = new Set();
  for (const candidate of candidates) {
    if (!candidate.release.packageRevisionId) continue;
    if (!bySlot.has(candidate.release.supersedesPackageId)) {
      throw new Error(`released content replacement lineage target is missing: ${location}`);
    }
    superseded.add(candidate.release.supersedesPackageId);
  }
  const leaves = candidates.filter((candidate) => !superseded.has(contentPackageSlotId(candidate.release)));
  if (leaves.length !== 1) throw new Error(`released content replacement has no unique active slot: ${location}`);
  return leaves[0];
}

export async function validateContentReplacement({ candidate, candidatePackageDirectory, activeReceipt, productArtifactId, sourceRoot } = {}) {
  const location = candidatePackageDirectory || candidate?.packageRevisionId || "content replacement";
  if (!CONTENT_REPLACEMENT_STATES.has(candidate?.state)) {
    throw new Error(`content replacement state is not eligible: ${candidate?.state || "missing"}`);
  }
  assertSameLogicalContent(candidate, activeReceipt, location);
  const logicalHashUpdate = Boolean((candidate?.logicalContentId || activeReceipt?.logicalContentId)
    && contentLogicalSlotId(candidate) === contentLogicalSlotId(activeReceipt)
    && candidate.contentHash !== activeReceipt.contentHash);
  if (logicalHashUpdate && (!candidate.changeSetId || !Array.isArray(candidate.changedTargets) || candidate.changedTargets.length === 0 || !Array.isArray(candidate.operations) || candidate.operations.length !== candidate.changedTargets.length)) {
    throw new Error(`content replacement hash update requires approved ChangeSet lineage: ${location}`);
  }
  assertReplacementFacts(candidate, activeReceipt, location);
  await assertContentPackageRevisionRecord(candidate, candidatePackageDirectory);
  const activeSlotId = contentPackageSlotId(activeReceipt);
  if (candidate.supersedesPackageId !== activeSlotId) {
    throw new Error(`content replacement does not supersede the active package slot: ${location}`);
  }
  if (!productArtifactId || candidate.baseSiteArtifactId !== productArtifactId) {
    throw new Error(`content replacement baseSiteArtifactId drift: ${location}`);
  }

  const directory = targetDirectory(candidate.kind);
  const relative = path.join(directory, `${candidate.target}.json`);
  const canonicalPath = path.join(contentRootDirectory({ sourceRoot }), relative);
  const draftPath = path.join(sourceRoot, ".content-workspace", "drafts", `${candidate.target}.json`);
  const recoveryPath = path.join(sourceRoot, ".content-workspace", "recoveries", `${candidate.target}.json`);
  const reviewPath = path.join(sourceRoot, ".content-workspace", "reviews", `${candidate.target}.json`);
  const packageSourcePath = path.join(candidatePackageDirectory, "source", ".content-workspace", "content", relative);
  let review;
  try {
    review = JSON.parse(await readFile(reviewPath, "utf8"));
  } catch (error) {
    throw new Error(`content replacement approved review is missing or unreadable: ${location}: ${error.message}`);
  }
  if (review.status !== "approved"
    || (!logicalHashUpdate && review.contentHash !== candidate.sourceHash)
    || (logicalHashUpdate && ![candidate.sourceHash, candidate.contentHash].includes(review.contentHash))
    || (candidate.reviewedAt && review.reviewedAt !== candidate.reviewedAt)) {
    throw new Error(`content replacement approved review drift: ${location}`);
  }
  let hashes;
  try {
    hashes = await Promise.all([canonicalPath, draftPath, recoveryPath, packageSourcePath].map(hashFile));
  } catch (error) {
    throw new Error(`content replacement source lifecycle is missing or unreadable: ${location}: ${error.message}`);
  }
  const lifecycleDrift = logicalHashUpdate
    ? hashes[3] !== candidate.sourceHash || new Set(hashes.slice(0, 3)).size !== 1
    : hashes.some((value) => value !== candidate.sourceHash) || candidate.contentHash !== candidate.sourceHash;
  if (lifecycleDrift) {
    throw new Error(`content replacement source lifecycle hash drift: ${location}`);
  }
  const canonical = JSON.parse(await readFile(canonicalPath, "utf8"));
  const canonicalTarget = candidate.kind === "content" || candidate.kind === "article" ? canonical.slug : canonical.id;
  if (canonicalTarget !== candidate.target) throw new Error(`content replacement canonical target drift: ${location}`);
  return {
    contentReleaseId: candidate.contentReleaseId,
    packageRevisionId: candidate.packageRevisionId,
    supersedesPackageId: candidate.supersedesPackageId,
    previousPackageRevisionId: activeReceipt.packageRevisionId || null,
    previousReceiptHash: activeReceipt.receiptHash,
  };
}
