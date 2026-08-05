import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertSitePublicationEvidence, createActiveContentSet, createSitePublication, readActiveContentReleases, sitePublicationId, sitePublicationIdempotencyKey, validateUploadQuota } from "../scripts/lib/site-publication.mjs";
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

async function writeReleasedReceipt(releases, { id, target, projectionBase = "v0.25.4-99dcd94b08f8", omitProjectionBase = false, partialProjection = false, omitGlobalProjection = false, staleGlobalProjection = false } = {}) {
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
  if (omitGlobalProjection) {
    for (const field of ["publishedSlugs", "publishedArticleSlugs", "practiceIds", "profileIds", "businessObservationIds"]) delete projection[field];
  }
  if (staleGlobalProjection) projection.publishedSlugs = ["stale-global-value"];
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

test("receipt registry remains authoritative when a finalized package omits global collections", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-receipt-projection-"));
  const releases = path.join(root, "releases");
  await writeReleasedReceipt(releases, { id: "content-finalized-" + "3".repeat(16), target: "finalized", omitGlobalProjection: true });
  const active = await readActiveContentReleases(releases);
  assert.equal(active.length, 1);
  assert.deepEqual(active[0].publishedSlugs, ["finalized"]);
  assert.deepEqual(createActiveContentSet(active).publishedSlugs, ["finalized"]);
});

test("ActiveContentSet ignores stale package-global collections and emits one canonical snapshot projection", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-receipt-stale-projection-"));
  const releases = path.join(root, "releases");
  await writeReleasedReceipt(releases, { id: "content-stale-" + "4".repeat(16), target: "canonical", staleGlobalProjection: true });
  const active = await readActiveContentReleases(releases);
  const set = createActiveContentSet(active);
  assert.deepEqual(set.publishedSlugs, ["canonical"]);
  assert.deepEqual(set.activeContentReleaseIds, ["content-stale-" + "4".repeat(16)]);
  assert.deepEqual(set.contentReleaseReceipts[0].publishedSlugs, ["canonical"]);
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

test("Didi finalized plus Ojai candidate keeps the active inventory complete", async (t) => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const contentReleaseId = "content-waymo-ojai-first-public-rider-plan-bc67e9bf935bbff0";
  const packageRevisionId = "revision-7e65a94afb3333fa";
  const candidatePackageDirectory = path.join(root, ".content-workspace", "releases", contentReleaseId, "revisions", packageRevisionId);
  const candidate = JSON.parse(await readFile(path.join(candidatePackageDirectory, "content-release.json"), "utf8"));
  const activeReceipt = (await readActiveContentReleases(path.join(root, ".content-workspace", "releases"))).find((item) => item.contentReleaseId === contentReleaseId);
  if (candidate.supersedesPackageId !== (activeReceipt?.packageRevisionId || activeReceipt?.contentReleaseId)) {
    t.skip("retained content workspace has a newer active replacement; product tests must not mutate or rewind it");
    return;
  }
  const temp = await mkdtemp(path.join(os.tmpdir(), "xingbuild-replacement-publication-"));
  const product = path.join(temp, "product");
  await mkdir(product, { recursive: true });
  await writeFile(path.join(product, "release.json"), JSON.stringify({ version: "v0.25.7", commit: "5a983e3aca7ce7cb1cab153b50ee0789d698ea76" }));
  await cp(
    path.join(root, ".content-workspace", "base-site-artifacts", "v0.25.7-5a983e3aca7c", "base-site-artifact.json"),
    path.join(product, "base-site-artifact.json"),
  );
  const publication = await createSitePublication({
    productClient: product,
    releasesRoot: path.join(root, ".content-workspace", "releases"),
    outputRoot: path.join(temp, packageRevisionId),
    additionalContentManifest: candidate,
    candidatePackageDirectory,
    sourceRoot: root,
  });
  assert.equal(publication.contentReleaseIds.length, 34);
  assert.equal(publication.contentManifest.publishedSlugs.length, 33);
  assert.equal(publication.contentManifest.practiceIds.length, 1);
  assert.equal(publication.contentManifest.contentReleaseReceipts.filter((item) => item.contentReleaseId === contentReleaseId).length, 1);
  assert.equal(publication.contentManifest.contentReleaseReceipts.find((item) => item.contentReleaseId === contentReleaseId).packageRevisionId, packageRevisionId);
  assert.equal(publication.contentManifest.contentReleaseReceipts.find((item) => item.contentReleaseId.startsWith("content-didi-")).packageRevisionId, "revision-988ae19646556ba9");
  assert.equal(publication.contentReplacement.supersedesPackageId, contentReleaseId);
  const waymo = JSON.parse(await readFile(path.join(root, ".content-workspace", "releases", "content-waymo-us-service-area-expansion-0207712472144f3d", "revisions", "revision-d7506767085cfd37", "content-release.json"), "utf8"));
  assert.equal(waymo.state, "prepared");
});

test("replacement identity, review, source, and base drift hard fail", async (t) => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const contentReleaseId = "content-waymo-ojai-first-public-rider-plan-bc67e9bf935bbff0";
  const candidatePackageDirectory = path.join(root, ".content-workspace", "releases", contentReleaseId, "revisions", "revision-7e65a94afb3333fa");
  const candidate = JSON.parse(await readFile(path.join(candidatePackageDirectory, "content-release.json"), "utf8"));
  const activeReceipt = (await readActiveContentReleases(path.join(root, ".content-workspace", "releases"))).find((item) => item.contentReleaseId === contentReleaseId);
  if (candidate.supersedesPackageId !== (activeReceipt?.packageRevisionId || activeReceipt?.contentReleaseId)) {
    t.skip("retained content workspace has a newer active replacement; product tests must not mutate or rewind it");
    return;
  }
  const options = { candidatePackageDirectory, activeReceipt, productArtifactId: "v0.25.7-5a983e3aca7c", sourceRoot: root };
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
  const output = await mkdtemp(path.join(os.tmpdir(), "xingbuild-incremental-publication-"));
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
