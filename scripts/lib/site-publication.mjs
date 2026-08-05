import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { acquireContentReleasePackageLease, releaseContentReleasePackageLease } from "./content-release-state.mjs";
import { writeJsonAtomically } from "./content-release-state.mjs";
import { contentReceiptProjection, contentTargetCollectionNames, readContentReleaseReceipt, receiptTargetCollections } from "./content-release-receipt.mjs";
import { contentLogicalSlotId, selectReleasedContentPackage, validateContentReplacement } from "./content-replacement.mjs";

export function sitePublicationId({ productVersion, productCommit, contentReleaseIds = [] } = {}) {
  return [productVersion, productCommit, ...contentReleaseIds].join("+");
}

export function sitePublicationIdempotencyKey({ sitePublicationId: id, snapshotHash = null } = {}) {
  if (typeof id !== "string" || !id) throw new Error("sitePublicationId is required");
  return createHash("sha256").update(`${id}:${snapshotHash || "site-publication-v1"}`).digest("hex");
}

export async function acquireSitePublicationLease({ publicationDirectory, leaseDirectory = publicationDirectory, sitePublicationId: id, snapshotHash = null, now, ttlMs } = {}) {
  return acquireContentReleasePackageLease({ packageDirectory: leaseDirectory, idempotencyKey: sitePublicationIdempotencyKey({ sitePublicationId: id, snapshotHash }), contentReleaseId: id, now, ttlMs });
}

export const releaseSitePublicationLease = releaseContentReleasePackageLease;

export async function validateUploadQuota(directory, { maxFiles = 10000, maxFileBytes = 50 * 1024 * 1024, maxTotalBytes = 500 * 1024 * 1024 } = {}) {
  let files = 0;
  let totalBytes = 0;
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) {
        files += 1;
        const bytes = (await stat(file)).size;
        if (bytes > maxFileBytes) throw new Error(`upload quota exceeded: file ${entry.name} exceeds max single file size`);
        totalBytes += bytes;
        if (files > maxFiles || totalBytes > maxTotalBytes) throw new Error("upload quota exceeded");
      }
    }
  }
  await walk(directory);
  return { files, totalBytes };
}

export async function readActiveContentReleases(releasesRoot) {
  const releasedById = new Map();
  async function collectCandidate(packageDirectory) {
    const releasePath = path.join(packageDirectory, "content-release.json");
    let release;
    try {
      release = JSON.parse(await readFile(releasePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw new Error(`content release lifecycle fact is unreadable: ${releasePath}: ${error.message}`);
    }
    if (release.state !== "released") return;
    if (!release.contentReleaseId) throw new Error(`released content lifecycle fact has no contentReleaseId: ${releasePath}`);
    const slotId = contentLogicalSlotId(release);
    const values = releasedById.get(slotId) || [];
    values.push({ packageDirectory, release });
    releasedById.set(slotId, values);
  }
  for (const entry of await readdir(releasesRoot, { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory()) continue;
    const packageDirectory = path.join(releasesRoot, entry.name);
    await collectCandidate(packageDirectory);
    const revisionsRoot = path.join(packageDirectory, "revisions");
    for (const revision of await readdir(revisionsRoot, { withFileTypes: true }).catch(() => [])) {
      if (revision.isDirectory()) await collectCandidate(path.join(revisionsRoot, revision.name));
    }
  }
  const active = [];
  for (const [contentSlotId, candidates] of releasedById) {
    const selected = await selectReleasedContentPackage(candidates, contentSlotId);
    const receipt = await readContentReleaseReceipt(selected.packageDirectory);
    const sourceDirectory = path.join(selected.packageDirectory, "source");
    active.push({ ...receipt, sourceDirectory, mediaPaths: await collectMediaPaths(sourceDirectory) });
  }
  return active.sort((a, b) => a.contentReleaseId.localeCompare(b.contentReleaseId));
}

async function collectMediaPaths(sourceDirectory) {
  const mediaRoot = path.join(sourceDirectory || "", ".content-workspace", "content", "media");
  const paths = new Set();
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(file);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        try {
          const value = JSON.parse(await readFile(file, "utf8"));
          for (const asset of value.assets || []) {
            if (typeof asset.src === "string" && asset.src.startsWith("/")) paths.add(asset.src);
          }
        } catch { /* non-media JSON is not a media manifest */ }
      }
    }
  }
  await walk(mediaRoot);
  return [...paths].sort();
}

function receiptSourceRelative(receipt) {
  const directory = receipt.kind === "content" ? "observations"
    : receipt.kind === "article" ? "articles"
      : receipt.kind === "profile" ? "profile"
        : receipt.kind === "businessObservation" ? "business-observations"
          : "products";
  return path.join(directory, `${receipt.target}.json`);
}

async function copyFileRequired(source, destination, errorMessage) {
  if (!(await stat(source).catch(() => null))) throw new Error(errorMessage);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { force: true });
}

async function assembleContentSources({ staging, activeContentReleases }) {
  const contentDestination = path.join(staging, ".content-workspace", "content");
  let contentSources = 0;
  for (const receipt of activeContentReleases) {
    const source = receipt.sourceDirectory || path.join(receipt.packageDirectory || "", "source");
    const contentRoot = path.join(source, ".content-workspace", "content");
    if (!(await stat(contentRoot).catch(() => null))) {
      throw new Error(`active content source is missing: ${receipt.contentReleaseId}`);
    }
    const relative = receiptSourceRelative(receipt);
    const sourceFile = path.join(contentRoot, relative);
    await copyFileRequired(sourceFile, path.join(contentDestination, relative), `active content target source is missing: ${receipt.contentReleaseId}`);
    if (!receipt.changeSetId) {
      const sourceHash = createHash("sha256").update(await readFile(sourceFile)).digest("hex");
      if (sourceHash !== receipt.contentHash) throw new Error(`active content source hash does not match receipt: ${receipt.contentReleaseId}`);
    }
    const mediaManifestRoot = path.join(contentRoot, "media", receipt.target);
    if (await stat(mediaManifestRoot).catch(() => null)) {
      await mkdir(path.join(contentDestination, "media", receipt.target), { recursive: true });
      await cp(mediaManifestRoot, path.join(contentDestination, "media", receipt.target), { recursive: true, force: true });
    }
    for (const mediaPath of receipt.mediaPaths || []) {
      if (!mediaPath.startsWith("/media/")) throw new Error(`active content media path is invalid: ${receipt.contentReleaseId}`);
      await copyFileRequired(
        path.join(source, "public", mediaPath.slice(1)),
        path.join(staging, "public", mediaPath.slice(1)),
        `active content media source is missing: ${receipt.contentReleaseId} ${mediaPath}`,
      );
    }
    contentSources += 1;
  }
  return contentSources;
}

async function buildAssembledClient({ productClient, outputRoot, activeContentReleases, sourceRoot }) {
  const productArtifactPath = path.join(productClient, "base-site-artifact.json");
  const productArtifact = JSON.parse(await readFile(productArtifactPath, "utf8"));
  if (!productArtifact.sourceDirectory || !(await stat(productArtifact.sourceDirectory).catch(() => null))) {
    throw new Error("site publication requires the current immutable product artifact source directory");
  }
  const staging = await mkdtemp(path.join(os.tmpdir(), "xingbuild-site-publication-"));
  try {
    await cp(productArtifact.sourceDirectory, staging, { recursive: true });
    const nodeModules = path.join(sourceRoot, "node_modules");
    if (await stat(nodeModules).catch(() => null)) await symlink(nodeModules, path.join(staging, "node_modules"), "dir");
    await assembleContentSources({ staging, activeContentReleases });
    const productRelease = JSON.parse(await readFile(path.join(productClient, "release.json"), "utf8"));
    const result = spawnSync("npm", ["run", "build"], {
      cwd: staging,
      encoding: "utf8",
      env: { ...process.env, XINGBUILD_CONTENT_BUILD: "1", XINGBUILD_PRODUCT_VERSION: productRelease.version, XINGBUILD_PRODUCT_COMMIT: productRelease.commit },
    });
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    if (output) process.stdout.write(output);
    if (result.status !== 0) throw new Error(`site publication assembly build failed with status ${result.status ?? "unknown"}`);
    const assembledClient = path.join(staging, "dist", "client");
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
    await cp(assembledClient, outputRoot, { recursive: true });
    await writeFile(path.join(outputRoot, "base-site-artifact.json"), `${JSON.stringify(productArtifact, null, 2)}\n`);
    return { productRelease, productArtifact, client: outputRoot };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

export function assertContentManifestComplete(manifest, receipts) {
  const ids = receipts.map((item) => item.contentReleaseId).sort();
  const actualIds = [...new Set(manifest.activeContentReleaseIds || [])].sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(ids)) throw new Error("content manifest activeContentReleaseIds are incomplete");
  for (const field of contentTargetCollectionNames) {
    const expected = [...new Set(receipts.flatMap((item) => item[field] || []))].sort();
    const actual = [...new Set(manifest[field] || [])].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`content manifest ${field} does not match ContentReleaseReceipts`);
  }
  const projected = manifest.contentReleaseReceipts || [];
  if (projected.length !== receipts.length) throw new Error("content manifest receipt projection is incomplete");
  for (const receipt of receipts) {
    const item = projected.find((value) => value.contentReleaseId === receipt.contentReleaseId);
    if (!item || item.receiptHash !== receipt.receiptHash || item.contentHash !== receipt.contentHash || item.kind !== receipt.kind || item.target !== receipt.target || (item.logicalContentId || null) !== (receipt.logicalContentId || null) || JSON.stringify(item.changedTargets || []) !== JSON.stringify(receipt.changedTargets || [])) {
      throw new Error(`content manifest receipt identity mismatch: ${receipt.contentReleaseId}`);
    }
  }
  return true;
}

export function createActiveContentSet(receipts = []) {
  const activeContentReleases = [...receipts].sort((a, b) => a.contentReleaseId.localeCompare(b.contentReleaseId));
  const collections = Object.fromEntries(contentTargetCollectionNames.map((field) => [
    field,
    [...new Set(activeContentReleases.flatMap((item) => item[field] || []))].sort(),
  ]));
  const activeContentSet = {
    ...collections,
    activeContentReleaseIds: activeContentReleases.map((item) => item.contentReleaseId),
    mediaPaths: [...new Set(activeContentReleases.flatMap((item) => item.mediaPaths || []))].sort(),
    contentReleaseReceipts: activeContentReleases.map((item) => contentReceiptProjection(item, { baseSiteArtifactId: item.baseSiteArtifactId })),
  };
  assertContentManifestComplete(activeContentSet, activeContentReleases);
  return { activeContentReleases, ...activeContentSet };
}

export async function createSitePublication({ productClient, releasesRoot, outputRoot, publicationRoot = null, additionalContentManifest = null, candidatePackageDirectory = null, assemble = false, sourceRoot = process.cwd() } = {}) {
  const productRelease = JSON.parse(await readFile(path.join(productClient, "release.json"), "utf8"));
  const activeContentReleases = await readActiveContentReleases(releasesRoot);
  const productArtifact = await readFile(path.join(productClient, "base-site-artifact.json"), "utf8").then(JSON.parse).catch(() => null);
  let replacement = null;
  if (additionalContentManifest?.contentReleaseId && additionalContentManifest.contentHash && additionalContentManifest.target) {
    const sourceDirectory = candidatePackageDirectory ? path.join(candidatePackageDirectory, "source") : null;
    const candidateLogicalSlot = contentLogicalSlotId(additionalContentManifest);
    const activeIndex = activeContentReleases.findIndex((item) => contentLogicalSlotId(item) === candidateLogicalSlot);
    let lifecycleTimes = null;
    if (activeIndex !== -1) {
      replacement = await validateContentReplacement({
        candidate: additionalContentManifest,
        candidatePackageDirectory,
        activeReceipt: activeContentReleases[activeIndex],
        productArtifactId: productArtifact?.baseSiteArtifactId || null,
        sourceRoot,
      });
      lifecycleTimes = replacement.lifecycleTimes;
    }
    const candidateReceipt = contentReceiptProjection(
      { ...additionalContentManifest, ...lifecycleTimes, packageDirectory: candidatePackageDirectory },
      { baseSiteArtifactId: productArtifact?.baseSiteArtifactId || additionalContentManifest.baseSiteArtifactId || null },
    );
    const candidateEntry = {
      ...additionalContentManifest,
      ...candidateReceipt,
      packageDirectory: candidatePackageDirectory,
      sourceDirectory,
      mediaPaths: await collectMediaPaths(sourceDirectory),
      receiptStatus: "candidate",
    };
    if (activeIndex === -1) {
      activeContentReleases.push(candidateEntry);
    } else {
      activeContentReleases.splice(activeIndex, 1, { ...candidateEntry, receiptStatus: "replacement-candidate", replacement });
    }
  }
  activeContentReleases.sort((a, b) => a.contentReleaseId.localeCompare(b.contentReleaseId));
  const candidate = additionalContentManifest?.contentReleaseId ? activeContentReleases.find((item) => item.contentReleaseId === additionalContentManifest.contentReleaseId) : null;
  const activeContentSet = createActiveContentSet(activeContentReleases);
  const contentManifest = {
    version: productRelease.version,
    commit: productRelease.commit,
    ...Object.fromEntries(contentTargetCollectionNames.map((field) => [field, activeContentSet[field]])),
    activeContentReleaseIds: activeContentSet.activeContentReleaseIds,
    mediaPaths: activeContentSet.mediaPaths,
    baseSiteArtifactId: productArtifact?.baseSiteArtifactId || additionalContentManifest?.baseSiteArtifactId || null,
    contentReleaseReceipts: activeContentSet.contentReleaseReceipts,
    candidateContentReleaseId: candidate?.contentReleaseId || null,
    candidatePackageRevisionId: candidate?.packageRevisionId || null,
    candidateTarget: candidate?.target || null,
    candidateTargetPath: candidate?.targetPath || null,
    contentReplacement: replacement,
  };
  assertContentManifestComplete(contentManifest, activeContentReleases);
  const snapshotHash = createHash("sha256").update(JSON.stringify({ productRelease, productArtifactId: productArtifact?.baseSiteArtifactId || null, contentManifest })).digest("hex");
  const publicationContentIdentities = activeContentReleases.map((item) => item.packageRevisionId ? `${item.contentReleaseId}@${item.packageRevisionId}` : item.contentReleaseId);
  const id = sitePublicationId({ productVersion: productRelease.version, productCommit: productRelease.commit, contentReleaseIds: publicationContentIdentities });
  Object.assign(contentManifest, { sitePublicationId: id, snapshotHash });
  const publication = {
    sitePublicationId: id,
    productVersion: productRelease.version,
    productCommit: productRelease.commit,
    productArtifactId: productArtifact?.baseSiteArtifactId || null,
    contentReleaseIds: contentManifest.activeContentReleaseIds,
    candidateContentReleaseId: candidate?.contentReleaseId || null,
    candidatePackageRevisionId: candidate?.packageRevisionId || null,
    contentReplacement: replacement,
    targetPath: candidate?.targetPath || null,
    contentManifest,
    snapshotHash,
    contentPackageRevisionIds: activeContentReleases.map((item) => item.packageRevisionId).filter(Boolean),
    publicationIdempotencyKey: sitePublicationIdempotencyKey({ sitePublicationId: id, snapshotHash }),
    deploymentId: null,
    publicVerify: null,
  };
  const resolvedOutputRoot = publicationRoot
    ? path.join(publicationRoot, `${productRelease.version}-${productRelease.commit.slice(0, 12)}-${snapshotHash.slice(0, 16)}`)
    : outputRoot;
  if (!resolvedOutputRoot) throw new Error("SitePublication outputRoot or publicationRoot is required");
  let existingPublication = null;
  try { existingPublication = JSON.parse(await readFile(path.join(resolvedOutputRoot, "site-publication.json"), "utf8")); } catch { /* first assembly */ }
  if (existingPublication?.sitePublicationId === id && existingPublication.snapshotHash !== snapshotHash) {
    throw new Error("persisted SitePublication snapshot identity drift");
  }
  if (existingPublication?.sitePublicationId !== id && existingPublication?.deploymentId) {
    throw new Error("refusing to overwrite a deployed SitePublication with a different identity");
  }
  if (assemble) {
    await buildAssembledClient({ productClient, outputRoot: resolvedOutputRoot, activeContentReleases, sourceRoot });
  } else {
    await rm(resolvedOutputRoot, { recursive: true, force: true });
    await mkdir(resolvedOutputRoot, { recursive: true });
    await cp(productClient, resolvedOutputRoot, { recursive: true });
  }
  await writeJsonAtomically(path.join(resolvedOutputRoot, "content-manifest.json"), contentManifest);
  const persistedIdentityMatches = existingPublication?.sitePublicationId === publication.sitePublicationId && existingPublication?.snapshotHash === publication.snapshotHash;
  const persisted = {
    ...publication,
    ...(persistedIdentityMatches ? existingPublication : {}),
    client: undefined,
    state: persistedIdentityMatches && ["recoverable", "propagating", "deploying", "verified", "released"].includes(existingPublication?.state) ? existingPublication.state : "assembled",
    assembledAt: new Date().toISOString(),
  };
  delete persisted.client;
  await writeJsonAtomically(path.join(resolvedOutputRoot, "site-publication.json"), persisted);
  if (persisted.deployment?.deploymentId) {
    await writeJsonAtomically(path.join(resolvedOutputRoot, "deployment.json"), persisted.deployment);
  }
  return { ...persisted, client: resolvedOutputRoot, activeContentReleases };
}

export function assertSitePublicationEvidence({ deployment, publicVerify, productVerify, contentVerify } = {}) {
  if (!deployment || typeof deployment !== "object" || !deployment.deploymentId) throw new Error("site publication requires machine-readable deployment JSON");
  if (!publicVerify || !Object.keys(publicVerify).length || !productVerify || !Object.keys(productVerify).length || !contentVerify || !Object.keys(contentVerify).length) throw new Error("site publication requires product and content public verification evidence");
  return true;
}
