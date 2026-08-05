import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertSitePublicationEvidence, createSitePublication, readActiveContentReleases, sitePublicationId, sitePublicationIdempotencyKey, validateUploadQuota } from "../scripts/lib/site-publication.mjs";
import { validateContentReplacement } from "../scripts/lib/content-replacement.mjs";
import { fileURLToPath } from "node:url";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-publication-"));
  const product = path.join(root, "product");
  const releases = path.join(root, "releases");
  await mkdir(product, { recursive: true });
  await mkdir(path.join(releases, "content-a", "dist", "client"), { recursive: true });
  await writeFile(path.join(product, "release.json"), JSON.stringify({ version: "v0.24.30", commit: "a".repeat(40) }));
  await writeFile(path.join(product, "content-manifest.json"), JSON.stringify({ version: "v0.24.30", commit: "a".repeat(40), publishedSlugs: [], publishedArticleSlugs: [] }));
  const receipt = { state: "released", contentReleaseId: "content-a", contentHash: "b".repeat(64), kind: "content", target: "a", targetPath: "/observations/a", baseSiteArtifactId: "v0.24.30-aaaaaaaaaaaa", deploymentId: "dep-a", publicVerify: { ok: true }, publishedSlugs: ["a"], publishedArticleSlugs: [], practiceIds: [], profileIds: [], businessObservationIds: [] };
  await writeFile(path.join(releases, "content-a", "dist", "client", "content-manifest.json"), JSON.stringify(receipt));
  await writeFile(path.join(releases, "content-a", "content-release.json"), JSON.stringify(receipt));
  await writeFile(path.join(releases, "content-a", "completion.json"), JSON.stringify({ contentReleaseId: "content-a", contentHash: receipt.contentHash, kind: "content", target: "a", baseSiteArtifactId: receipt.baseSiteArtifactId }));
  return { root, product, releases, output: path.join(root, "snapshot") };
}

async function writeReleasedReceipt(releases, { id, target, projectionBase = "v0.25.4-99dcd94b08f8", omitProjectionBase = false, partialProjection = false } = {}) {
  const directory = path.join(releases, id);
  await mkdir(path.join(directory, "dist", "client"), { recursive: true });
  const receipt = {
    state: "released",
    contentReleaseId: id,
    contentHash: "c".repeat(64),
    kind: "content",
    target,
    targetPath: `/observations/${target}`,
    baseSiteArtifactId: projectionBase,
    deploymentId: `dep-${target}`,
    publicVerify: { ok: true },
    publishedSlugs: [target],
    publishedArticleSlugs: [],
    practiceIds: [],
    profileIds: [],
    businessObservationIds: [],
  };
  await writeFile(path.join(directory, "content-release.json"), JSON.stringify(receipt));
  await writeFile(path.join(directory, "completion.json"), JSON.stringify({ contentReleaseId: id, contentHash: receipt.contentHash, kind: "content", target, baseSiteArtifactId: projectionBase }));
  const projection = { ...receipt };
  if (omitProjectionBase) delete projection.baseSiteArtifactId;
  if (partialProjection) delete projection.contentHash;
  await writeFile(path.join(directory, "dist", "client", "content-manifest.json"), JSON.stringify(projection));
  return receipt;
}

test("site publication preserves active content when product snapshot is rebuilt", async () => {
  const f = await fixture();
  const publication = await createSitePublication({ productClient: f.product, releasesRoot: f.releases, outputRoot: f.output });
  assert.deepEqual(publication.contentManifest.publishedSlugs, ["a"]);
  assert.deepEqual(JSON.parse(await readFile(path.join(f.output, "content-manifest.json"))).publishedSlugs, ["a"]);
});

test("same SitePublication identity preserves persisted deployment evidence on reassembly", async () => {
  const f = await fixture();
  const first = await createSitePublication({ productClient: f.product, releasesRoot: f.releases, outputRoot: f.output });
  const deployment = { deploymentId: "deployment-stable", url: "https://example.invalid" };
  await writeFile(path.join(f.output, "site-publication.json"), `${JSON.stringify({ ...first, client: undefined, state: "recoverable", deployment }, null, 2)}\n`);
  const resumed = await createSitePublication({ productClient: f.product, releasesRoot: f.releases, outputRoot: f.output });
  assert.equal(resumed.sitePublicationId, first.sitePublicationId);
  assert.equal(resumed.snapshotHash, first.snapshotHash);
  assert.deepEqual(JSON.parse(await readFile(path.join(f.output, "deployment.json"), "utf8")), deployment);
});

test("released receipt remains active when a legacy projection omits baseSiteArtifactId", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-receipt-legacy-"));
  const releases = path.join(root, "releases");
  await writeReleasedReceipt(releases, { id: "content-legacy-" + "1".repeat(16), target: "legacy", omitProjectionBase: true });
  const active = await readActiveContentReleases(releases);
  assert.equal(active.length, 1);
  assert.equal(active[0].projectionStatus, "legacy-base-missing");
  assert.deepEqual(active[0].publishedSlugs, ["legacy"]);
});

test("partial or drifting content projections hard fail instead of silently dropping a released receipt", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-receipt-partial-"));
  const releases = path.join(root, "releases");
  await writeReleasedReceipt(releases, { id: "content-partial-" + "2".repeat(16), target: "partial", partialProjection: true });
  await assert.rejects(readActiveContentReleases(releases), /projection is partial/);
});

test("site publication requires deployment and both public verification records", () => {
  assert.throws(() => assertSitePublicationEvidence({ deployment: null, productVerify: {}, contentVerify: {}, publicVerify: {} }), /deployment JSON/);
  assert.throws(() => assertSitePublicationEvidence({ deployment: { deploymentId: "dep" }, productVerify: {}, contentVerify: {}, publicVerify: {} }), /public verification/);
  assert.equal(assertSitePublicationEvidence({ deployment: { deploymentId: "dep" }, productVerify: { ok: true }, contentVerify: { ok: true }, publicVerify: { ok: true } }), true);
});

test("workspace receipt facts retain every released target including legacy projection packages", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const active = await readActiveContentReleases(path.join(root, ".content-workspace", "releases"));
  assert.equal(active.length, 34);
  assert.equal(active.flatMap((item) => item.publishedSlugs).length, 33);
  assert.equal(active.flatMap((item) => item.practiceIds).length, 1);
  assert.ok(active.every((item) => item.deploymentId && item.publicVerify && item.baseSiteArtifactId));
  assert.ok(active.some((item) => item.baseSiteArtifactId === "v0.24.26-70847cdf6df0"));
  for (const target of ["nhtsa-first-responder-requirement", "didi-20f-autonomous-driving-disclosure", "waymo-ojai-first-public-rider-plan", "waymo-us-service-area-expansion"]) {
    assert.ok(active.some((item) => item.target === target));
  }
});

test("three existing Brief revisions replace one logical slot without changing the active inventory", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const temp = await mkdtemp(path.join(os.tmpdir(), "xingbuild-replacement-publication-"));
  const product = path.join(temp, "product");
  await mkdir(product, { recursive: true });
  await writeFile(path.join(product, "release.json"), JSON.stringify({ version: "v0.25.5", commit: "554526b93e62d589b132308b185d8e40b90e89a0" }));
  await cp(
    path.join(root, ".content-workspace", "base-site-artifacts", "v0.25.5-554526b93e62", "base-site-artifact.json"),
    path.join(product, "base-site-artifact.json"),
  );
  const revisions = [
    ["content-didi-20f-autonomous-driving-disclosure-8a47aeb08c8371ad", "revision-ace50f5aea5235ee"],
    ["content-waymo-ojai-first-public-rider-plan-bc67e9bf935bbff0", "revision-2bb55e82e07fe0a4"],
    ["content-waymo-us-service-area-expansion-0207712472144f3d", "revision-d7506767085cfd37"],
  ];
  for (const [contentReleaseId, packageRevisionId] of revisions) {
    const candidatePackageDirectory = path.join(root, ".content-workspace", "releases", contentReleaseId, "revisions", packageRevisionId);
    const candidate = JSON.parse(await readFile(path.join(candidatePackageDirectory, "content-release.json"), "utf8"));
    const outputRoot = path.join(temp, packageRevisionId);
    const first = await createSitePublication({
      productClient: product,
      releasesRoot: path.join(root, ".content-workspace", "releases"),
      outputRoot,
      additionalContentManifest: candidate,
      candidatePackageDirectory,
      sourceRoot: root,
    });
    const resumed = await createSitePublication({
      productClient: product,
      releasesRoot: path.join(root, ".content-workspace", "releases"),
      outputRoot,
      additionalContentManifest: candidate,
      candidatePackageDirectory,
      sourceRoot: root,
    });
    assert.equal(first.contentReleaseIds.length, 34);
    assert.equal(first.contentManifest.publishedSlugs.length, 33);
    assert.equal(first.contentManifest.practiceIds.length, 1);
    assert.equal(first.contentManifest.contentReleaseReceipts.filter((item) => item.contentReleaseId === contentReleaseId).length, 1);
    assert.equal(first.contentManifest.contentReleaseReceipts.find((item) => item.contentReleaseId === contentReleaseId).packageRevisionId, packageRevisionId);
    assert.equal(first.contentReplacement.supersedesPackageId, contentReleaseId);
    assert.equal(first.sitePublicationId, resumed.sitePublicationId);
    assert.equal(first.snapshotHash, resumed.snapshotHash);
  }
});

test("replacement identity, review, source, and base drift hard fail", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const contentReleaseId = "content-didi-20f-autonomous-driving-disclosure-8a47aeb08c8371ad";
  const candidatePackageDirectory = path.join(root, ".content-workspace", "releases", contentReleaseId, "revisions", "revision-ace50f5aea5235ee");
  const candidate = JSON.parse(await readFile(path.join(candidatePackageDirectory, "content-release.json"), "utf8"));
  const activeReceipt = (await readActiveContentReleases(path.join(root, ".content-workspace", "releases"))).find((item) => item.contentReleaseId === contentReleaseId);
  const options = { candidatePackageDirectory, activeReceipt, productArtifactId: "v0.25.5-554526b93e62", sourceRoot: root };
  await validateContentReplacement({ ...options, candidate });
  await assert.rejects(validateContentReplacement({ ...options, candidate: { ...candidate, contentHash: "0".repeat(64) } }), /logical contentHash drift/);
  await assert.rejects(validateContentReplacement({ ...options, candidate: { ...candidate, target: "wrong-target" } }), /logical target drift/);
  await assert.rejects(validateContentReplacement({ ...options, candidate: { ...candidate, kind: "article" } }), /logical kind drift/);
  await assert.rejects(validateContentReplacement({ ...options, candidate: { ...candidate, reviewedAt: "wrong-review" } }), /reviewedAt drift/);
  await assert.rejects(validateContentReplacement({ ...options, candidate: { ...candidate, sourceHash: "0".repeat(64) } }), /revision tuple drift/);
  await assert.rejects(validateContentReplacement({ ...options, candidate: { ...candidate, baseSiteArtifactId: "wrong-base" } }), /revision tuple drift/);
});

test("incremental content publication merges eight active releases with one candidate", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const product = path.join(root, "dist", "client");
  const output = path.join(root, ".content-workspace", "site-publications", "test-8-plus-1");
  const publication = await createSitePublication({
    productClient: product,
    releasesRoot: path.join(root, ".content-workspace", "releases"),
    outputRoot: output,
    additionalContentManifest: { contentReleaseId: "candidate-one", contentHash: "a".repeat(64), kind: "content", target: "candidate-one", targetPath: "/observations/candidate-one", baseSiteArtifactId: "base", publishedSlugs: ["candidate-one"], publishedArticleSlugs: [] },
  });
  assert.equal(publication.contentReleaseIds.length, (await readActiveContentReleases(path.join(root, ".content-workspace", "releases"))).length + 1);
  assert.ok(publication.contentManifest.publishedSlugs.includes("candidate-one"));
});

test("incremental publication identity is stable and distinct from candidate deployment", () => {
  const id = sitePublicationId({ productVersion: "v0.24.32", productCommit: "a".repeat(40), contentReleaseIds: ["a", "b"] });
  assert.equal(id, sitePublicationId({ productVersion: "v0.24.32", productCommit: "a".repeat(40), contentReleaseIds: ["a", "b"] }));
  assert.equal(sitePublicationIdempotencyKey({ sitePublicationId: id }).length, 64);
});

test("upload quota rejects oversized files before transport", async () => {
  const f = await fixture();
  await assert.rejects(() => validateUploadQuota(f.product, { maxFileBytes: 1 }), /max single file size/);
});
