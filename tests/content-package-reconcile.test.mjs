import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { reconcileContentPackage } from "../scripts/lib/content-package-reconcile.mjs";
import { readActiveContentReleases } from "../scripts/lib/site-publication.mjs";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const artifactId = "v0.25.1-f6c5a61c46e3";
const releaseId = "content-nhtsa-first-responder-requirement-cdbce9f16feccd94";
const target = "nhtsa-first-responder-requirement";
const content = `${JSON.stringify({ slug: target, status: "published", sources: [{ id: "source-nhtsa" }] }, null, 2)}\n`;

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-reconcile-"));
  const files = [
    [`.content-workspace/content/observations/${target}.json`, content],
    [`.content-workspace/drafts/${target}.json`, content],
    [`.content-workspace/recoveries/${target}.json`, content],
  ];
  const { createHash } = await import("node:crypto");
  const contentHash = createHash("sha256").update(content).digest("hex");
  files.push([`.content-workspace/reviews/${target}.json`, `${JSON.stringify({ status: "approved", contentHash })}\n`]);
  files.push([`.content-workspace/releases/${releaseId}/content-release.json`, `${JSON.stringify({ contentReleaseId: releaseId, kind: "content", target, contentHash, state: "released", deploymentId: "old-deployment", publicVerify: { ok: true }, baseSiteArtifactId: "stale-base", baseSiteArtifact: { baseSiteArtifactId: "older-base" } }, null, 2)}\n`]);
  for (const [relative, value] of files) {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, value);
  }
  const artifactDirectory = path.join(root, ".content-workspace", "base-site-artifacts", artifactId);
  await mkdir(artifactDirectory, { recursive: true });
  await cp(path.join(projectRoot, ".content-workspace", "base-site-artifacts", artifactId, "base-site-artifact.json"), path.join(artifactDirectory, "base-site-artifact.json"));
  return { root, contentHash };
}

async function markRevisionReleased(reconciled, baseSiteArtifactId) {
  const manifest = { ...reconciled, state: "released", deploymentId: "new-deployment", publicVerify: { ok: true }, targetPath: `/observations/${target}`, publishedSlugs: [target], publishedArticleSlugs: [], practiceIds: [], profileIds: [], businessObservationIds: [] };
  delete manifest.packageDirectory; delete manifest.manifestPath; delete manifest.sourceDirectory; delete manifest.sourceRoot; delete manifest.lineagePath; delete manifest.reused;
  await writeFile(reconciled.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await mkdir(path.join(reconciled.packageDirectory, "dist", "client"), { recursive: true });
  await writeFile(path.join(reconciled.packageDirectory, "dist", "client", "content-manifest.json"), `${JSON.stringify(manifest)}\n`);
  await writeFile(path.join(reconciled.packageDirectory, "completion.json"), `${JSON.stringify({ contentReleaseId: releaseId, contentHash: reconciled.contentHash, baseSiteArtifactId, packageRevisionId: reconciled.packageRevisionId, kind: "content", target })}\n`);
  return manifest;
}

test("reconcile creates one immutable package revision and reuses the same tuple", async () => {
  const { root, contentHash } = await fixture();
  const first = await reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId, now: () => "2026-08-04T00:00:00.000Z" });
  const second = await reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId, now: () => "later" });
  assert.equal(first.contentReleaseId, releaseId);
  assert.equal(first.contentHash, contentHash);
  assert.equal(first.packageRevisionId, second.packageRevisionId);
  assert.equal(second.reused, true);
  assert.equal(first.baseSiteArtifactId, artifactId);
  assert.equal(first.deploymentId, null);
  assert.equal(first.state, "prepared");
  assert.equal(JSON.parse(await readFile(first.lineagePath, "utf8")).supersedesPackageId, releaseId);
});

test("reconcile hard fails lifecycle drift before preparing a revision", async () => {
  const { root } = await fixture();
  await writeFile(path.join(root, ".content-workspace", "drafts", `${target}.json`), "{}\n");
  await assert.rejects(reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId }), /hash drift/);
});

test("failed revision does not replace active content and released revision is deduplicated", async () => {
  const { root } = await fixture();
  const reconciled = await reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId });
  await assert.rejects(readActiveContentReleases(path.join(root, ".content-workspace", "releases")), /completion fact is missing/);
  await markRevisionReleased(reconciled, artifactId);
  const active = await readActiveContentReleases(path.join(root, ".content-workspace", "releases"));
  assert.equal(active.length, 1);
  assert.equal(active[0].packageRevisionId, reconciled.packageRevisionId);
});

test("a later revision supersedes the currently released physical slot", async () => {
  const { root } = await fixture();
  const first = await reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId });
  await markRevisionReleased(first, artifactId);
  const nextArtifactId = "v0.25.2-77b50f1a0aa9";
  const nextArtifactDirectory = path.join(root, ".content-workspace", "base-site-artifacts", nextArtifactId);
  await mkdir(nextArtifactDirectory, { recursive: true });
  await cp(path.join(projectRoot, ".content-workspace", "base-site-artifacts", nextArtifactId, "base-site-artifact.json"), path.join(nextArtifactDirectory, "base-site-artifact.json"));
  const second = await reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: nextArtifactId });
  assert.equal(second.supersedesPackageId, first.packageRevisionId);
  assert.equal(second.recoverySource, path.relative(root, first.packageDirectory));
  assert.notEqual(second.packageRevisionId, first.packageRevisionId);
});
