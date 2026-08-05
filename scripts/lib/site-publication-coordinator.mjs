import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertProductContentCompatibility } from "./content-compatibility.mjs";
import { acquireSitePublicationLease, releaseSitePublicationLease, assertSitePublicationEvidence } from "./site-publication.mjs";
import { writeJsonAtomically } from "./content-release-state.mjs";
import {
  assertFixedPublishTarget,
  assertPublishAuthorization,
  edgeoneProjectId,
  publicUrl,
  readDeploymentResult,
  readFixedEdgeoneTarget,
} from "./publish-target.mjs";

function runCapture(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  process.stdout.write(output);
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? "unknown"}`);
  return output;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export function publicationRecoveryId(sitePublicationId, failure = "transport") {
  return `${sitePublicationId}:${failure}`;
}

export async function readSitePublicationRecord(publicationDirectory) {
  return readJson(path.join(publicationDirectory, "site-publication.json"));
}

export async function finalizeSitePublication({ publicationDirectory, publicVerify } = {}) {
  const current = await readSitePublicationRecord(publicationDirectory);
  if (!current.deploymentId || !publicVerify) throw new Error("SitePublication finalize requires deploymentId and publicVerify");
  if (publicVerify.sitePublicationId !== current.sitePublicationId || publicVerify.snapshotHash !== current.snapshotHash) {
    throw new Error("SitePublication finalize evidence identity mismatch");
  }
  const expected = [...(current.contentReleaseIds || [])].sort();
  const actual = [...(publicVerify.activeContentReleaseIds || [])].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("SitePublication finalize evidence is incomplete");
  return writePublicationRecord(publicationDirectory, { ...current, state: "released", publicVerify, releasedAt: current.releasedAt || new Date().toISOString(), failure: null });
}

export async function rollbackSitePublication({ publicationDirectory, reason = "explicit rollback" } = {}) {
  const current = await readSitePublicationRecord(publicationDirectory);
  return writePublicationRecord(publicationDirectory, { ...current, state: "rolled-back", failure: { message: reason, at: new Date().toISOString() } });
}

async function writePublicationRecord(publicationDirectory, value) {
  await writeJsonAtomically(path.join(publicationDirectory, "site-publication.json"), value);
  return value;
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, { redirect: "follow", cache: "no-store" });
  if (!response.ok) {
    const error = new Error(`public verify ${url} returned HTTP ${response.status}`);
    error.recoverable = response.status >= 500 || response.status === 404;
    throw error;
  }
  try {
    return await response.json();
  } catch (cause) {
    const error = new Error(`public verify ${url} returned an invalid JSON manifest`);
    error.cause = cause;
    throw error;
  }
}

function assertExactArray(actual, expected, field) {
  if (!Array.isArray(actual)) throw new Error(`public content manifest ${field} is missing`);
  const actualValues = [...new Set(actual)].sort();
  const expectedValues = [...new Set(expected || [])].sort();
  if (JSON.stringify(actualValues) !== JSON.stringify(expectedValues)) {
    throw new Error(`public content manifest ${field} does not match SitePublication`);
  }
  return actualValues;
}

export async function verifyPublicSitePublication({ publication, baseUrl = publicUrl, fetchImpl = fetch } = {}) {
  const base = new URL(baseUrl);
  const [release, contentManifest] = await Promise.all([
    fetchJson(new URL("/release.json", base), fetchImpl),
    fetchJson(new URL("/content-manifest.json", base), fetchImpl),
  ]);
  if (release.version !== publication.productVersion || release.commit !== publication.productCommit) {
    throw new Error("public release identity does not match SitePublication");
  }
  if (contentManifest.version !== publication.productVersion || contentManifest.commit !== publication.productCommit) {
    throw new Error("public content manifest identity does not match SitePublication");
  }
  if (contentManifest.sitePublicationId !== publication.sitePublicationId || contentManifest.snapshotHash !== publication.snapshotHash) {
    throw new Error("public content manifest snapshot identity does not match SitePublication");
  }
  if (contentManifest.baseSiteArtifactId !== publication.productArtifactId) throw new Error("public content manifest ProductArtifact identity does not match SitePublication");
  const actualIds = assertExactArray(contentManifest.activeContentReleaseIds, publication.contentReleaseIds, "activeContentReleaseIds");
  for (const field of ["publishedSlugs", "publishedArticleSlugs", "practiceIds", "profileIds", "businessObservationIds", "mediaPaths"]) {
    assertExactArray(contentManifest[field], publication.contentManifest?.[field], field);
  }
  const expectedReceipts = publication.contentManifest?.contentReleaseReceipts || [];
  const actualReceipts = contentManifest.contentReleaseReceipts;
  if (!Array.isArray(actualReceipts) || actualReceipts.length !== expectedReceipts.length) throw new Error("public content manifest receipt projection is incomplete");
  for (const expected of expectedReceipts) {
    const actual = actualReceipts.find((item) => item.contentReleaseId === expected.contentReleaseId);
    if (!actual || actual.receiptHash !== expected.receiptHash || actual.contentHash !== expected.contentHash || actual.kind !== expected.kind || actual.target !== expected.target) {
      throw new Error(`public content manifest receipt identity mismatch: ${expected.contentReleaseId}`);
    }
  }
  const routes = new Set(["/", "/products", "/business-observations", "/observations", "/about"]);
  if (publication.targetPath) routes.add(publication.targetPath);
  for (const receipt of expectedReceipts) if (receipt.targetPath) routes.add(receipt.targetPath);
  const pages = {};
  for (const route of routes) {
    const response = await fetchImpl(new URL(route, base), { redirect: "follow", cache: "no-store" });
    if (!response.ok) throw new Error(`public verify ${route} returned HTTP ${response.status}`);
    const text = await response.text();
    if (!/<title>xingbuild/i.test(text)) throw new Error(`public verify ${route} is not an xingbuild page`);
    pages[route] = { status: response.status, verified: true };
  }
  const mediaPaths = publication.contentManifest?.mediaPaths || publication.mediaPaths || [];
  const media = {};
  for (const mediaPath of mediaPaths) {
    const response = await fetchImpl(new URL(mediaPath, base), { redirect: "follow", cache: "no-store" });
    if (!response.ok) throw new Error(`public verify ${mediaPath} returned HTTP ${response.status}`);
    media[mediaPath] = { status: response.status, verified: true };
  }
  if (publication.candidateContentReleaseId && !actualIds.includes(publication.candidateContentReleaseId)) {
    throw new Error("public content manifest does not contain the candidate release");
  }
  return {
    sitePublicationId: publication.sitePublicationId,
    snapshotHash: publication.snapshotHash,
    version: publication.productVersion,
    commit: publication.productCommit,
    activeContentReleaseIds: actualIds,
    release: { version: release.version, commit: release.commit },
    contentManifest: {
      version: contentManifest.version,
      commit: contentManifest.commit,
      sitePublicationId: contentManifest.sitePublicationId,
      snapshotHash: contentManifest.snapshotHash,
      baseSiteArtifactId: contentManifest.baseSiteArtifactId,
      publishedSlugs: contentManifest.publishedSlugs,
      publishedArticleSlugs: contentManifest.publishedArticleSlugs,
      practiceIds: contentManifest.practiceIds,
      profileIds: contentManifest.profileIds,
      businessObservationIds: contentManifest.businessObservationIds,
      mediaPaths: contentManifest.mediaPaths,
      contentReleaseReceipts: actualReceipts,
    },
    pages,
    media,
    verifiedAt: new Date().toISOString(),
  };
}

export async function waitForPublicSitePublication({ publication, baseUrl = publicUrl, fetchImpl = fetch, maxAttempts = 30, initialDelayMs = 1000, maxDelayMs = 10000, sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return { ...(await verifyPublicSitePublication({ publication, baseUrl, fetchImpl })), attempts: attempt };
    } catch (error) {
      lastError = error;
      if (!error.recoverable) throw error;
      if (attempt === maxAttempts) break;
      await sleepImpl(Math.min(maxDelayMs, initialDelayMs * 2 ** (attempt - 1)));
    }
  }
  const error = new Error(`site publication public verification timed out after ${maxAttempts} attempts: ${lastError?.message || "unknown"}`);
  error.code = "SITE_PUBLICATION_VERIFY_TIMEOUT";
  error.recoveryId = publicationRecoveryId(publication.sitePublicationId, "public-verify");
  error.recoverable = true;
  throw error;
}

export async function transportSitePublication({ publication, sourceRoot, argv = [], env = process.env, edgeonePath, baseUrl = publicUrl, fetchImpl = fetch, runCaptureImpl = runCapture, maxAttempts = 30, initialDelayMs = 1000, maxDelayMs = 10000, sleepImpl } = {}) {
  assertFixedPublishTarget(env);
  assertPublishAuthorization({ argv, env });
  if (!publication?.sitePublicationId || !publication.productVersion || !publication.productCommit) throw new Error("SitePublication identity is required");
  const currentText = await readFile(path.join(sourceRoot, "docs/iterations/current.md"), "utf8");
  assertProductContentCompatibility({ currentText, activeContentReleaseIds: publication.contentReleaseIds || [] });
  const target = await readFixedEdgeoneTarget(sourceRoot);
  const leaseDirectory = path.join(sourceRoot, ".content-workspace", "site-publications", ".site-lease");
  const lease = await acquireSitePublicationLease({ publicationDirectory: publication.client, leaseDirectory, sitePublicationId: publication.sitePublicationId, snapshotHash: publication.snapshotHash, ttlMs: 900000 });
  let current = { ...publication };
  try {
    if (!current.deploymentId) {
      if (!edgeonePath) throw new Error("EdgeOne CLI path is required for SitePublication transport");
      let output;
      try {
        runCaptureImpl(edgeonePath, ["whoami"], sourceRoot, env);
        output = runCaptureImpl(edgeonePath, ["makers", "deploy", publication.client, "--name", target.name, "--env", "production", "--json"], sourceRoot, env);
      } catch (error) {
        error.recoverable = true;
        throw error;
      }
      const deployment = readDeploymentResult(output);
      current = await writePublicationRecord(publication.client, {
        ...current,
        state: ["pending", "processing", "running"].includes(deployment.status) ? "propagating" : "deploying",
        deploymentId: deployment.deploymentId,
        deployment,
        recoveryId: publicationRecoveryId(publication.sitePublicationId, "transport"),
        deploymentRecordedAt: new Date().toISOString(),
      });
      await writeJsonAtomically(path.join(publication.client, "deployment.json"), deployment);
    }
    current = await writePublicationRecord(publication.client, { ...current, state: "propagating" });
    const publicVerify = await waitForPublicSitePublication({ publication: current, baseUrl, fetchImpl, maxAttempts, initialDelayMs, maxDelayMs, sleepImpl });
    const productVerify = { version: current.productVersion, commit: current.productCommit, verifiedAt: publicVerify.verifiedAt };
    const contentVerify = { activeContentReleaseIds: publicVerify.activeContentReleaseIds, snapshotHash: publicVerify.snapshotHash, contentManifest: publicVerify.contentManifest, verifiedAt: publicVerify.verifiedAt };
    assertSitePublicationEvidence({ deployment: current.deployment || { deploymentId: current.deploymentId }, publicVerify, productVerify, contentVerify });
    return await finalizeSitePublication({ publicationDirectory: publication.client, publicVerify }).then((finalized) => writePublicationRecord(publication.client, { ...finalized, productVerify, contentVerify }));
  } catch (error) {
    const state = error.recoverable === true ? "recoverable" : "failed";
    const failed = { ...current, state, recoveryId: current.recoveryId || publicationRecoveryId(publication.sitePublicationId, error.code || "transport"), failure: { message: error.message, code: error.code || null, at: new Date().toISOString() } };
    await writePublicationRecord(publication.client, failed).catch(() => {});
    error.sitePublication = failed;
    throw error;
  } finally {
    await releaseSitePublicationLease(lease);
  }
}

export { edgeoneProjectId };
