import { access, cp, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { contentRootDirectory } from "./content-root.mjs";
import { readBaseSiteArtifact } from "./base-site-artifact.mjs";
import { writeJsonAtomically } from "./content-release-state.mjs";
import { CONTENT_PACKAGE_CONTRACT_VERSION, contentPackageRevisionIdentity, selectReleasedContentPackage } from "./content-replacement.mjs";
import { resolveContentLifecycleTimes } from "./content-lifecycle-time.mjs";
import { getContentLifecycleAdapter } from "./content-lifecycle-adapter.mjs";
import { contentPackageSlotId as registryPackageSlotId, contentReceiptId, ensureContentSlotRegistry, resolveContentSlot } from "./content-slot-registry.mjs";

export { CONTENT_PACKAGE_CONTRACT_VERSION } from "./content-replacement.mjs";

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

/**
 * Rebind an immutable content intent to a new ProductArtifact.  Lifecycle
 * evidence is resolved by kind; this function never infers Practice evidence
 * from Observation draft/recovery filenames and never mutates the canonical
 * content before public finalize.
 */
export async function reconcileContentPackage({ sourceRoot, contentReleaseId, baseSiteArtifactId, now = () => new Date().toISOString() } = {}) {
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) throw new Error("content reconcile requires an absolute sourceRoot");
  if (!contentReleaseId) throw new Error("content reconcile requires contentReleaseId");
  if (!baseSiteArtifactId) throw new Error("content reconcile requires immutable baseSiteArtifactId");

  const releaseRoot = path.join(sourceRoot, ".content-workspace", "releases", contentReleaseId);
  const originalManifestPath = path.join(releaseRoot, "content-release.json");
  if (!(await exists(originalManifestPath))) throw new Error(`content reconcile release is missing: ${contentReleaseId}`);
  const original = JSON.parse(await readFile(originalManifestPath, "utf8"));
  if (original.contentReleaseId !== contentReleaseId || !original.kind || !original.target || !original.contentHash) {
    throw new Error("content reconcile source package identity is invalid");
  }
  const expectedLogicalContentId = `${original.kind}:${original.target}`;
  if (original.logicalContentId && original.logicalContentId !== expectedLogicalContentId) {
    throw new Error("content reconcile logicalContentId kind/target drift");
  }

  const adapter = getContentLifecycleAdapter(original.kind);
  const canonical = await adapter.resolveCanonical({ sourceRoot, kind: original.kind, target: original.target, logicalContentId: original.logicalContentId });
  const originalPackageInfo = { ...original, packageDirectory: releaseRoot, sourceRoot };
  const reviewEvidence = await adapter.resolveReviewEvidence({ sourceRoot, kind: original.kind, target: original.target, canonical, packageInfo: originalPackageInfo });
  const proof = await adapter.validateBefore({ packageInfo: originalPackageInfo, canonical, reviewEvidence, changeSet: original });
  const proofEnvelope = original.proofEnvelope || await adapter.createProof({ packageInfo: originalPackageInfo, canonical, reviewEvidence, changeSet: original });

  const artifactPath = path.join(sourceRoot, ".content-workspace", "base-site-artifacts", baseSiteArtifactId, "base-site-artifact.json");
  const baseSiteArtifact = await readBaseSiteArtifact({ sourceRoot, artifactPath });
  if (baseSiteArtifact.baseSiteArtifactId !== baseSiteArtifactId) throw new Error("content reconcile baseSiteArtifact identity drift");

  const logicalId = original.logicalContentId || `${original.kind}:${original.target}`;
  const slotRegistry = await ensureContentSlotRegistry({ sourceRoot });
  let registrySlot = null;
  try { registrySlot = resolveContentSlot(slotRegistry, logicalId); } catch { /* first publication has no active slot */ }
  const identity = contentPackageRevisionIdentity({
    contentReleaseId,
    logicalContentId: logicalId,
    contentHash: original.contentHash,
    sourceHash: proof.beforeHash,
    baseSiteArtifactId,
  });
  const revisionDirectory = path.join(releaseRoot, "revisions", identity.packageRevisionId);
  const manifestPath = path.join(revisionDirectory, "content-release.json");
  if (await exists(manifestPath)) {
    const existing = JSON.parse(await readFile(manifestPath, "utf8"));
    if (existing.revisionHash !== identity.revisionHash || JSON.stringify(existing.revisionTuple) !== JSON.stringify(identity.tuple)) {
      throw new Error(`content reconcile revision identity conflict: ${identity.packageRevisionId}`);
    }
    return {
      ...existing,
      predecessorReceiptId: registrySlot?.activeReceiptId || existing.predecessorReceiptId || null,
      supersedesPackageId: registrySlot?.activePackageSlotId || existing.supersedesPackageId || null,
      registryRevision: slotRegistry.registryRevision,
      packageDirectory: revisionDirectory,
      manifestPath,
      sourceDirectory: path.join(revisionDirectory, "source"),
      sourceRoot,
      reused: true,
    };
  }

  const releasedPackages = original.state === "released" ? [{ packageDirectory: releaseRoot, release: original }] : [];
  for (const entry of await readdir(path.join(releaseRoot, "revisions"), { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory()) continue;
    const packageDirectory = path.join(releaseRoot, "revisions", entry.name);
    const release = await readFile(path.join(packageDirectory, "content-release.json"), "utf8").then(JSON.parse).catch(() => null);
    if (release?.state === "released") releasedPackages.push({ packageDirectory, release });
  }
  let activePackage = registrySlot
    ? {
      packageDirectory: path.resolve(sourceRoot, registrySlot.activePackageDirectory),
      release: await readFile(path.resolve(sourceRoot, registrySlot.activePackageDirectory, "content-release.json"), "utf8").then(JSON.parse),
      registrySlot,
    }
    : await selectReleasedContentPackage(releasedPackages, contentReleaseId);
  // A recoverable immutable Practice candidate may have no released predecessor
  // in this logical slot. Its own package is still the predecessor/recovery
  // source; it is never treated as active until finalize succeeds.
  if (!activePackage && original.kind === "practice") activePackage = { packageDirectory: releaseRoot, release: original };
  if (!activePackage) throw new Error(`content reconcile requires one released active package: ${contentReleaseId}`);
  const lifecycleTimes = resolveContentLifecycleTimes(original, {
    activeRecord: activePackage.release,
    now: () => "1970-01-01T00:00:00.000Z",
  });
  const predecessorReceiptId = registrySlot?.activeReceiptId || contentReceiptId(activePackage.release);
  const predecessorPackageSlotId = registrySlot?.activePackageSlotId || registryPackageSlotId(activePackage.release);

  const sourceDirectory = path.join(revisionDirectory, "source");
  await mkdir(sourceDirectory, { recursive: true });
  const predecessorSource = path.join(activePackage.packageDirectory, "source");
  if (await exists(predecessorSource)) await cp(predecessorSource, sourceDirectory, { recursive: true, force: true });
  if (original.kind !== "practice") {
    const contentDirectory = contentRootDirectory({ sourceRoot });
    await cp(contentDirectory, path.join(sourceDirectory, ".content-workspace", "content"), { recursive: true, force: true });
  }

  const reconciledAt = now();
  const manifest = {
    ...activePackage.release,
    contentReleaseId,
    logicalContentId: logicalId,
    kind: original.kind,
    target: original.target,
    contentHash: original.contentHash,
    sourceHash: proof.beforeHash,
    beforeHash: proof.beforeHash,
    afterHash: proof.afterHash || original.contentHash,
    beforeSnapshot: proof.beforeSnapshot || proofEnvelope.beforeSnapshot || null,
    afterSnapshot: proof.afterSnapshot || proofEnvelope.afterSnapshot || null,
    proofEnvelope,
    reviewEnvelope: proofEnvelope.reviewEnvelope || null,
    recoveryEnvelope: proofEnvelope.recoveryEnvelope || null,
    baseSiteArtifactId,
    baseSiteArtifact,
    baseProductVersion: baseSiteArtifact.productVersion,
    baseProductCommit: baseSiteArtifact.productCommit,
    firstPublishedAt: lifecycleTimes.firstPublishedAt,
    revisionReleasedAt: null,
    publishedAt: lifecycleTimes.firstPublishedAt,
    packageRevisionId: identity.packageRevisionId,
    revisionHash: identity.revisionHash,
    revisionTuple: identity.tuple,
    contractVersion: CONTENT_PACKAGE_CONTRACT_VERSION,
    supersedesPackageId: predecessorPackageSlotId,
    predecessorReceiptId,
    registryRevision: slotRegistry.registryRevision,
    recoverySource: path.relative(sourceRoot, activePackage.packageDirectory),
    releasePackage: path.relative(sourceRoot, revisionDirectory),
    state: "prepared",
    deploymentId: null,
    sitePublicationId: null,
    publicVerify: null,
    completionPath: null,
    recoverable: false,
    failure: null,
    attempts: 0,
    reconciledAt,
  };
  await writeJsonAtomically(manifestPath, manifest);
  const lineagePath = path.join(revisionDirectory, "package-lineage.json");
  await writeJsonAtomically(lineagePath, {
    type: "ContentPackageLineage",
    contentReleaseId,
    logicalContentId: logicalId,
    packageRevisionId: identity.packageRevisionId,
    supersedesPackageId: manifest.supersedesPackageId,
    predecessorReceiptId: manifest.predecessorReceiptId,
    recoverySource: manifest.recoverySource,
    revisionTuple: identity.tuple,
    beforeHash: proof.beforeHash,
    afterHash: proof.afterHash || original.contentHash,
    changeSetId: manifest.changeSetId || null,
    reconciledAt,
  });
  return { ...manifest, packageDirectory: revisionDirectory, manifestPath, sourceDirectory, sourceRoot, lineagePath, reused: false };
}
