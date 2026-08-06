import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  activateContentSet,
  assertBidirectionalContentSetManifests,
  createContentSet,
  migrateContentSet,
  readActiveContentSet,
} from "../scripts/lib/content-set.mjs";
import { createSiteSnapshot } from "../scripts/lib/site-snapshot.mjs";
import {
  attachPublicationDeployment,
  createPublicationRun,
  markPublicationReleased,
  writePublicationRun,
} from "../scripts/lib/publication-run.mjs";
import { finalizeSitePublication, rollbackSitePublication } from "../scripts/lib/site-publication-coordinator.mjs";
import { writeJsonAtomically } from "../scripts/lib/content-release-state.mjs";
import { assertProductArtifactIdentity } from "../scripts/lib/product-artifact.mjs";
import { hashArtifactValue } from "../scripts/lib/base-site-artifact.mjs";
import { homeContentSetEntry, homeContentHash } from "../scripts/lib/home-content-adapter.mjs";

function receipt({ contentReleaseId = "content-example-1", kind = "content", target = "example", contentHash = "a".repeat(64) } = {}) {
  return {
    contentReleaseId,
    kind,
    target,
    targetPath: kind === "content" ? `/observations/${target}` : "/products",
    contentHash,
    receiptHash: "b".repeat(64),
    publishedSlugs: kind === "content" ? [target] : [],
    publishedArticleSlugs: [],
    practiceIds: [],
    profileIds: [],
    businessObservationIds: [],
    mediaPaths: [],
  };
}

function manifest(version = "v0.26.0", commit = "a".repeat(40)) {
  const item = receipt();
  const home = receipt({ contentReleaseId: "home-legacy", kind: "home", target: "home", contentHash: "h".repeat(64) });
  home.targetPath = "/";
  home.publishedSlugs = [];
  return {
    version,
    commit,
    baseSiteArtifactId: `${version}-${commit.slice(0, 12)}`,
    publishedSlugs: ["example"],
    publishedArticleSlugs: [],
    practiceIds: [],
    profileIds: [],
    businessObservationIds: [],
    mediaPaths: [],
    homeContent: {
      description: "d",
      homeTitle: "t",
      emptyStates: { observations: { message: "m", description: "e" } },
    },
    contentReleaseReceipts: [item, home],
  };
}

test("ContentSet migration is deterministic and activates only reconciled public entries", async () => {
  const sourceRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-set-"));
  const local = manifest();
  const remote = manifest();
  const first = await migrateContentSet({ sourceRoot, localManifest: local, publicManifest: remote, now: "2026-08-06T00:00:00.000Z" });
  const second = createContentSet({ entries: first.contentSet.entries, homeContent: first.contentSet.homeContent, migration: first.contentSet.migration, createdAt: "2027-01-01T00:00:00.000Z" });
  assert.equal(first.contentSet.contentSetId, second.contentSetId);
  assert.equal((await readActiveContentSet({ sourceRoot })).contentSet.contentSetId, first.contentSet.contentSetId);
  await assert.rejects(
    () => migrateContentSet({ sourceRoot, localManifest: { ...local, publishedSlugs: [] }, publicManifest: remote }),
    /collection publishedSlugs mismatch/,
  );
  const withoutHome = manifest();
  withoutHome.contentReleaseReceipts = withoutHome.contentReleaseReceipts.filter((entry) => entry.kind !== "home");
  await assert.rejects(
    () => migrateContentSet({ sourceRoot, localManifest: withoutHome, publicManifest: withoutHome, homeContent: local.homeContent }),
    /reconciled home entry from local source and public page\/manifest evidence/,
  );
});

test("ContentSet active pointer uses compare-and-swap and does not replace another active set", async () => {
  const sourceRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-cas-"));
  const first = createContentSet({ entries: [{ kind: "profile", target: "about", contentHash: "c".repeat(64), route: "/about", sourceProof: ["career"], reviewProof: { status: "approved" } }] });
  const second = createContentSet({ entries: [{ kind: "profile", target: "about", contentHash: "d".repeat(64), route: "/about", sourceProof: ["career"], reviewProof: { status: "approved" } }], previousContentSetId: first.contentSetId });
  await (await import("../scripts/lib/content-set.mjs")).writeContentSet({ sourceRoot, contentSet: first });
  await (await import("../scripts/lib/content-set.mjs")).writeContentSet({ sourceRoot, contentSet: second });
  await activateContentSet({ sourceRoot, nextContentSetId: first.contentSetId, expectedContentSetId: null });
  await assert.rejects(() => activateContentSet({ sourceRoot, nextContentSetId: second.contentSetId, expectedContentSetId: "content-set-wrong" }), /active CAS conflict/);
  await activateContentSet({ sourceRoot, nextContentSetId: second.contentSetId, expectedContentSetId: first.contentSetId });
  assert.equal((await readActiveContentSet({ sourceRoot })).contentSet.contentSetId, second.contentSetId);
});

test("SiteSnapshot and PublicationRun keep one deployment per snapshot and support resume", async () => {
  const contentSet = createContentSet({ entries: [{ kind: "product", target: "robotaxi", contentHash: "e".repeat(64), route: "/products", sourceProof: ["product"], reviewProof: { status: "approved" } }] });
  const productArtifact = { productArtifactId: "v0.26.0-aaaaaaaaaaaa", productVersion: "v0.26.0", productCommit: "a".repeat(40), baseSiteArtifactId: "v0.26.0-aaaaaaaaaaaa" };
  const snapshot = createSiteSnapshot({ productArtifact, contentSet, createdAt: "2026-08-06T00:00:00.000Z" });
  const run = createPublicationRun({ siteSnapshot: snapshot, createdAt: "2026-08-06T00:00:00.000Z" });
  const deployed = attachPublicationDeployment(run, { deploymentId: "dep-1", deployment: { deploymentId: "dep-1", status: "success" } });
  assert.equal(attachPublicationDeployment(deployed, { deploymentId: "dep-1" }).deploymentCount, 1);
  assert.throws(() => attachPublicationDeployment(deployed, { deploymentId: "dep-2" }), /second deployment/);
  const released = markPublicationReleased(deployed, { sitePublicationId: "v0.26.0+dep", snapshotHash: snapshot.snapshotHash, contentSetId: contentSet.contentSetId, contentSetHash: contentSet.contentSetHash });
  assert.equal(released.state, "released");
});

test("SitePublication finalizes and rolls back a ContentSet without reading legacy registry", async () => {
  const sourceRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-contentset-publication-"));
  const first = createContentSet({ entries: [{ kind: "profile", target: "about", contentHash: "f".repeat(64), route: "/about", sourceProof: ["career"], reviewProof: { status: "approved" } }] });
  const second = createContentSet({ entries: [{ kind: "profile", target: "about", contentHash: "0".repeat(64), route: "/about", sourceProof: ["career"], reviewProof: { status: "approved" } }], previousContentSetId: first.contentSetId });
  const { writeContentSet } = await import("../scripts/lib/content-set.mjs");
  await writeContentSet({ sourceRoot, contentSet: first });
  await writeContentSet({ sourceRoot, contentSet: second });
  await activateContentSet({ sourceRoot, nextContentSetId: first.contentSetId, expectedContentSetId: null });
  const productArtifact = { productArtifactId: "v0.26.0-aaaaaaaaaaaa", productVersion: "v0.26.0", productCommit: "a".repeat(40), baseSiteArtifactId: "v0.26.0-aaaaaaaaaaaa" };
  const snapshot = createSiteSnapshot({ productArtifact, contentSet: second, createdAt: "2026-08-06T00:00:00.000Z" });
  const publicationRun = attachPublicationDeployment(createPublicationRun({ siteSnapshot: snapshot, createdAt: "2026-08-06T00:00:00.000Z" }), { deploymentId: "dep-1", deployment: { deploymentId: "dep-1", status: "success" } });
  await writePublicationRun({ sourceRoot, run: publicationRun });
  const publicationDirectory = path.join(sourceRoot, ".content-workspace", "site-publications", "candidate");
  await mkdir(publicationDirectory, { recursive: true });
  const contentManifest = { ...snapshot.contentManifest, sitePublicationId: "v0.26.0+candidate", siteSnapshotId: snapshot.siteSnapshotId, snapshotHash: snapshot.snapshotHash };
  const publication = { sitePublicationId: "v0.26.0+candidate", productVersion: productArtifact.productVersion, productCommit: productArtifact.productCommit, productArtifactId: productArtifact.productArtifactId, contentReleaseIds: [], contentSetId: second.contentSetId, contentSetHash: second.contentSetHash, siteSnapshotId: snapshot.siteSnapshotId, snapshotHash: snapshot.snapshotHash, publicationRunId: publicationRun.publicationRunId, contentManifest, deploymentId: "dep-1", state: "verifying" };
  await writeJsonAtomically(path.join(publicationDirectory, "site-publication.json"), publication);
  const publicVerify = { sitePublicationId: publication.sitePublicationId, snapshotHash: publication.snapshotHash, siteSnapshotId: publication.siteSnapshotId, contentSetId: publication.contentSetId, contentSetHash: publication.contentSetHash, baseSiteArtifactId: publication.productArtifactId, contentManifest };
  const finalized = await finalizeSitePublication({ publicationDirectory, publicVerify, sourceRoot });
  assert.equal(finalized.state, "released");
  assert.equal((await readActiveContentSet({ sourceRoot })).contentSet.contentSetId, second.contentSetId);
  const rolledBack = await rollbackSitePublication({ publicationDirectory, reason: "test" });
  assert.equal(rolledBack.state, "rolled-back");
  assert.equal((await readActiveContentSet({ sourceRoot })).contentSet.contentSetId, first.contentSetId);
});

test("ProductArtifact rejects parent, partial, and manifest hash drift before transport", () => {
  const release = { version: "v0.26.0", commit: "a".repeat(40), baseSiteArtifactId: "v0.26.0-aaaaaaaaaaaa" };
  const contentManifest = { version: release.version, commit: release.commit, baseSiteArtifactId: release.baseSiteArtifactId, publishedSlugs: [] };
  const baseSiteArtifact = {
    baseSiteArtifactId: release.baseSiteArtifactId,
    productVersion: release.version,
    productCommit: release.commit,
    releaseManifestHash: hashArtifactValue(release),
    artifactContentHash: hashArtifactValue({ release, contentManifest }),
    sourceBundleHash: "b".repeat(64),
  };
  const artifact = assertProductArtifactIdentity({ release, contentManifest, baseSiteArtifact });
  assert.equal(artifact.productArtifactId, release.baseSiteArtifactId);
  assert.throws(() => assertProductArtifactIdentity({ release: { ...release, commit: "c".repeat(40) }, contentManifest, baseSiteArtifact }), /commit/);
  assert.throws(() => assertProductArtifactIdentity({ release, contentManifest: { ...contentManifest, publishedSlugs: ["stale"] }, baseSiteArtifact }), /artifactContentHash drift/);
});

test("Home adapter keeps the four approved fields in one stable ContentSet entry", () => {
  const value = { description: "d", homeTitle: "t", emptyStates: { observations: { message: "m", description: "e" } } };
  const entry = homeContentSetEntry({ value, sourceProof: ["legacy:src/content/siteContent.js"], reviewProof: { status: "approved" } });
  assert.equal(entry.entryId, "home:home");
  assert.equal(entry.kind, "home");
  assert.equal(entry.route, "/");
  assert.equal(entry.contentHash, homeContentHash(value));
  assert.deepEqual(entry.mediaProof, []);
});
