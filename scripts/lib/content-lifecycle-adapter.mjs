import { access, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { contentFilePath, contentMediaManifestPath, contentRelativePath } from "./content-root.mjs";
import { hashFile } from "./observation-content.mjs";
import { hashValue, applyContentChangeSetDocuments, contentChangeSetOperations, readFieldValue } from "./content-targets.mjs";
import { writeJsonAtomically } from "./content-release-state.mjs";

/**
 * Content lifecycle is kind-specific evidence, not a filename convention.
 * The registry is deliberately small: callers select an adapter once and
 * prepare, reconcile and finalize through the same object.
 */
export const CONTENT_LIFECYCLE_KINDS = Object.freeze([
  "content",
  "article",
  "practice",
  "profile",
  "businessObservation",
]);

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

function jsonHash(value) {
  return hashValue(value);
}

function targetFromLogicalId(logicalContentId) {
  if (typeof logicalContentId !== "string") return null;
  const separator = logicalContentId.indexOf(":");
  return separator > 0 ? { kind: logicalContentId.slice(0, separator), target: logicalContentId.slice(separator + 1) } : null;
}

function identityOf(packageInfo = {}) {
  const kind = packageInfo.kind || targetFromLogicalId(packageInfo.logicalContentId)?.kind;
  const target = packageInfo.target || targetFromLogicalId(packageInfo.logicalContentId)?.target;
  if (!kind || !target) throw new Error("content lifecycle identity requires kind and target");
  return { kind, target, logicalContentId: packageInfo.logicalContentId || `${kind}:${target}` };
}

function canonicalPathFor(kind, target, sourceRoot) {
  return contentFilePath(kind, target, { sourceRoot });
}

function genericReviewPath(sourceRoot, target) {
  return path.join(sourceRoot, ".content-workspace", "reviews", `${target}.json`);
}

function packageSourcePath(packageDirectory, relative) {
  return path.join(packageDirectory, "source", ".content-workspace", "content", relative);
}

function practiceSnapshotHash(product, media) {
  return jsonHash({ value: product, media: media || null });
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function operationAfter(operation) {
  return operation.afterValue !== undefined ? operation.afterValue : operation.after;
}

function operationBefore(operation) {
  return operation.beforeValue !== undefined ? operation.beforeValue : operation.before;
}

function operationsFor(packageInfo, changeSet) {
  const operations = contentChangeSetOperations(changeSet || packageInfo);
  if (!Array.isArray(operations) || operations.length === 0) throw new Error("content lifecycle ChangeSet operations are required");
  return operations;
}

async function readJson(file, label) {
  if (!(await exists(file))) throw new Error(`content lifecycle ${label} is missing: ${file}`);
  try { return JSON.parse(await readFile(file, "utf8")); } catch (error) {
    throw new Error(`content lifecycle ${label} is invalid: ${error.message}`);
  }
}

function mediaEvidence(review, media, operations, logicalContentId, afterHash) {
  if (!review || review.status !== "approved") throw new Error("content lifecycle Practice review is not approved");
  if (!media || media.reviewStatus !== "approved" || media.publicStatus !== "public") {
    throw new Error("content lifecycle Practice media manifest is not approved/public");
  }
  const assets = new Map((media.assets || []).map((asset) => [asset.id, asset]));
  const mediaIds = new Set();
  for (const [index, operation] of operations.entries()) {
    const provenance = operation.provenance || {};
    const mediaId = provenance.mediaId || operation.afterValue || operation.after;
    if (!mediaId) throw new Error(`content lifecycle Practice operation ${index + 1} media provenance is missing`);
    const asset = assets.get(mediaId);
    if (!asset || asset.reviewStatus !== "approved" || asset.publicStatus !== "public") {
      throw new Error(`content lifecycle Practice media approval is invalid: ${mediaId}`);
    }
    if (provenance.approvalStatus !== "approved" || provenance.assetSha256 && provenance.assetSha256 !== asset.assetSha256) {
      throw new Error(`content lifecycle Practice media provenance is invalid: ${mediaId}`);
    }
    mediaIds.add(mediaId);
  }
  const reviewMedia = review.mediaReview || {};
  if (reviewMedia.status && reviewMedia.status !== "approved") throw new Error("content lifecycle Practice media review is not approved");
  if (reviewMedia.sha256 && [...mediaIds].some((id) => assets.get(id)?.assetSha256 !== reviewMedia.sha256)) {
    throw new Error("content lifecycle Practice review media hash drift");
  }
  return {
    reviewId: review.reviewId || null,
    reviewedAt: review.reviewedAt || null,
    logicalContentId,
    changeSetId: null,
    afterHash,
    mediaIds: [...mediaIds].sort(),
    mediaManifestHash: jsonHash(media),
    mediaApproval: [...mediaIds].sort().map((id) => ({
      mediaId: id,
      assetSha256: assets.get(id).assetSha256,
      reviewStatus: assets.get(id).reviewStatus,
      publicStatus: assets.get(id).publicStatus,
      provenance: clone(assets.get(id).provenance || {}),
    })),
  };
}

function genericAdapter(kind) {
  return {
    kind,
    async resolveCanonical({ sourceRoot, target, logicalContentId } = {}) {
      const file = canonicalPathFor(kind, target, sourceRoot);
      const value = await readJson(file, "canonical");
      const beforeHash = await hashFile(file);
      return { kind, target, logicalContentId: logicalContentId || `${kind}:${target}`, canonicalPath: file, beforeHash, beforeSnapshot: { [contentRelativePath(kind, target)]: clone(value) }, snapshot: clone(value), value };
    },
    async resolveReviewEvidence({ sourceRoot, target, canonical, packageInfo = {} } = {}) {
      const reviewPath = genericReviewPath(sourceRoot, target);
      if (!(await exists(reviewPath))) {
        if (kind === "content") throw new Error(`approved review is required for content target: ${target}`);
        return { reviewPath: null, review: null, reviewedAt: canonical?.value?.reviewedAt || canonical?.value?.updatedAt || null };
      }
      const review = await readJson(reviewPath, "review");
      if (review.status !== "approved") throw new Error(`content lifecycle review is not approved: ${target}`);
      if (kind === "content") {
        const draft = path.join(sourceRoot, ".content-workspace", "drafts", `${target}.json`);
        const recovery = path.join(sourceRoot, ".content-workspace", "recoveries", `${target}.json`);
        for (const file of [draft, recovery]) if (!(await exists(file))) throw new Error(`content lifecycle file is missing: ${path.relative(sourceRoot, file)}`);
        const expectedHash = await hashFile(draft);
        if (review.contentHash !== expectedHash || await hashFile(recovery) !== expectedHash) throw new Error(`content lifecycle hash drift/mismatch: ${target}`);
      }
      if (review.contentHash && canonical?.beforeHash && review.contentHash !== canonical.beforeHash && !packageInfo.changeSetId) {
        throw new Error(`content lifecycle review hash drift: ${target}`);
      }
      return { reviewPath, review, reviewedAt: review.reviewedAt || null };
    },
    async resolveRecoveryEvidence({ sourceRoot, target, packageInfo = {}, canonical } = {}) {
      const recovery = path.join(sourceRoot, ".content-workspace", "recoveries", `${target}.json`);
      return { type: "kind-specific-files", path: await exists(recovery) ? path.relative(sourceRoot, recovery) : null, beforeHash: canonical?.beforeHash || null, packageRevisionId: packageInfo.packageRevisionId || null };
    },
    async validateBefore({ packageInfo = {}, canonical, reviewEvidence } = {}) {
      const expectedBefore = packageInfo.logicalHashUpdate ? packageInfo.sourceHash : packageInfo.contentHash;
      if (canonical.beforeHash !== expectedBefore) throw new Error(`content reconcile canonical before hash drift: ${packageInfo.target}`);
      if (reviewEvidence?.review?.contentHash && reviewEvidence.review.contentHash !== expectedBefore) throw new Error(`content reconcile review hash drift: ${packageInfo.target}`);
      if (packageInfo.packageDirectory) {
        const sourcePath = path.join(packageInfo.packageDirectory, "source", ".content-workspace", "content", contentRelativePath(kind, packageInfo.target));
        const sourceExists = await exists(sourcePath);
        if (packageInfo.packageRevisionId && (!sourceExists || packageInfo.sourceHash && await hashFile(sourcePath) !== packageInfo.sourceHash)) {
          throw new Error(`content reconcile package after/source hash drift: ${packageInfo.target}`);
        }
      }
      return { beforeHash: canonical.beforeHash, afterHash: packageInfo.contentHash, beforeSnapshot: canonical.beforeSnapshot };
    },
    async validateAfter({ packageInfo = {}, canonical } = {}) {
      return { beforeHash: canonical?.beforeHash || null, afterHash: packageInfo.contentHash, afterSnapshot: packageInfo.afterSnapshot || null };
    },
    async createProof({ packageInfo = {}, canonical, reviewEvidence, changeSet } = {}) {
      const proof = await this.validateBefore({ packageInfo, canonical, reviewEvidence, changeSet });
      return {
        type: "ContentPackageProof",
        version: 1,
        kind,
        target: packageInfo.target,
        logicalContentId: packageInfo.logicalContentId || `${kind}:${packageInfo.target}`,
        beforeHash: proof.beforeHash,
        afterHash: proof.afterHash,
        beforeSnapshot: proof.beforeSnapshot,
        afterSnapshot: packageInfo.afterSnapshot || null,
        changeSetId: packageInfo.changeSetId || null,
        operations: packageInfo.operations || [],
        reviewEnvelope: reviewEvidence?.review ? {
          status: reviewEvidence.review.status,
          reviewId: reviewEvidence.review.reviewId || null,
          reviewedAt: reviewEvidence.review.reviewedAt || null,
          logicalContentId: packageInfo.logicalContentId || `${kind}:${packageInfo.target}`,
          afterHash: packageInfo.contentHash,
          contentHash: reviewEvidence.review.contentHash || null,
        } : {
          status: "approved",
          reviewId: null,
          reviewedAt: null,
          logicalContentId: packageInfo.logicalContentId || `${kind}:${packageInfo.target}`,
          afterHash: packageInfo.contentHash,
          contentHash: null,
        },
        recoveryEnvelope: await this.resolveRecoveryEvidence({ sourceRoot: packageInfo.sourceRoot, target: packageInfo.target, packageInfo, canonical }),
      };
    },
    async finalizeCanonical({ packageInfo = {} } = {}) {
      return { finalized: false, kind, target: packageInfo.target, reason: "kind-specific canonical finalization remains governed by existing lifecycle" };
    },
  };
}

const practiceAdapter = {
  kind: "practice",
  async resolveCanonical({ sourceRoot, target, logicalContentId } = {}) {
    const productPath = canonicalPathFor("practice", target, sourceRoot);
    const mediaPath = contentMediaManifestPath(target, { sourceRoot });
    const product = await readJson(productPath, "Practice canonical product");
    const media = await readJson(mediaPath, "Practice canonical media manifest");
    const beforeHash = practiceSnapshotHash(product, media);
    return {
      kind: "practice", target, logicalContentId: logicalContentId || `practice:${target}`,
      canonicalPath: productPath, mediaManifestPath: mediaPath,
      beforeHash, beforeSnapshot: { [`content/products/${target}.json`]: clone(product), [`content/media/${target}/manifest.json`]: clone(media) },
      snapshot: { product: clone(product), media: clone(media) }, product, media,
    };
  },
  async resolveReviewEvidence({ sourceRoot, target, canonical, packageInfo = {} } = {}) {
    const reviewPath = genericReviewPath(sourceRoot, target);
    const review = await readJson(reviewPath, "Practice review");
    const operations = operationsFor(packageInfo, packageInfo);
    const envelope = mediaEvidence(review, canonical.media, operations, packageInfo.logicalContentId || `practice:${target}`, packageInfo.contentHash);
    envelope.changeSetId = packageInfo.changeSetId || null;
    if (review.logicalContentId && review.logicalContentId !== envelope.logicalContentId) throw new Error("content lifecycle Practice review logicalContentId drift");
    if (review.changeSetId && review.changeSetId !== envelope.changeSetId) throw new Error("content lifecycle Practice review changeSetId drift");
    if (review.afterHash && review.afterHash !== packageInfo.contentHash) throw new Error("content lifecycle Practice review afterHash drift");
    return { reviewPath, review, reviewedAt: review.reviewedAt || null, envelope };
  },
  async resolveRecoveryEvidence({ packageInfo = {}, canonical } = {}) {
    const operations = operationsFor(packageInfo, packageInfo);
    const reverse = packageInfo.recovery?.operations || operations.slice().reverse().map((operation) => ({
      ...operation,
      before: operationAfter(operation), beforeValue: operationAfter(operation), beforeHash: operation.afterHash,
      after: operationBefore(operation), afterValue: operationBefore(operation), afterHash: operation.beforeHash,
    }));
    return {
      type: "operations-reverse",
      rollbackChangeId: packageInfo.recovery?.rollbackChangeId || `${packageInfo.changeSetId || "content-lifecycle"}-rollback`,
      beforeHash: canonical?.beforeHash || packageInfo.beforeHash || null,
      afterHash: packageInfo.contentHash,
      operations: clone(reverse),
      source: "package/recovery-before-snapshot",
    };
  },
  async validateBefore({ packageInfo = {}, canonical } = {}) {
    const operations = operationsFor(packageInfo, packageInfo);
    if (packageInfo.logicalContentId && packageInfo.logicalContentId !== `practice:${packageInfo.target}`) throw new Error("content reconcile Practice logicalContentId drift");
    const documents = {
      [`content/products/${packageInfo.target}.json`]: canonical.product,
      [`content/media/${packageInfo.target}/manifest.json`]: canonical.media,
    };
    for (const [index, operation] of operations.entries()) {
      if (operation.sourcePath !== "content/products/robotaxi.json" && operation.sourcePath !== "content/media/robotaxi/manifest.json") {
        throw new Error(`content reconcile Practice operation source is invalid: ${operation.targetId}`);
      }
      const document = documents[operation.sourcePath];
      if (!document) throw new Error(`content reconcile Practice source document is missing: ${operation.sourcePath}`);
      let actual;
      try { actual = readFieldValue(document, operation.fieldPath); } catch (error) {
        if (operationBefore(operation) === null) actual = null;
        else throw new Error(`content reconcile Practice before field ${index + 1} is invalid: ${error.message}`);
      }
      if (hashValue(actual) !== operation.beforeHash) throw new Error(`content reconcile Practice canonical before hash drift: ${operation.targetId}`);
    }
    const afterDocuments = applyContentChangeSetDocuments(documents, { ...packageInfo, operations });
    const afterProduct = afterDocuments[`content/products/${packageInfo.target}.json`];
    const afterMedia = afterDocuments[`content/media/${packageInfo.target}/manifest.json`];
    const afterHash = practiceSnapshotHash(afterProduct, afterMedia);
    if (afterHash !== packageInfo.contentHash) throw new Error(`content reconcile Practice after contentHash drift: ${packageInfo.target}`);
    const packageProductPath = packageSourcePath(packageInfo.packageDirectory, `products/${packageInfo.target}.json`);
    const packageMediaPath = packageSourcePath(packageInfo.packageDirectory, `media/${packageInfo.target}/manifest.json`);
    const packageProduct = await readJson(packageProductPath, "Practice package after product");
    const packageMedia = await readJson(packageMediaPath, "Practice package after media manifest");
    if (jsonHash(packageProduct) !== jsonHash(afterProduct) || jsonHash(packageMedia) !== jsonHash(afterMedia)) throw new Error(`content reconcile Practice package after snapshot drift: ${packageInfo.target}`);
    return {
      beforeHash: canonical.beforeHash,
      afterHash,
      beforeSnapshot: canonical.beforeSnapshot,
      afterSnapshot: { [`content/products/${packageInfo.target}.json`]: clone(packageProduct), [`content/media/${packageInfo.target}/manifest.json`]: clone(packageMedia) },
      operations: clone(operations),
    };
  },
  async validateAfter({ packageInfo = {}, canonical } = {}) {
    const proof = packageInfo.proofEnvelope || packageInfo.packageProof;
    if (!proof || proof.logicalContentId !== packageInfo.logicalContentId) throw new Error("content lifecycle Practice proof envelope is missing or has identity drift");
    if (proof.afterHash !== packageInfo.contentHash) throw new Error("content lifecycle Practice proof afterHash drift");
    return proof;
  },
  async createProof({ packageInfo = {}, canonical, reviewEvidence, changeSet } = {}) {
    const proof = await this.validateBefore({ packageInfo, canonical, changeSet });
    const reviewEnvelope = reviewEvidence?.envelope || (await this.resolveReviewEvidence({ sourceRoot: packageInfo.sourceRoot, target: packageInfo.target, canonical, packageInfo })).envelope;
    reviewEnvelope.changeSetId = packageInfo.changeSetId || null;
    reviewEnvelope.afterHash = proof.afterHash;
    const recoveryEnvelope = await this.resolveRecoveryEvidence({ packageInfo, canonical });
    return {
      type: "ContentPackageProof",
      version: 1,
      kind: "practice",
      target: packageInfo.target,
      logicalContentId: packageInfo.logicalContentId || `practice:${packageInfo.target}`,
      beforeHash: proof.beforeHash,
      afterHash: proof.afterHash,
      beforeSnapshot: proof.beforeSnapshot,
      afterSnapshot: proof.afterSnapshot,
      changeSetId: packageInfo.changeSetId || null,
      changedTargets: packageInfo.changedTargets || proof.operations.map((operation) => operation.targetId),
      operations: proof.operations,
      reviewEnvelope,
      recoveryEnvelope,
    };
  },
  async finalizeCanonical({ sourceRoot, packageInfo = {}, publicEvidence } = {}) {
    if (!publicEvidence || publicEvidence.ok === false || publicEvidence.verified === false) throw new Error("content lifecycle Practice finalize requires successful public verification");
    const canonical = await this.resolveCanonical({ sourceRoot, target: packageInfo.target, logicalContentId: packageInfo.logicalContentId });
    const proof = packageInfo.proofEnvelope || packageInfo.packageProof;
    if (!proof) throw new Error("content lifecycle Practice finalize requires package proof envelope");
    const afterProductPath = packageSourcePath(packageInfo.packageDirectory, `products/${packageInfo.target}.json`);
    const afterMediaPath = packageSourcePath(packageInfo.packageDirectory, `media/${packageInfo.target}/manifest.json`);
    const afterProduct = await readJson(afterProductPath, "Practice package after product");
    const afterMedia = await readJson(afterMediaPath, "Practice package after media manifest");
    const afterHash = practiceSnapshotHash(afterProduct, afterMedia);
    if (afterHash !== packageInfo.contentHash || proof.afterHash !== afterHash) throw new Error("content lifecycle Practice finalize after snapshot drift");
    if (canonical.beforeHash !== proof.beforeHash && canonical.beforeHash !== proof.afterHash) throw new Error("content lifecycle Practice finalize canonical drift");
    if (canonical.beforeHash === proof.afterHash) return { finalized: false, alreadyFinalized: true, beforeHash: proof.beforeHash, afterHash, recoveryEnvelope: proof.recoveryEnvelope };
    const recoveryRoot = path.join(packageInfo.packageDirectory, "recovery", "before", ".content-workspace", "content");
    await mkdir(path.join(recoveryRoot, "products"), { recursive: true });
    await mkdir(path.join(recoveryRoot, "media", packageInfo.target), { recursive: true });
    await writeJsonAtomically(path.join(recoveryRoot, "products", `${packageInfo.target}.json`), canonical.product);
    await writeJsonAtomically(path.join(recoveryRoot, "media", packageInfo.target, "manifest.json"), canonical.media);
    await writeJsonAtomically(canonical.canonicalPath, afterProduct);
    await writeJsonAtomically(canonical.mediaManifestPath, afterMedia);
    return { finalized: true, alreadyFinalized: false, beforeHash: canonical.beforeHash, afterHash, recoveryEnvelope: { ...proof.recoveryEnvelope, recoveryRoot: path.relative(sourceRoot, recoveryRoot) } };
  },
  async restoreCanonical({ sourceRoot, packageInfo = {}, recoveryEnvelope } = {}) {
    const recoveryRoot = path.join(packageInfo.packageDirectory, "recovery", "before", ".content-workspace", "content");
    const product = path.join(recoveryRoot, "products", `${packageInfo.target}.json`);
    const media = path.join(recoveryRoot, "media", packageInfo.target, "manifest.json");
    if (!(await exists(product)) || !(await exists(media))) return false;
    await writeJsonAtomically(canonicalPathFor("practice", packageInfo.target, sourceRoot), JSON.parse(await readFile(product, "utf8")));
    await writeJsonAtomically(contentMediaManifestPath(packageInfo.target, { sourceRoot }), JSON.parse(await readFile(media, "utf8")));
    return true;
  },
};

const registry = new Map([
  ["content", genericAdapter("content")],
  ["article", genericAdapter("article")],
  ["practice", practiceAdapter],
  ["profile", genericAdapter("profile")],
  ["businessObservation", genericAdapter("businessObservation")],
]);

export const contentLifecycleAdapterRegistry = registry;

export function getContentLifecycleAdapter(kind) {
  const adapter = registry.get(kind);
  if (!adapter) throw new Error(`content lifecycle adapter is not registered: ${kind}`);
  return adapter;
}

export function resolveContentLifecycleAdapter(kind) {
  return getContentLifecycleAdapter(kind);
}

export async function resolveCanonical(input = {}) {
  const identity = identityOf(input);
  return getContentLifecycleAdapter(identity.kind).resolveCanonical({ ...input, ...identity });
}

export async function resolveReviewEvidence(input = {}) {
  const identity = identityOf(input.packageInfo || input);
  return getContentLifecycleAdapter(identity.kind).resolveReviewEvidence({ ...input, ...identity });
}

export async function resolveRecoveryEvidence(input = {}) {
  const identity = identityOf(input.packageInfo || input);
  return getContentLifecycleAdapter(identity.kind).resolveRecoveryEvidence({ ...input, ...identity });
}

export async function validateContentLifecycleBefore(input = {}) {
  const identity = identityOf(input.packageInfo || input);
  return getContentLifecycleAdapter(identity.kind).validateBefore({ ...input, ...identity });
}

export async function validateContentLifecycleAfter(input = {}) {
  const identity = identityOf(input.packageInfo || input);
  return getContentLifecycleAdapter(identity.kind).validateAfter({ ...input, ...identity });
}

export async function finalizeContentLifecycle(input = {}) {
  const identity = identityOf(input.packageInfo || input);
  return getContentLifecycleAdapter(identity.kind).finalizeCanonical({ ...input, ...identity });
}

export async function restoreContentLifecycle(input = {}) {
  const identity = identityOf(input.packageInfo || input);
  const adapter = getContentLifecycleAdapter(identity.kind);
  if (typeof adapter.restoreCanonical !== "function") return false;
  return adapter.restoreCanonical({ ...input, ...identity });
}
