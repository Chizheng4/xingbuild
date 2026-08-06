import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveContentLifecycleTimes } from "./content-lifecycle-time.mjs";

export const CONTENT_RELEASE_RECEIPT_VERSION = "content-release-receipt-v1";
export const ACTIVE_CONTENT_PROJECTION_VERSION = "active-content-projection-v1";

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

function normalizedStringArray(value = []) {
  return [...new Set(Array.isArray(value) ? value.filter((item) => typeof item === "string" && item) : [])].sort();
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
  for (const field of ["logicalContentId", "changeSetId"]) {
    if (projection[field] != null || release[field] != null) assertEqual(projection[field] || null, release[field] || null, `projection ${field}`, packageDirectory);
  }
  if (projection.changedTargets != null || release.changedTargets != null) {
    assertEqual(JSON.stringify(projection.changedTargets || []), JSON.stringify(release.changedTargets || []), "projection changedTargets", packageDirectory);
  }
  for (const field of ["beforeHash", "afterHash"]) {
    if (projection[field] != null || release[field] != null) assertEqual(projection[field] || null, release[field] || null, `projection ${field}`, packageDirectory);
  }
  // Legacy intent projections were built before transport bound the current
  // ProductArtifact. A missing/null base id is tolerated; a declared id may
  // never drift from the lifecycle receipt.
  if (projection.baseSiteArtifactId != null) {
    assertEqual(projection.baseSiteArtifactId, release.baseSiteArtifactId, "projection baseSiteArtifactId", packageDirectory);
  }
  const lifecycleTimes = resolveContentLifecycleTimes(release, { now: () => "1970-01-01T00:00:00.000Z" });
  const declaresLifecycleFields = Object.hasOwn(projection, "firstPublishedAt") || Object.hasOwn(projection, "revisionReleasedAt");
  if (declaresLifecycleFields) {
    for (const field of ["firstPublishedAt", "revisionReleasedAt", "publishedAt"]) {
      assertEqual(projection[field] ?? null, lifecycleTimes[field] ?? null, `projection ${field}`, packageDirectory);
    }
  }
  // Old package projections sometimes copied the content body's date rather
  // than the lifecycle receipt. Their missing new fields are legacy evidence,
  // so keep them readable; once either new field is declared, publishedAt must
  // be the first-publication compatibility projection.
  if (projection.publishedAt != null && (projection.firstPublishedAt != null || projection.revisionReleasedAt != null)) {
    assertEqual(projection.publishedAt, lifecycleTimes.publishedAt, "projection publishedAt", packageDirectory);
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
  for (const field of ["logicalContentId", "changeSetId"]) {
    if (completion[field] != null) assertEqual(completion[field], release[field] || null, `completion ${field}`, packageDirectory);
  }
  if (completion.changedTargets != null || release.changedTargets != null) {
    if (completion.changedTargets != null) assertEqual(JSON.stringify(completion.changedTargets), JSON.stringify(release.changedTargets || []), "completion changedTargets", packageDirectory);
  }
  for (const field of ["beforeHash", "afterHash"]) {
    if (completion[field] != null) assertEqual(completion[field] || null, release[field] || null, `completion ${field}`, packageDirectory);
  }
  if (completion.packageRevisionId != null || release.packageRevisionId != null) {
    assertEqual(completion.packageRevisionId || null, release.packageRevisionId || null, "completion packageRevisionId", packageDirectory);
  }
  for (const field of ["predecessorReceiptId", "supersedesPackageId"]) {
    // These lineage fields were added after the original receipt corpus. An
    // absent value in a legacy completion fact is compatible; once the
    // completion explicitly carries a field it must match the immutable
    // receipt exactly, unless the completion carries the immutable
    // PublicationLineageBinding projection.  A binding is the only allowed
    // runtime correction for a legacy self-reference; the package receipt is
    // intentionally left untouched.
    if (Object.hasOwn(completion, field)) {
      const bindingValue = field === "predecessorReceiptId"
        ? completion.lineageBinding?.predecessorReceiptId
        : completion.lineageBinding?.predecessorPackageId;
      const expectedValue = completion.lineageBinding ? bindingValue : release[field] || null;
      assertEqual(completion[field] || null, expectedValue || null, `completion ${field}`, packageDirectory);
    }
  }
  for (const field of ["sitePublicationId", "deploymentId", "productVersion", "productCommit"]) {
    if (completion[field] != null) assertEqual(completion[field], release[field] ?? release[`base${field[0].toUpperCase()}${field.slice(1)}`], `completion ${field}`, packageDirectory);
  }
  const lifecycleTimes = resolveContentLifecycleTimes(release, { now: () => "1970-01-01T00:00:00.000Z" });
  const declaresLifecycleFields = Object.hasOwn(completion, "firstPublishedAt") || Object.hasOwn(completion, "revisionReleasedAt");
  if (declaresLifecycleFields) {
    for (const field of ["firstPublishedAt", "revisionReleasedAt", "publishedAt"]) {
      assertEqual(completion[field] ?? null, lifecycleTimes[field] ?? null, `completion ${field}`, packageDirectory);
    }
  }
  const projectionEvidence = await readProjection(packageDirectory, release, collections);
  const receiptIdentity = contentReceiptIdentity(release, { baseSiteArtifactId: release.baseSiteArtifactId });
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

export function contentReceiptIdentity(receipt, { baseSiteArtifactId = receipt?.baseSiteArtifactId || null } = {}) {
  const collections = receiptTargetCollections(receipt, { packageDirectory: receipt?.packageDirectory || receipt?.contentReleaseId || "content release receipt" });
  const lifecycleTimes = resolveContentLifecycleTimes(receipt, { now: () => "1970-01-01T00:00:00.000Z" });
  return {
    receiptVersion: CONTENT_RELEASE_RECEIPT_VERSION,
    contentReleaseId: receipt.contentReleaseId,
    logicalContentId: receipt.logicalContentId || null,
    packageRevisionId: receipt.packageRevisionId || null,
    predecessorReceiptId: receipt.predecessorReceiptId || null,
    supersedesPackageId: receipt.supersedesPackageId || null,
    contentHash: receipt.contentHash,
    kind: receipt.kind,
    target: receipt.target,
    targetPath: receipt.targetPath || null,
    changeSetId: receipt.changeSetId || null,
    changedTargets: receipt.changedTargets || [],
    beforeHash: receipt.beforeHash || null,
    afterHash: receipt.afterHash || null,
    baseSiteArtifactId,
    firstPublishedAt: lifecycleTimes.firstPublishedAt,
    revisionReleasedAt: lifecycleTimes.revisionReleasedAt,
    publishedAt: lifecycleTimes.publishedAt,
    ...collections,
  };
}

export function createImmutableContentReceiptProjection(receipt, { baseSiteArtifactId = receipt?.baseSiteArtifactId || null, preserveReceiptHash = true } = {}) {
  const receiptIdentity = receipt?.receiptIdentity || contentReceiptIdentity(receipt, { baseSiteArtifactId });
  const computedReceiptHash = stableHash(receiptIdentity);
  if (receipt?.receiptIdentity && receipt?.receiptHash && receipt.receiptHash !== computedReceiptHash) {
    throw new Error(`ContentReleaseReceipt receiptHash drift: ${receipt.contentReleaseId || "unknown"}`);
  }
  return {
    ...receiptIdentity,
    // A released receipt may carry a legacy hash whose raw identity predates
    // Registry-derived logicalContentId fields. Active readers preserve that
    // package fact; untrusted candidate manifests must be recomputed.
    receiptHash: preserveReceiptHash && receipt?.receiptHash ? receipt.receiptHash : computedReceiptHash,
  };
}

/**
 * The package projection is intentionally separate from the active-site
 * projection.  Its hash is the immutable receipt identity and never absorbs
 * Registry, lineage binding, or the current ProductArtifact.
 */
export function contentReceiptProjection(receipt, { baseSiteArtifactId = receipt?.baseSiteArtifactId || null } = {}) {
  return createImmutableContentReceiptProjection(receipt, { baseSiteArtifactId });
}

export function activeContentProjectionIdentity(projection = {}) {
  return {
    projectionVersion: ACTIVE_CONTENT_PROJECTION_VERSION,
    contentReleaseId: projection.contentReleaseId,
    receiptId: projection.receiptId || null,
    logicalContentId: projection.logicalContentId || null,
    packageRevisionId: projection.packageRevisionId || null,
    receiptHash: projection.receiptHash,
    predecessorReceiptId: projection.predecessorReceiptId || null,
    supersedesPackageId: projection.supersedesPackageId || null,
    lineageBindingId: projection.lineageBindingId || null,
    registryRevision: Number.isInteger(projection.registryRevision) ? projection.registryRevision : null,
    baseSiteArtifactId: projection.baseSiteArtifactId || null,
    contentHash: projection.contentHash,
    kind: projection.kind,
    target: projection.target,
    targetPath: projection.targetPath || null,
    changeSetId: projection.changeSetId || null,
    changedTargets: projection.changedTargets || [],
    beforeHash: projection.beforeHash || null,
    afterHash: projection.afterHash || null,
    firstPublishedAt: projection.firstPublishedAt || null,
    revisionReleasedAt: projection.revisionReleasedAt || null,
    publishedAt: projection.publishedAt || null,
    publishedSlugs: normalizedStringArray(projection.publishedSlugs),
    publishedArticleSlugs: normalizedStringArray(projection.publishedArticleSlugs),
    practiceIds: normalizedStringArray(projection.practiceIds),
    profileIds: normalizedStringArray(projection.profileIds),
    businessObservationIds: normalizedStringArray(projection.businessObservationIds),
    mediaPaths: normalizedStringArray(projection.mediaPaths),
  };
}

export function createActiveContentProjection({ receipt, activeSlot = null, lineageBinding = null, productArtifactId = null, registryRevision = null, mediaPaths = [] } = {}) {
  if (!receipt || typeof receipt !== "object") throw new Error("ActiveContentProjection receipt is required");
  const packageProjection = createImmutableContentReceiptProjection(receipt, { baseSiteArtifactId: receipt.baseSiteArtifactId || null });
  const logicalContentId = receipt.logicalContentId || (receipt.kind && receipt.target ? `${receipt.kind}:${receipt.target}` : null);
  const receiptId = receipt.receiptId || (receipt.contentReleaseId ? `${receipt.contentReleaseId}${receipt.packageRevisionId ? `@${receipt.packageRevisionId}` : ""}` : null);
  if (!receiptId || !logicalContentId || !packageProjection.receiptHash) throw new Error("ActiveContentProjection immutable receipt identity is incomplete");
  if (activeSlot) {
    if (activeSlot.logicalContentId !== logicalContentId) throw new Error(`ActiveContentProjection logical identity drift: ${logicalContentId}`);
    const predecessorReceiptId = lineageBinding?.predecessorReceiptId || null;
    const activeReceiptMatches = !activeSlot.activeReceiptId || activeSlot.activeReceiptId === receiptId || activeSlot.activeReceiptId === predecessorReceiptId;
    if (!activeReceiptMatches) throw new Error(`ActiveContentProjection active receipt drift: ${logicalContentId}`);
    if (activeSlot.activeContentReleaseId && activeSlot.activeContentReleaseId !== receipt.contentReleaseId) throw new Error(`ActiveContentProjection content release drift: ${logicalContentId}`);
    const predecessorPackageRevisionId = activeSlot.activePackageRevisionId && activeSlot.activeReceiptId === predecessorReceiptId
      ? activeSlot.activePackageRevisionId
      : null;
    if (activeSlot.activePackageRevisionId
      && activeSlot.activePackageRevisionId !== (receipt.packageRevisionId || null)
      && activeSlot.activePackageRevisionId !== predecessorPackageRevisionId) throw new Error(`ActiveContentProjection package revision drift: ${logicalContentId}`);
  }
  if (lineageBinding) {
    if (lineageBinding.logicalContentId !== logicalContentId
      || lineageBinding.candidateContentReleaseId !== receipt.contentReleaseId
      || lineageBinding.packageRevisionId !== (receipt.packageRevisionId || null)) {
      throw new Error(`ActiveContentProjection lineage binding drift: ${logicalContentId}`);
    }
  }
  const projection = {
    projectionVersion: ACTIVE_CONTENT_PROJECTION_VERSION,
    contentReleaseId: receipt.contentReleaseId,
    receiptId,
    logicalContentId,
    packageRevisionId: receipt.packageRevisionId || null,
    receiptHash: packageProjection.receiptHash,
    predecessorReceiptId: lineageBinding?.predecessorReceiptId || activeSlot?.predecessorReceiptId || receipt.predecessorReceiptId || null,
    supersedesPackageId: lineageBinding?.predecessorPackageId || receipt.supersedesPackageId || null,
    lineageBindingId: lineageBinding?.lineageBindingId || null,
    registryRevision: Number.isInteger(registryRevision) ? registryRevision : (Number.isInteger(activeSlot?.registryRevision) ? activeSlot.registryRevision : null),
    baseSiteArtifactId: productArtifactId || receipt.baseSiteArtifactId || null,
    contentHash: receipt.contentHash,
    kind: receipt.kind,
    target: receipt.target,
    targetPath: receipt.targetPath || null,
    changeSetId: receipt.changeSetId || null,
    changedTargets: receipt.changedTargets || [],
    beforeHash: receipt.beforeHash || null,
    afterHash: receipt.afterHash || null,
    firstPublishedAt: receipt.firstPublishedAt || null,
    revisionReleasedAt: receipt.revisionReleasedAt || null,
    publishedAt: receipt.publishedAt || null,
    ...receiptTargetCollections(receipt, { packageDirectory: receipt.packageDirectory || receipt.contentReleaseId }),
    mediaPaths: normalizedStringArray(mediaPaths.length ? mediaPaths : receipt.mediaPaths),
  };
  const identity = activeContentProjectionIdentity(projection);
  return { ...projection, projectionHash: stableHash(identity) };
}

export function assertActiveContentProjection(projection) {
  if (!projection || projection.projectionVersion !== ACTIVE_CONTENT_PROJECTION_VERSION) throw new Error("ActiveContentProjection version is unsupported");
  if (typeof projection.receiptHash !== "string" || !projection.receiptHash) throw new Error("ActiveContentProjection receiptHash is missing");
  if (typeof projection.projectionHash !== "string" || !projection.projectionHash) throw new Error("ActiveContentProjection projectionHash is missing");
  const expected = stableHash(activeContentProjectionIdentity(projection));
  if (projection.projectionHash !== expected) throw new Error(`ActiveContentProjection projectionHash drift: ${projection.contentReleaseId}`);
  return projection;
}
