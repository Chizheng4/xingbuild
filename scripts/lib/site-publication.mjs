import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { acquireContentReleasePackageLease, releaseContentReleasePackageLease } from "./content-release-state.mjs";

export function sitePublicationId({ productVersion, productCommit, contentReleaseIds = [] } = {}) {
  return [productVersion, productCommit, ...contentReleaseIds].join("+");
}

export function sitePublicationIdempotencyKey({ sitePublicationId: id } = {}) {
  if (typeof id !== "string" || !id) throw new Error("sitePublicationId is required");
  return createHash("sha256").update(id).digest("hex");
}

export async function acquireSitePublicationLease({ publicationDirectory, sitePublicationId: id, now, ttlMs } = {}) {
  return acquireContentReleasePackageLease({ packageDirectory: publicationDirectory, idempotencyKey: sitePublicationIdempotencyKey({ sitePublicationId: id }), contentReleaseId: id, now, ttlMs });
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
  const active = [];
  for (const entry of await readdir(releasesRoot, { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory()) continue;
    const releasePath = path.join(releasesRoot, entry.name, "content-release.json");
    const manifestPath = path.join(releasesRoot, entry.name, "dist", "client", "content-manifest.json");
    try {
      const release = JSON.parse(await readFile(releasePath, "utf8"));
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      const identityMatches = manifest.contentReleaseId === release.contentReleaseId
        && (!release.contentHash || manifest.contentHash === release.contentHash)
        && (!release.target || manifest.target === release.target)
        && (!release.baseSiteArtifactId || manifest.baseSiteArtifactId === release.baseSiteArtifactId);
      if (release.state === "released" && release.contentReleaseId && release.deploymentId && release.publicVerify && identityMatches) {
        const sourceDirectory = path.join(path.dirname(releasePath), "source");
        active.push({
          ...manifest,
          ...release,
          deploymentId: release.deploymentId,
          publicVerify: release.publicVerify,
          contentReleaseId: release.contentReleaseId,
          packageDirectory: path.dirname(releasePath),
          sourceDirectory,
          mediaPaths: await collectMediaPaths(sourceDirectory),
        });
      }
    } catch { /* incomplete packages are not active */ }
  }
  return active.sort((a, b) => a.contentReleaseId.localeCompare(b.contentReleaseId));
}

async function overlayDirectory(source, destination) {
  if (!(await stat(source).catch(() => null))) return false;
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
  return true;
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

async function assembleContentSources({ staging, activeContentReleases, candidatePackageDirectory }) {
  const contentDestination = path.join(staging, ".content-workspace", "content");
  let contentSources = 0;
  for (const release of activeContentReleases) {
    const source = release.sourceDirectory || path.join(release.packageDirectory || "", "source");
    const contentRoot = path.join(source, ".content-workspace", "content");
    if (!(await stat(contentRoot).catch(() => null))) {
      throw new Error(`active content source is missing: ${release.contentReleaseId}`);
    }
    await overlayDirectory(contentRoot, contentDestination);
    await overlayDirectory(path.join(source, "public", "media"), path.join(staging, "public", "media"));
    contentSources += 1;
  }
  if (candidatePackageDirectory) {
    const source = path.join(candidatePackageDirectory, "source");
    const contentRoot = path.join(source, ".content-workspace", "content");
    if (!(await stat(contentRoot).catch(() => null))) throw new Error("candidate content source is missing");
    await overlayDirectory(contentRoot, contentDestination);
    await overlayDirectory(path.join(source, "public", "media"), path.join(staging, "public", "media"));
    contentSources += 1;
  }
  return contentSources;
}

async function buildAssembledClient({ productClient, outputRoot, activeContentReleases, candidatePackageDirectory, sourceRoot }) {
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
    await assembleContentSources({ staging, activeContentReleases, candidatePackageDirectory });
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

export async function createSitePublication({ productClient, releasesRoot, outputRoot, additionalContentManifest = null, candidatePackageDirectory = null, assemble = false, sourceRoot = process.cwd() } = {}) {
  const productRelease = JSON.parse(await readFile(path.join(productClient, "release.json"), "utf8"));
  let existingPublication = null;
  try { existingPublication = JSON.parse(await readFile(path.join(outputRoot, "site-publication.json"), "utf8")); } catch { /* first assembly */ }
  const activeContentReleases = await readActiveContentReleases(releasesRoot);
  if (additionalContentManifest?.contentReleaseId && additionalContentManifest.contentHash && additionalContentManifest.target) {
    const sourceDirectory = candidatePackageDirectory ? path.join(candidatePackageDirectory, "source") : null;
    activeContentReleases.push({ ...additionalContentManifest, packageDirectory: candidatePackageDirectory, sourceDirectory, mediaPaths: await collectMediaPaths(sourceDirectory) });
  }
  const productArtifact = await readFile(path.join(productClient, "base-site-artifact.json"), "utf8").then(JSON.parse).catch(() => null);
  const candidate = additionalContentManifest?.contentReleaseId ? activeContentReleases.find((item) => item.contentReleaseId === additionalContentManifest.contentReleaseId) : null;
  const contentManifest = {
    version: productRelease.version,
    commit: productRelease.commit,
    publishedSlugs: [...new Set(activeContentReleases.flatMap((item) => item.publishedSlugs || []))].sort(),
    publishedArticleSlugs: [...new Set(activeContentReleases.flatMap((item) => item.publishedArticleSlugs || []))].sort(),
    activeContentReleaseIds: activeContentReleases.map((item) => item.contentReleaseId),
    mediaPaths: [...new Set(activeContentReleases.flatMap((item) => item.mediaPaths || []))].sort(),
    baseSiteArtifactId: productArtifact?.baseSiteArtifactId || additionalContentManifest?.baseSiteArtifactId || null,
    candidateContentReleaseId: candidate?.contentReleaseId || null,
    candidateTarget: candidate?.target || null,
    candidateTargetPath: candidate?.targetPath || null,
  };
  const snapshotHash = createHash("sha256").update(JSON.stringify({ productRelease, productArtifactId: productArtifact?.baseSiteArtifactId || null, contentManifest })).digest("hex");
  const publication = {
    sitePublicationId: sitePublicationId({ productVersion: productRelease.version, productCommit: productRelease.commit, contentReleaseIds: contentManifest.activeContentReleaseIds }),
    productVersion: productRelease.version,
    productCommit: productRelease.commit,
    productArtifactId: productArtifact?.baseSiteArtifactId || null,
    contentReleaseIds: contentManifest.activeContentReleaseIds,
    candidateContentReleaseId: candidate?.contentReleaseId || null,
    targetPath: candidate?.targetPath || null,
    contentManifest,
    snapshotHash,
    publicationIdempotencyKey: sitePublicationIdempotencyKey({ sitePublicationId: sitePublicationId({ productVersion: productRelease.version, productCommit: productRelease.commit, contentReleaseIds: contentManifest.activeContentReleaseIds }) }),
    deploymentId: null,
    publicVerify: null,
  };
  if (assemble) {
    await buildAssembledClient({ productClient, outputRoot, activeContentReleases, candidatePackageDirectory, sourceRoot });
  } else {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
    await cp(productClient, outputRoot, { recursive: true });
  }
  await writeFile(path.join(outputRoot, "content-manifest.json"), `${JSON.stringify(contentManifest, null, 2)}\n`);
  const persistedIdentityMatches = existingPublication?.sitePublicationId === publication.sitePublicationId;
  const persisted = {
    ...publication,
    ...(persistedIdentityMatches ? existingPublication : {}),
    client: undefined,
    state: persistedIdentityMatches && ["recoverable", "propagating", "deploying", "released"].includes(existingPublication?.state) ? existingPublication.state : "assembled",
    assembledAt: new Date().toISOString(),
  };
  delete persisted.client;
  await writeFile(path.join(outputRoot, "site-publication.json"), `${JSON.stringify(persisted, null, 2)}\n`);
  return { ...persisted, client: outputRoot, activeContentReleases };
}

export function assertSitePublicationEvidence({ deployment, publicVerify, productVerify, contentVerify } = {}) {
  if (!deployment || typeof deployment !== "object" || !deployment.deploymentId) throw new Error("site publication requires machine-readable deployment JSON");
  if (!publicVerify || !Object.keys(publicVerify).length || !productVerify || !Object.keys(productVerify).length || !contentVerify || !Object.keys(contentVerify).length) throw new Error("site publication requires product and content public verification evidence");
  return true;
}
