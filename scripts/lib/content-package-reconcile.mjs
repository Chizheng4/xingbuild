import { access, cp, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { contentRootDirectory } from "./content-root.mjs";
import { hashFile } from "./observation-content.mjs";
import { readBaseSiteArtifact } from "./base-site-artifact.mjs";
import { writeJsonAtomically } from "./content-release-state.mjs";
import { CONTENT_PACKAGE_CONTRACT_VERSION, contentPackageRevisionIdentity, contentPackageSlotId, selectReleasedContentPackage } from "./content-replacement.mjs";

export { CONTENT_PACKAGE_CONTRACT_VERSION } from "./content-replacement.mjs";

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

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

  const contentDirectory = contentRootDirectory({ sourceRoot });
  const canonicalPath = path.join(contentDirectory, original.kind === "content" ? "observations" : original.kind === "article" ? "articles" : original.kind === "profile" ? "profile" : original.kind === "businessObservation" ? "business-observations" : "products", `${original.target}.json`);
  const draftPath = path.join(sourceRoot, ".content-workspace", "drafts", `${original.target}.json`);
  const recoveryPath = path.join(sourceRoot, ".content-workspace", "recoveries", `${original.target}.json`);
  const reviewPath = path.join(sourceRoot, ".content-workspace", "reviews", `${original.target}.json`);
  for (const file of [canonicalPath, draftPath, recoveryPath, reviewPath]) {
    if (!(await exists(file))) throw new Error(`content reconcile lifecycle file is missing: ${path.relative(sourceRoot, file)}`);
  }
  const [canonicalHash, draftHash, recoveryHash, review] = await Promise.all([
    hashFile(canonicalPath), hashFile(draftPath), hashFile(recoveryPath), readFile(reviewPath, "utf8").then(JSON.parse),
  ]);
  if (review.status !== "approved") throw new Error(`content reconcile review is not approved: ${original.target}`);
  if (canonicalHash !== original.contentHash || draftHash !== canonicalHash || recoveryHash !== canonicalHash || review.contentHash !== canonicalHash) {
    throw new Error(`content reconcile source/content/review hash drift: ${original.target}`);
  }
  const canonical = JSON.parse(await readFile(canonicalPath, "utf8"));
  const canonicalTarget = original.kind === "content" || original.kind === "article" ? canonical.slug : canonical.id;
  if (canonicalTarget !== original.target) throw new Error(`content reconcile target drift: ${original.target}`);

  const artifactPath = path.join(sourceRoot, ".content-workspace", "base-site-artifacts", baseSiteArtifactId, "base-site-artifact.json");
  const baseSiteArtifact = await readBaseSiteArtifact({ sourceRoot, artifactPath });
  if (baseSiteArtifact.baseSiteArtifactId !== baseSiteArtifactId) throw new Error("content reconcile baseSiteArtifact identity drift");

  const identity = contentPackageRevisionIdentity({ contentReleaseId, contentHash: original.contentHash, sourceHash: canonicalHash, baseSiteArtifactId });
  const revisionDirectory = path.join(releaseRoot, "revisions", identity.packageRevisionId);
  const manifestPath = path.join(revisionDirectory, "content-release.json");
  if (await exists(manifestPath)) {
    const existing = JSON.parse(await readFile(manifestPath, "utf8"));
    if (existing.revisionHash !== identity.revisionHash || JSON.stringify(existing.revisionTuple) !== JSON.stringify(identity.tuple)) {
      throw new Error(`content reconcile revision identity conflict: ${identity.packageRevisionId}`);
    }
    return { ...existing, packageDirectory: revisionDirectory, manifestPath, sourceDirectory: path.join(revisionDirectory, "source"), sourceRoot, reused: true };
  }

  const releasedPackages = original.state === "released" ? [{ packageDirectory: releaseRoot, release: original }] : [];
  for (const entry of await readdir(path.join(releaseRoot, "revisions"), { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory()) continue;
    const packageDirectory = path.join(releaseRoot, "revisions", entry.name);
    const release = await readFile(path.join(packageDirectory, "content-release.json"), "utf8").then(JSON.parse).catch(() => null);
    if (release?.state === "released") releasedPackages.push({ packageDirectory, release });
  }
  const activePackage = await selectReleasedContentPackage(releasedPackages, contentReleaseId);
  if (!activePackage) throw new Error(`content reconcile requires one released active package: ${contentReleaseId}`);

  const sourceDirectory = path.join(revisionDirectory, "source");
  await mkdir(sourceDirectory, { recursive: true });
  const predecessorSource = path.join(activePackage.packageDirectory, "source");
  if (await exists(predecessorSource)) await cp(predecessorSource, sourceDirectory, { recursive: true, force: true });
  await cp(contentDirectory, path.join(sourceDirectory, ".content-workspace", "content"), { recursive: true, force: true });

  const reconciledAt = now();
  const manifest = {
    ...activePackage.release,
    contentReleaseId,
    contentHash: original.contentHash,
    sourceHash: canonicalHash,
    baseSiteArtifactId,
    baseSiteArtifact,
    baseProductVersion: baseSiteArtifact.productVersion,
    baseProductCommit: baseSiteArtifact.productCommit,
    packageRevisionId: identity.packageRevisionId,
    revisionHash: identity.revisionHash,
    revisionTuple: identity.tuple,
    contractVersion: CONTENT_PACKAGE_CONTRACT_VERSION,
    supersedesPackageId: contentPackageSlotId(activePackage.release),
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
    packageRevisionId: identity.packageRevisionId,
    supersedesPackageId: manifest.supersedesPackageId,
    recoverySource: manifest.recoverySource,
    revisionTuple: identity.tuple,
    reconciledAt,
  });
  return { ...manifest, packageDirectory: revisionDirectory, manifestPath, sourceDirectory, sourceRoot, lineagePath, reused: false };
}
