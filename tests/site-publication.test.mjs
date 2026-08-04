import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertSitePublicationEvidence, createSitePublication, readActiveContentReleases, sitePublicationId, sitePublicationIdempotencyKey, validateUploadQuota } from "../scripts/lib/site-publication.mjs";
import { fileURLToPath } from "node:url";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-publication-"));
  const product = path.join(root, "product");
  const releases = path.join(root, "releases");
  await mkdir(product, { recursive: true });
  await mkdir(path.join(releases, "content-a", "dist", "client"), { recursive: true });
  await writeFile(path.join(product, "release.json"), JSON.stringify({ version: "v0.24.30", commit: "a".repeat(40) }));
  await writeFile(path.join(product, "content-manifest.json"), JSON.stringify({ version: "v0.24.30", commit: "a".repeat(40), publishedSlugs: [], publishedArticleSlugs: [] }));
  await writeFile(path.join(releases, "content-a", "dist", "client", "content-manifest.json"), JSON.stringify({ state: "released", contentReleaseId: "content-a", deploymentId: "dep-a", publicVerify: { ok: true }, publishedSlugs: ["a"], publishedArticleSlugs: [] }));
  await writeFile(path.join(releases, "content-a", "content-release.json"), JSON.stringify({ state: "released", contentReleaseId: "content-a", deploymentId: "dep-a", publicVerify: { ok: true } }));
  await writeFile(path.join(releases, "content-a", "completion.json"), JSON.stringify({ contentReleaseId: "content-a" }));
  return { root, product, releases, output: path.join(root, "snapshot") };
}

test("site publication preserves active content when product snapshot is rebuilt", async () => {
  const f = await fixture();
  const publication = await createSitePublication({ productClient: f.product, releasesRoot: f.releases, outputRoot: f.output });
  assert.deepEqual(publication.contentManifest.publishedSlugs, ["a"]);
  assert.deepEqual(JSON.parse(await readFile(path.join(f.output, "content-manifest.json"))).publishedSlugs, ["a"]);
});

test("site publication requires deployment and both public verification records", () => {
  assert.throws(() => assertSitePublicationEvidence({ deployment: null, productVerify: {}, contentVerify: {}, publicVerify: {} }), /deployment JSON/);
  assert.throws(() => assertSitePublicationEvidence({ deployment: { deploymentId: "dep" }, productVerify: {}, contentVerify: {}, publicVerify: {} }), /public verification/);
  assert.equal(assertSitePublicationEvidence({ deployment: { deploymentId: "dep" }, productVerify: { ok: true }, contentVerify: { ok: true }, publicVerify: { ok: true } }), true);
});

test("workspace released lifecycle facts retain all eight previously published packages", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const active = await readActiveContentReleases(path.join(root, ".content-workspace", "releases"));
  assert.ok(active.length >= 8);
  assert.ok(active.every((item) => item.deploymentId && item.publicVerify && item.baseSiteArtifactId));
  assert.ok(active.some((item) => item.baseSiteArtifactId === "v0.24.26-70847cdf6df0"));
});

test("incremental content publication merges eight active releases with one candidate", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const product = path.join(root, "dist", "client");
  const output = path.join(root, ".content-workspace", "site-publications", "test-8-plus-1");
  const publication = await createSitePublication({
    productClient: product,
    releasesRoot: path.join(root, ".content-workspace", "releases"),
    outputRoot: output,
    additionalContentManifest: { contentReleaseId: "candidate-one", contentHash: "a".repeat(64), target: "candidate-one", baseSiteArtifactId: "base", publishedSlugs: ["candidate-one"], publishedArticleSlugs: [] },
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
