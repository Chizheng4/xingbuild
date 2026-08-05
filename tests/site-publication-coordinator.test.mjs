import assert from "node:assert/strict";
import { mkdir, readFile, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertProductContentCompatibility } from "../scripts/lib/content-compatibility.mjs";
import { transportSitePublication, waitForPublicSitePublication } from "../scripts/lib/site-publication-coordinator.mjs";
import { acquireSitePublicationLease, releaseSitePublicationLease } from "../scripts/lib/site-publication.mjs";

const compatibleCurrent = [
  "# current",
  "contentImpact: compatible",
  "contentImpactReason: coordinator-contract",
  "affectedTargets: []",
  "affectedRoutes: []",
  "compatibilityEvidence: coordinator-contract",
].join("\n");

async function rootFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-coordinator-"));
  await mkdir(path.join(root, ".edgeone"), { recursive: true });
  await mkdir(path.join(root, "docs", "iterations"), { recursive: true });
  await writeFile(path.join(root, ".edgeone", "project.json"), JSON.stringify({ Name: "xingbuild-nochina", ProjectId: "makers-ze0f6txvlhco" }));
  await writeFile(path.join(root, "docs", "iterations", "current.md"), compatibleCurrent);
  return root;
}

function publicationFixture(overrides = {}) {
  const contentReleaseIds = overrides.contentReleaseIds || [];
  const contentReleaseReceipts = overrides.contentReleaseReceipts || [];
  const contentManifest = {
    publishedSlugs: [],
    publishedArticleSlugs: [],
    practiceIds: [],
    profileIds: [],
    businessObservationIds: [],
    mediaPaths: [],
    contentReleaseReceipts,
    ...(overrides.contentManifest || {}),
  };
  return {
    sitePublicationId: "pub-1",
    snapshotHash: "snapshot-1",
    productVersion: "v0.25.0",
    productCommit: "a".repeat(40),
    productArtifactId: "v0.25.0-aaaaaaaaaaaa",
    contentReleaseIds,
    contentManifest,
    ...overrides,
    contentReleaseIds,
    contentManifest,
  };
}

function publicFetch({ publication = publicationFixture() } = {}) {
  return async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/release.json") return new Response(JSON.stringify({ version: publication.productVersion, commit: publication.productCommit }), { status: 200 });
    if (pathname === "/content-manifest.json") return new Response(JSON.stringify({
      version: publication.productVersion,
      commit: publication.productCommit,
      sitePublicationId: publication.sitePublicationId,
      snapshotHash: publication.snapshotHash,
      baseSiteArtifactId: publication.productArtifactId,
      activeContentReleaseIds: publication.contentReleaseIds,
      ...publication.contentManifest,
    }), { status: 200 });
    return new Response("<title>xingbuild</title>", { status: 200 });
  };
}

test("product content impact is a hard compatibility gate", () => {
  assert.throws(() => assertProductContentCompatibility({ currentText: "contentImpact: breaking\ncompatibilityEvidence: test" }), /Product Incident/);
  assert.doesNotThrow(() => assertProductContentCompatibility({ currentText: compatibleCurrent }));
});

test("coordinator waits for propagation without changing publication identity", async () => {
  let calls = 0;
  const publication = publicationFixture();
  const fetchImpl = async (url) => {
    calls += 1;
    if (calls < 3) return new Response("propagating", { status: 503 });
    return publicFetch({ publication })(url);
  };
  const verified = await waitForPublicSitePublication({ publication, fetchImpl, maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, sleepImpl: async () => {} });
  assert.equal(verified.sitePublicationId, "pub-1");
  assert.ok(verified.attempts <= 3);
});

test("public verification includes declared media evidence", async () => {
  const receipt = { contentReleaseId: "content-media", contentHash: "b".repeat(64), receiptHash: "receipt-media", kind: "content", target: "media", targetPath: "/observations/media" };
  const publication = publicationFixture({
    sitePublicationId: "pub-media",
    snapshotHash: "snapshot-media",
    contentReleaseIds: ["content-media"],
    candidateContentReleaseId: "content-media",
    contentReleaseReceipts: [receipt],
    contentManifest: { publishedSlugs: ["media"], mediaPaths: ["/media/robotaxi/evidence.mp4"], contentReleaseReceipts: [receipt] },
  });
  const verified = await waitForPublicSitePublication({
    publication,
    fetchImpl: publicFetch({ publication }),
    maxAttempts: 1,
  });
  assert.deepEqual(Object.keys(verified.media), ["/media/robotaxi/evidence.mp4"]);
});

test("partial public manifest hard fails without propagation retries", async () => {
  const publication = publicationFixture();
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    const pathname = new URL(url).pathname;
    if (pathname === "/release.json") return Response.json({ version: publication.productVersion, commit: publication.productCommit });
    if (pathname === "/content-manifest.json") return Response.json({
      version: publication.productVersion,
      commit: publication.productCommit,
      sitePublicationId: publication.sitePublicationId,
      snapshotHash: publication.snapshotHash,
      baseSiteArtifactId: publication.productArtifactId,
    });
    return new Response("<title>xingbuild</title>");
  };
  await assert.rejects(waitForPublicSitePublication({ publication, fetchImpl, maxAttempts: 5, initialDelayMs: 0, maxDelayMs: 0, sleepImpl: async () => {} }), /activeContentReleaseIds is missing/);
  assert.equal(calls, 2);
});

test("complete propagated identity drift is bounded and records expected and observed identity", async () => {
  const root = await rootFixture();
  const client = path.join(root, "publication");
  await mkdir(client, { recursive: true });
  const publication = {
    ...publicationFixture({
      sitePublicationId: "pub-drift",
      snapshotHash: "snapshot-drift",
      contentReleaseIds: ["active-didi", "active-ojai", "active-waymo"],
      contentManifest: { publishedSlugs: ["didi", "ojai", "waymo"] },
    }),
    client,
  };
  let deployCalls = 0;
  const runCaptureImpl = (_command, args) => {
    if (args[0] === "whoami") return "authenticated";
    deployCalls += 1;
    return JSON.stringify({ status: "success", deploymentId: "dep-drift", projectId: "makers-ze0f6txvlhco" });
  };
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/release.json") return Response.json({ version: publication.productVersion, commit: publication.productCommit });
    if (pathname === "/content-manifest.json") return Response.json({
      version: publication.productVersion,
      commit: publication.productCommit,
      sitePublicationId: "old-publication",
      snapshotHash: "old-snapshot",
      baseSiteArtifactId: publication.productArtifactId,
      activeContentReleaseIds: [],
      publishedSlugs: [],
      publishedArticleSlugs: [],
      practiceIds: [],
      profileIds: [],
      businessObservationIds: [],
      mediaPaths: [],
      contentReleaseReceipts: [],
      candidatePackageRevisionId: null,
      contentReplacement: null,
    });
    return new Response("<title>xingbuild</title>");
  };
  await assert.rejects(
    transportSitePublication({ publication, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl, maxAttempts: 2, initialDelayMs: 0, maxDelayMs: 0, sleepImpl: async () => {} }),
    (error) => error.code === "SITE_PUBLICATION_VERIFY_TIMEOUT" && error.recoverable === true,
  );
  assert.equal(deployCalls, 1);
  const persisted = JSON.parse(await readFile(path.join(client, "site-publication.json"), "utf8"));
  assert.equal(persisted.state, "recoverable");
  assert.equal(persisted.deploymentId, "dep-drift");
  assert.equal(persisted.propagation.expectedIdentity.sitePublicationId, "pub-drift");
  assert.equal(persisted.propagation.observedIdentity.sitePublicationId, "old-publication");
  assert.equal(persisted.propagation.attempts, 2);
  assert.equal(persisted.incident.type, "SITE_PUBLICATION_VERIFY_TIMEOUT");
  assert.deepEqual(persisted.contentReleaseIds, ["active-didi", "active-ojai", "active-waymo"]);
});

test("base artifact identity drift remains a hard failure with recovery evidence", async () => {
  const publication = publicationFixture();
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/release.json") return Response.json({ version: publication.productVersion, commit: publication.productCommit });
    if (pathname === "/content-manifest.json") return Response.json({
      version: publication.productVersion,
      commit: publication.productCommit,
      sitePublicationId: publication.sitePublicationId,
      snapshotHash: publication.snapshotHash,
      baseSiteArtifactId: "stale-base",
    });
    return new Response("<title>xingbuild</title>");
  };
  await assert.rejects(waitForPublicSitePublication({ publication, fetchImpl, maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, sleepImpl: async () => {} }), (error) => error.code === "SITE_PUBLICATION_IDENTITY_DRIFT" && error.recoverable !== true && error.observedIdentity.baseSiteArtifactId === "stale-base");
});

test("propagation convergence reuses the deployment and finalizes the same publication", async () => {
  const root = await rootFixture();
  const client = path.join(root, "publication");
  await mkdir(client, { recursive: true });
  const publication = { ...publicationFixture({ sitePublicationId: "pub-converge", snapshotHash: "snapshot-converge" }), client };
  let deployCalls = 0;
  let contentManifestCalls = 0;
  const runCaptureImpl = (_command, args) => {
    if (args[0] === "whoami") return "authenticated";
    deployCalls += 1;
    return JSON.stringify({ status: "success", deploymentId: "dep-converge", projectId: "makers-ze0f6txvlhco" });
  };
  const expectedFetch = publicFetch({ publication });
  const fetchImpl = async (url) => {
    if (new URL(url).pathname !== "/content-manifest.json") return expectedFetch(url);
    contentManifestCalls += 1;
    if (contentManifestCalls === 1) return new Response(JSON.stringify({
      version: publication.productVersion,
      commit: publication.productCommit,
      sitePublicationId: "old-publication",
      snapshotHash: "old-snapshot",
      baseSiteArtifactId: publication.productArtifactId,
      activeContentReleaseIds: [],
      publishedSlugs: [],
      publishedArticleSlugs: [],
      practiceIds: [],
      profileIds: [],
      businessObservationIds: [],
      mediaPaths: [],
      contentReleaseReceipts: [],
      candidatePackageRevisionId: null,
      contentReplacement: null,
    }), { status: 200 });
    return expectedFetch(url);
  };
  const result = await transportSitePublication({ publication, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl, maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, sleepImpl: async () => {} });
  assert.equal(result.state, "released");
  assert.equal(result.sitePublicationId, "pub-converge");
  assert.equal(result.deploymentId, "dep-converge");
  assert.equal(deployCalls, 1);
  assert.equal(result.publicVerify.propagationObservations.length, 1);
  assert.equal(result.propagation.observations.length, 1);
});

test("resume after a permanent propagation drift reuses the persisted deployment", async () => {
  const root = await rootFixture();
  const client = path.join(root, "publication");
  await mkdir(client, { recursive: true });
  const publication = { ...publicationFixture({ sitePublicationId: "pub-resume-drift", snapshotHash: "snapshot-resume-drift" }), client };
  let deployCalls = 0;
  const runCaptureImpl = (_command, args) => {
    if (args[0] === "whoami") return "authenticated";
    deployCalls += 1;
    return JSON.stringify({ status: "success", deploymentId: "dep-resume-drift", projectId: "makers-ze0f6txvlhco" });
  };
  const oldFetch = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/release.json") return Response.json({ version: publication.productVersion, commit: publication.productCommit });
    if (pathname === "/content-manifest.json") return Response.json({
      version: publication.productVersion,
      commit: publication.productCommit,
      sitePublicationId: "old-publication",
      snapshotHash: "old-snapshot",
      baseSiteArtifactId: publication.productArtifactId,
      activeContentReleaseIds: [],
      publishedSlugs: [],
      publishedArticleSlugs: [],
      practiceIds: [],
      profileIds: [],
      businessObservationIds: [],
      mediaPaths: [],
      contentReleaseReceipts: [],
      candidatePackageRevisionId: null,
      contentReplacement: null,
    });
    return new Response("<title>xingbuild</title>");
  };
  await assert.rejects(transportSitePublication({ publication, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl: oldFetch, maxAttempts: 1, initialDelayMs: 0, maxDelayMs: 0, sleepImpl: async () => {} }), /timed out/);
  const persisted = JSON.parse(await readFile(path.join(client, "site-publication.json"), "utf8"));
  const resumed = await transportSitePublication({ publication: { ...persisted, client }, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl: publicFetch({ publication }), maxAttempts: 1 });
  assert.equal(resumed.state, "released");
  assert.equal(resumed.deploymentId, "dep-resume-drift");
  assert.equal(deployCalls, 1);
  assert.equal(resumed.propagation.observedIdentity.sitePublicationId, "old-publication");
});

test("one global site lease rejects a different snapshot while transport is in progress", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-site-lease-"));
  const leaseDirectory = path.join(root, ".site-lease");
  const first = await acquireSitePublicationLease({ publicationDirectory: path.join(root, "one"), leaseDirectory, sitePublicationId: "pub-one", snapshotHash: "one", now: 1_000, ttlMs: 10_000 });
  await assert.rejects(acquireSitePublicationLease({ publicationDirectory: path.join(root, "two"), leaseDirectory, sitePublicationId: "pub-two", snapshotHash: "two", now: 1_001, ttlMs: 10_000 }), /lease is held/);
  await releaseSitePublicationLease(first);
});

test("resume reuses the persisted deployment and returns success only after public evidence", async () => {
  const root = await rootFixture();
  const client = path.join(root, "publication");
  await mkdir(client, { recursive: true });
  const publication = { ...publicationFixture({ sitePublicationId: "pub-resume", snapshotHash: "snapshot-resume" }), client };
  let deployCalls = 0;
  const runCaptureImpl = (_command, args) => {
    if (args[0] === "whoami") return "authenticated";
    deployCalls += 1;
    return JSON.stringify({ status: "success", deploymentId: "dep-resume", projectId: "makers-ze0f6txvlhco" });
  };
  const first = await transportSitePublication({ publication, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl: publicFetch({ publication }), maxAttempts: 1 });
  assert.equal(first.state, "released");
  assert.equal(deployCalls, 1);
  const persisted = JSON.parse(await readFile(path.join(client, "site-publication.json"), "utf8"));
  const second = await transportSitePublication({ publication: { ...persisted, client }, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl: publicFetch({ publication }), maxAttempts: 1 });
  assert.equal(second.state, "released");
  assert.equal(deployCalls, 1);
});

test("resume identity drift hard fails before a second deployment", async () => {
  const root = await rootFixture();
  const client = path.join(root, "publication");
  await mkdir(client, { recursive: true });
  const publication = { ...publicationFixture({ sitePublicationId: "pub-original", snapshotHash: "snapshot-original" }), client };
  await writeFile(path.join(client, "site-publication.json"), JSON.stringify({ ...publication, state: "recoverable", deploymentId: "dep-original" }));
  let deployCalls = 0;
  const runCaptureImpl = (_command, args) => {
    if (args[0] === "whoami") return "authenticated";
    deployCalls += 1;
    return JSON.stringify({ status: "success", deploymentId: "dep-new", projectId: "makers-ze0f6txvlhco" });
  };
  await assert.rejects(
    transportSitePublication({ publication: { ...publication, sitePublicationId: "pub-drift", client }, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl: publicFetch({ publication }), maxAttempts: 1 }),
    /persisted SitePublication identity does not match resume request/,
  );
  assert.equal(deployCalls, 0);
});
