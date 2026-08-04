import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export function sitePublicationId({ productVersion, productCommit, contentReleaseIds = [] } = {}) {
  return [productVersion, productCommit, ...contentReleaseIds].join("+");
}

export async function readActiveContentReleases(releasesRoot) {
  const active = [];
  for (const entry of await readdir(releasesRoot, { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(releasesRoot, entry.name, "dist", "client", "content-manifest.json");
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      if (manifest.state === "released" && manifest.contentReleaseId && manifest.deploymentId && manifest.publicVerify) active.push(manifest);
    } catch { /* incomplete packages are not active */ }
  }
  return active.sort((a, b) => a.contentReleaseId.localeCompare(b.contentReleaseId));
}

export async function createSitePublication({ productClient, releasesRoot, outputRoot } = {}) {
  const productRelease = JSON.parse(await readFile(path.join(productClient, "release.json"), "utf8"));
  const activeContentReleases = await readActiveContentReleases(releasesRoot);
  const contentManifest = {
    version: productRelease.version,
    commit: productRelease.commit,
    publishedSlugs: [...new Set(activeContentReleases.flatMap((item) => item.publishedSlugs || []))].sort(),
    publishedArticleSlugs: [...new Set(activeContentReleases.flatMap((item) => item.publishedArticleSlugs || []))].sort(),
    activeContentReleaseIds: activeContentReleases.map((item) => item.contentReleaseId),
  };
  const publication = {
    sitePublicationId: sitePublicationId({ productVersion: productRelease.version, productCommit: productRelease.commit, contentReleaseIds: contentManifest.activeContentReleaseIds }),
    productVersion: productRelease.version,
    productCommit: productRelease.commit,
    contentReleaseIds: contentManifest.activeContentReleaseIds,
    contentManifest,
    deploymentId: null,
    publicVerify: null,
  };
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await cp(productClient, outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "content-manifest.json"), `${JSON.stringify(contentManifest, null, 2)}\n`);
  await writeFile(path.join(outputRoot, "site-publication.json"), `${JSON.stringify(publication, null, 2)}\n`);
  return { ...publication, client: outputRoot, activeContentReleases };
}

export function assertSitePublicationEvidence({ deployment, publicVerify, productVerify, contentVerify } = {}) {
  if (!deployment || typeof deployment !== "object" || !deployment.deploymentId) throw new Error("site publication requires machine-readable deployment JSON");
  if (!publicVerify || !Object.keys(publicVerify).length || !productVerify || !Object.keys(productVerify).length || !contentVerify || !Object.keys(contentVerify).length) throw new Error("site publication requires product and content public verification evidence");
  return true;
}
