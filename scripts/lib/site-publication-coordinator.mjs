import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertProductContentCompatibility } from "./content-compatibility.mjs";
import { acquireSitePublicationLease, releaseSitePublicationLease, assertSitePublicationEvidence } from "./site-publication.mjs";
import { writeJsonAtomically } from "./content-release-state.mjs";
import { assertContentLifecycleProjection } from "./content-lifecycle-time.mjs";
import { assertActiveContentProjection } from "./content-release-receipt.mjs";
import { compareAndSwapContentSlot, contentLogicalContentId, contentReceiptId, ensureContentSlotRegistry, restoreContentSlot } from "./content-slot-registry.mjs";
import {
  assertBindingCandidate,
  assertPublicationLineageBindingAgainstRegistry,
  createOrReusePublicationLineageBinding,
  publicationLineageBindingProjection,
  readPublicationLineageBinding,
  validatePublicationLineageBinding,
} from "./publication-lineage-binding.mjs";
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

export function sitePublicationIdentity(publication = {}) {
  return {
    sitePublicationId: publication.sitePublicationId || null,
    snapshotHash: publication.snapshotHash || null,
    version: publication.productVersion || null,
    commit: publication.productCommit || null,
    baseSiteArtifactId: publication.productArtifactId || null,
  };
}

function propagationError(message, observedIdentity = {}) {
  const error = new Error(message);
  error.recoverable = true;
  error.propagation = true;
  error.observedIdentity = observedIdentity;
  return error;
}

function identityDriftError(message, observedIdentity = {}) {
  const error = new Error(message);
  error.code = "SITE_PUBLICATION_IDENTITY_DRIFT";
  error.observedIdentity = observedIdentity;
  return error;
}

export async function finalizeSitePublication({ publicationDirectory, publicVerify, sourceRoot = null } = {}) {
  let current = await readSitePublicationRecord(publicationDirectory);
  if (!current.deploymentId || !publicVerify) throw new Error("SitePublication finalize requires deploymentId and publicVerify");
  if (publicVerify.sitePublicationId !== current.sitePublicationId || publicVerify.snapshotHash !== current.snapshotHash) {
    throw new Error("SitePublication finalize evidence identity mismatch");
  }
  const expectedReceipts = current.contentManifest?.contentReleaseReceipts || [];
  const actualReceipts = publicVerify.contentManifest?.contentReleaseReceipts || [];
  for (const expected of expectedReceipts) {
    const actual = actualReceipts.find((item) => item.contentReleaseId === expected.contentReleaseId);
    if (actual) assertContentLifecycleProjection(actual, expected, expected.contentReleaseId);
  }
  const expectedProjections = current.contentManifest?.activeContentProjections || [];
  const actualProjections = publicVerify.contentManifest?.activeContentProjections || [];
  if (expectedProjections.length) {
    if (actualProjections.length !== expectedProjections.length) throw new Error("SitePublication finalize active projection set is incomplete");
    for (const expected of expectedProjections) {
      const actual = actualProjections.find((item) => item.contentReleaseId === expected.contentReleaseId);
      if (!actual || actual.projectionHash !== expected.projectionHash || actual.receiptHash !== expected.receiptHash) {
        throw new Error(`SitePublication finalize active projection identity mismatch: ${expected.contentReleaseId}`);
      }
      assertActiveContentProjection(actual);
    }
  }
  const expected = [...(current.contentReleaseIds || [])].sort();
  const actual = [...(publicVerify.activeContentReleaseIds || [])].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("SitePublication finalize evidence is incomplete");
  const resolvedSourceRoot = sourceRoot || path.resolve(publicationDirectory, "..", "..", "..");
  let lineageBinding = current.lineageBinding ? validatePublicationLineageBinding(current.lineageBinding, {
    sitePublicationId: current.sitePublicationId,
  }) : null;
  if (current.lineageBindingId) {
    const persistedBinding = await readPublicationLineageBinding({
      sourceRoot: resolvedSourceRoot,
      lineageBindingId: current.lineageBindingId,
      expected: { sitePublicationId: current.sitePublicationId },
    });
    if (lineageBinding && persistedBinding.bindingHash !== lineageBinding.bindingHash) {
      throw new Error("SitePublication lineage binding sidecar drift");
    }
    lineageBinding = persistedBinding;
  }
  let contentSlotTransition = current.contentSlotTransition || null;
  if (current.candidateContentReleaseId && !contentSlotTransition) {
    const candidate = actualReceipts.find((item) => item.contentReleaseId === current.candidateContentReleaseId
      && (current.candidatePackageRevisionId == null || item.packageRevisionId === current.candidatePackageRevisionId));
    if (!candidate) throw new Error("SitePublication finalize candidate receipt projection is missing");
    const logicalContentId = contentLogicalContentId(candidate);
    if (!logicalContentId) throw new Error("SitePublication finalize candidate logicalContentId is missing");
    const registry = await ensureContentSlotRegistry({ sourceRoot: resolvedSourceRoot });
    if (!lineageBinding && current.lineageBindingId) {
      lineageBinding = await readPublicationLineageBinding({
        sourceRoot: resolvedSourceRoot,
        lineageBindingId: current.lineageBindingId,
        expected: { sitePublicationId: current.sitePublicationId },
      });
    }
    if (!lineageBinding) {
      if (!candidate.packageRevisionId) throw new Error("SitePublication finalize candidate packageRevisionId is missing for lineage binding");
      const created = await createOrReusePublicationLineageBinding({
        sourceRoot: resolvedSourceRoot,
        sitePublicationId: current.sitePublicationId,
        candidate,
        registry,
        expectedRegistryRevision: current.contentSlotRegistryRevision ?? registry.registryRevision,
      });
      lineageBinding = publicationLineageBindingProjection(created);
      current = await writePublicationRecord(publicationDirectory, {
        ...current,
        lineageBindingId: lineageBinding.lineageBindingId,
        lineageBinding,
        contentReplacement: {
          ...(current.contentReplacement || {}),
          lineageBindingId: lineageBinding.lineageBindingId,
          bindingHash: lineageBinding.bindingHash,
          predecessorReceiptId: lineageBinding.predecessorReceiptId,
          predecessorPackageSlotId: lineageBinding.predecessorPackageId,
          supersedesPackageId: lineageBinding.predecessorPackageId,
        },
      });
    } else {
      assertBindingCandidate(lineageBinding, candidate);
    }
    await assertPublicationLineageBindingAgainstRegistry({ sourceRoot: resolvedSourceRoot, binding: lineageBinding, candidate });
    const candidateReceiptId = contentReceiptId(candidate);
    const existingSlot = registry.slots.find((slot) => slot.logicalContentId === logicalContentId);
    if (existingSlot?.activeReceiptId === candidateReceiptId) {
      if (existingSlot.predecessorReceiptId !== lineageBinding.predecessorReceiptId) {
        throw new Error("SitePublication finalize active candidate lineage binding drift");
      }
      contentSlotTransition = { type: "idempotent", logicalContentId, predecessorReceiptId: lineageBinding.predecessorReceiptId, activeReceiptId: existingSlot.activeReceiptId, registryRevision: registry.registryRevision, lineageBindingId: lineageBinding.lineageBindingId, bindingHash: lineageBinding.bindingHash };
    } else {
      const candidatePackageDirectory = current.candidatePackageDirectory
        ? path.resolve(resolvedSourceRoot, current.candidatePackageDirectory)
        : null;
      const transition = await compareAndSwapContentSlot({
        sourceRoot: resolvedSourceRoot,
        logicalContentId,
        expectedReceiptId: lineageBinding.predecessorReceiptId,
        expectedRegistryRevision: lineageBinding.registryRevision,
        candidate: {
          ...candidate,
          logicalContentId,
          predecessorReceiptId: lineageBinding.predecessorReceiptId,
        },
        transition: { activePackageDirectory: candidatePackageDirectory ? path.relative(resolvedSourceRoot, candidatePackageDirectory) : null },
      });
      contentSlotTransition = {
        type: "compare-and-swap",
        logicalContentId,
        predecessorReceiptId: transition.previousSlot?.activeReceiptId || null,
        activeReceiptId: transition.nextSlot.activeReceiptId,
        registryRevision: transition.registry.registryRevision,
        lineageBindingId: lineageBinding.lineageBindingId,
        bindingHash: lineageBinding.bindingHash,
        previousSlot: transition.previousSlot,
        nextSlot: transition.nextSlot,
      };
    }
  }
  try {
    return await writePublicationRecord(publicationDirectory, {
      ...current,
      contentSlotTransition,
      lineageBindingId: lineageBinding?.lineageBindingId || current.lineageBindingId || null,
      lineageBinding: lineageBinding || current.lineageBinding || null,
      contentSlotRegistryRevision: contentSlotTransition?.registryRevision || current.contentSlotRegistryRevision || null,
      state: "released",
      publicVerify,
      releasedAt: current.releasedAt || new Date().toISOString(),
      failure: null,
    });
  } catch (error) {
    // Registry CAS and publication state are separate durable files. If the
    // publication record cannot be committed after a fresh CAS, compensate
    // only that exact transition; never leave an active slot ahead of its
    // finalized SitePublication.
    if (contentSlotTransition?.type === "compare-and-swap" && contentSlotTransition.previousSlot) {
      await restoreContentSlot({
        sourceRoot: sourceRoot || path.resolve(publicationDirectory, "..", "..", ".."),
        logicalContentId: contentSlotTransition.logicalContentId,
        expectedReceiptId: contentSlotTransition.activeReceiptId,
        previousSlot: contentSlotTransition.previousSlot,
      }).catch(() => {});
    }
    throw error;
  }
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
    error.propagation = error.recoverable;
    error.observedIdentity = { url: String(url), status: response.status };
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
  const expectedIdentity = sitePublicationIdentity(publication);
  const observedIdentity = {
    version: release.version || null,
    commit: release.commit || null,
    contentVersion: contentManifest.version || null,
    contentCommit: contentManifest.commit || null,
    sitePublicationId: contentManifest.sitePublicationId || null,
    snapshotHash: contentManifest.snapshotHash || null,
    baseSiteArtifactId: contentManifest.baseSiteArtifactId || null,
  };
  if (!release.version || !release.commit || !contentManifest.version || !contentManifest.commit
    || !contentManifest.sitePublicationId || !contentManifest.snapshotHash || !contentManifest.baseSiteArtifactId) {
    throw new Error("public release/content manifest identity fields are incomplete");
  }
  if (release.version !== publication.productVersion || release.commit !== publication.productCommit) {
    throw propagationError("public release identity does not match SitePublication", { ...observedIdentity, expected: expectedIdentity });
  }
  if (contentManifest.version !== publication.productVersion || contentManifest.commit !== publication.productCommit) {
    throw propagationError("public content manifest identity does not match SitePublication", { ...observedIdentity, expected: expectedIdentity });
  }
  if (contentManifest.sitePublicationId !== publication.sitePublicationId || contentManifest.snapshotHash !== publication.snapshotHash) {
    throw propagationError("public content manifest snapshot identity does not match SitePublication", { ...observedIdentity, expected: expectedIdentity });
  }
  if (contentManifest.baseSiteArtifactId !== publication.productArtifactId) {
    throw identityDriftError("public content manifest ProductArtifact identity does not match SitePublication", { ...observedIdentity, expected: expectedIdentity });
  }
  const actualIds = assertExactArray(contentManifest.activeContentReleaseIds, publication.contentReleaseIds, "activeContentReleaseIds");
  if (publication.contentManifest?.activeReceiptIds) {
    assertExactArray(contentManifest.activeReceiptIds, publication.contentManifest.activeReceiptIds, "activeReceiptIds");
  }
  for (const field of ["publishedSlugs", "publishedArticleSlugs", "practiceIds", "profileIds", "businessObservationIds", "mediaPaths"]) {
    assertExactArray(contentManifest[field], publication.contentManifest?.[field], field);
  }
  const expectedReceipts = publication.contentManifest?.contentReleaseReceipts || [];
  const actualReceipts = contentManifest.contentReleaseReceipts;
  if (!Array.isArray(actualReceipts) || actualReceipts.length !== expectedReceipts.length) throw new Error("public content manifest receipt projection is incomplete");
  for (const expected of expectedReceipts) {
    const actual = actualReceipts.find((item) => item.contentReleaseId === expected.contentReleaseId);
    if (!actual || actual.receiptHash !== expected.receiptHash || (actual.packageRevisionId || null) !== (expected.packageRevisionId || null)
      || actual.contentHash !== expected.contentHash || actual.kind !== expected.kind || actual.target !== expected.target) {
      throw new Error(`public content manifest receipt identity mismatch: ${expected.contentReleaseId}`);
    }
    assertContentLifecycleProjection(actual, expected, expected.contentReleaseId);
  }
  const expectedProjections = publication.contentManifest?.activeContentProjections || [];
  if (expectedProjections.length) {
    const actualProjections = contentManifest.activeContentProjections;
    if (!Array.isArray(actualProjections) || actualProjections.length !== expectedProjections.length) throw new Error("public content manifest active projection set is incomplete");
    for (const expected of expectedProjections) {
      const actual = actualProjections.find((item) => item.contentReleaseId === expected.contentReleaseId);
      if (!actual || actual.projectionHash !== expected.projectionHash || actual.receiptHash !== expected.receiptHash) {
        throw new Error(`public content manifest active projection identity mismatch: ${expected.contentReleaseId}`);
      }
      assertActiveContentProjection(actual);
    }
    if (JSON.stringify(actualProjections) !== JSON.stringify(actualReceipts)) throw new Error("public content manifest projection and receipt views diverge");
  }
  if (publication.lineageBinding) {
    const expectedBinding = validatePublicationLineageBinding(publication.lineageBinding, { sitePublicationId: publication.sitePublicationId });
    const actualCandidate = actualReceipts.find((item) => item.contentReleaseId === expectedBinding.candidateContentReleaseId
      && item.packageRevisionId === expectedBinding.packageRevisionId);
    if (!actualCandidate
      || actualCandidate.lineageBindingId !== expectedBinding.lineageBindingId
      || actualCandidate.predecessorReceiptId !== expectedBinding.predecessorReceiptId
      || actualCandidate.supersedesPackageId !== expectedBinding.predecessorPackageId) {
      throw new Error("public content manifest lineage binding projection mismatch");
    }
    if (contentManifest.lineageBindingId !== expectedBinding.lineageBindingId
      || JSON.stringify(contentManifest.lineageBinding || null) !== JSON.stringify(expectedBinding)) {
      throw new Error("public content manifest lineage binding identity mismatch");
    }
  }
  if ((contentManifest.candidatePackageRevisionId || null) !== (publication.candidatePackageRevisionId || null)) {
    throw new Error("public content manifest candidate package revision identity mismatch");
  }
  if (JSON.stringify(contentManifest.contentReplacement || null) !== JSON.stringify(publication.contentReplacement || null)) {
    throw new Error("public content manifest replacement lineage mismatch");
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
      activeReceiptIds: contentManifest.activeReceiptIds || [],
      publishedSlugs: contentManifest.publishedSlugs,
      publishedArticleSlugs: contentManifest.publishedArticleSlugs,
      practiceIds: contentManifest.practiceIds,
      profileIds: contentManifest.profileIds,
      businessObservationIds: contentManifest.businessObservationIds,
      mediaPaths: contentManifest.mediaPaths,
      activeContentProjections: contentManifest.activeContentProjections || [],
      contentReleaseReceipts: actualReceipts,
      candidatePackageRevisionId: contentManifest.candidatePackageRevisionId || null,
      contentReplacement: contentManifest.contentReplacement || null,
      lineageBindingId: contentManifest.lineageBindingId || null,
      lineageBinding: contentManifest.lineageBinding || null,
    },
    pages,
    media,
    verifiedAt: new Date().toISOString(),
  };
}

export async function waitForPublicSitePublication({ publication, baseUrl = publicUrl, fetchImpl = fetch, maxAttempts = 30, initialDelayMs = 1000, maxDelayMs = 10000, sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), onObservation = async () => {} } = {}) {
  let lastError;
  const observations = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return { ...(await verifyPublicSitePublication({ publication, baseUrl, fetchImpl })), attempts: attempt, propagationObservations: observations };
    } catch (error) {
      lastError = error;
      if (error.propagation) {
        const observation = {
          expectedIdentity: sitePublicationIdentity(publication),
          observedIdentity: error.observedIdentity || null,
          attempt,
          observedAt: new Date().toISOString(),
          message: error.message,
        };
        observations.push(observation);
        await onObservation(observation);
      }
      if (!error.recoverable) throw error;
      if (attempt === maxAttempts) break;
      await sleepImpl(Math.min(maxDelayMs, initialDelayMs * 2 ** (attempt - 1)));
    }
  }
  const error = new Error(`site publication public verification timed out after ${maxAttempts} attempts: ${lastError?.message || "unknown"}`);
  error.code = "SITE_PUBLICATION_VERIFY_TIMEOUT";
  error.recoveryId = publicationRecoveryId(publication.sitePublicationId, "public-verify");
  error.recoverable = true;
  error.propagation = true;
  error.expectedIdentity = sitePublicationIdentity(publication);
  error.observedIdentity = observations.at(-1)?.observedIdentity || lastError?.observedIdentity || null;
  error.propagationObservations = observations;
  throw error;
}

export async function transportSitePublication({ publication, sourceRoot, argv = [], env = process.env, edgeonePath, baseUrl = publicUrl, fetchImpl = fetch, runCaptureImpl = runCapture, maxAttempts = 30, initialDelayMs = 1000, maxDelayMs = 10000, sleepImpl } = {}) {
  assertFixedPublishTarget(env);
  assertPublishAuthorization({ argv, env });
  if (!publication?.sitePublicationId || !publication.productVersion || !publication.productCommit) throw new Error("SitePublication identity is required");
  const currentText = await readFile(path.join(sourceRoot, "docs/iterations/current.md"), "utf8");
  assertProductContentCompatibility({ currentText, activeContentReleaseIds: publication.contentReleaseIds || [] });
  const target = await readFixedEdgeoneTarget(sourceRoot);
  let persisted = null;
  try {
    persisted = await readSitePublicationRecord(publication.client);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (persisted && (persisted.sitePublicationId !== publication.sitePublicationId
    || persisted.snapshotHash !== publication.snapshotHash
    || persisted.productVersion !== publication.productVersion
    || persisted.productCommit !== publication.productCommit
    || (persisted.productArtifactId || null) !== (publication.productArtifactId || null))) {
    throw new Error("persisted SitePublication identity does not match resume request");
  }
  const leaseDirectory = path.join(sourceRoot, ".content-workspace", "site-publications", ".site-lease");
  const lease = await acquireSitePublicationLease({ publicationDirectory: publication.client, leaseDirectory, sitePublicationId: publication.sitePublicationId, snapshotHash: publication.snapshotHash, ttlMs: 900000 });
  let current = { ...publication };
  let propagationObservations = current.propagation?.observations || [];
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
    const publicVerify = await waitForPublicSitePublication({
      publication: current,
      baseUrl,
      fetchImpl,
      maxAttempts,
      initialDelayMs,
      maxDelayMs,
      sleepImpl,
      onObservation: async (observation) => {
        propagationObservations = [...propagationObservations, observation];
        current = await writePublicationRecord(publication.client, {
          ...current,
          state: "propagating",
          propagation: {
            expectedIdentity: sitePublicationIdentity(current),
            observedIdentity: observation.observedIdentity,
            deploymentId: current.deploymentId || null,
            attempts: observation.attempt,
            observations: propagationObservations,
            lastObservedAt: observation.observedAt,
          },
        });
      },
    });
    const productVerify = { version: current.productVersion, commit: current.productCommit, verifiedAt: publicVerify.verifiedAt };
    const contentVerify = { activeContentReleaseIds: publicVerify.activeContentReleaseIds, snapshotHash: publicVerify.snapshotHash, contentManifest: publicVerify.contentManifest, verifiedAt: publicVerify.verifiedAt };
    assertSitePublicationEvidence({ deployment: current.deployment || { deploymentId: current.deploymentId }, publicVerify, productVerify, contentVerify });
    return await finalizeSitePublication({ publicationDirectory: publication.client, publicVerify, sourceRoot }).then((finalized) => writePublicationRecord(publication.client, { ...finalized, productVerify, contentVerify }));
  } catch (error) {
    const state = error.recoverable === true ? "recoverable" : "failed";
    const propagation = error.propagationObservations?.length
      ? {
        expectedIdentity: error.expectedIdentity || sitePublicationIdentity(current),
        observedIdentity: error.observedIdentity || error.propagationObservations.at(-1)?.observedIdentity || null,
        deploymentId: current.deploymentId || null,
        attempts: error.propagationObservations.at(-1)?.attempt || null,
        observations: [...propagationObservations, ...error.propagationObservations.filter((item) => !propagationObservations.includes(item))],
        lastObservedAt: error.propagationObservations.at(-1)?.observedAt || null,
      }
      : current.propagation;
    const failed = {
      ...current,
      state,
      recoveryId: current.recoveryId || publicationRecoveryId(publication.sitePublicationId, error.code || "transport"),
      ...(propagation
        ? { propagation, incident: { type: error.code || "SITE_PUBLICATION_TRANSPORT", expectedIdentity: propagation.expectedIdentity, observedIdentity: propagation.observedIdentity, deploymentId: propagation.deploymentId, attempts: propagation.attempts } }
        : error.observedIdentity
          ? { incident: { type: error.code || "SITE_PUBLICATION_TRANSPORT", expectedIdentity: sitePublicationIdentity(current), observedIdentity: error.observedIdentity, deploymentId: current.deploymentId || null } }
          : {}),
      failure: { message: error.message, code: error.code || null, at: new Date().toISOString() },
    };
    await writePublicationRecord(publication.client, failed).catch(() => {});
    error.sitePublication = failed;
    throw error;
  } finally {
    await releaseSitePublicationLease(lease);
  }
}

export { edgeoneProjectId };
