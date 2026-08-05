import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { reconcileContentPackage } from "../scripts/lib/content-package-reconcile.mjs";
import { finalizeContentRelease } from "../scripts/content-release.mjs";
import { CONTENT_LIFECYCLE_KINDS, getContentLifecycleAdapter } from "../scripts/lib/content-lifecycle-adapter.mjs";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const releaseId = "practice-robotaxi-604214b3bfddf09f";
const artifactId = "v0.25.14-b0bb49dcebb0";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-lifecycle-adapter-"));
  for (const [source, target] of [
    [".content-workspace/content", ".content-workspace/content"],
    [".content-workspace/reviews/robotaxi.json", ".content-workspace/reviews/robotaxi.json"],
    [".content-workspace/changes/changeset-practice-robotaxi-four-media-binding-v1.json", ".content-workspace/changes/changeset-practice-robotaxi-four-media-binding-v1.json"],
    [`.content-workspace/releases/${releaseId}`, `.content-workspace/releases/${releaseId}`],
    [`.content-workspace/base-site-artifacts/${artifactId}`, `.content-workspace/base-site-artifacts/${artifactId}`],
  ]) await cp(path.join(projectRoot, source), path.join(root, target), { recursive: true });
  return root;
}

test("ContentLifecycleAdapter registry routes every registered kind", () => {
  assert.deepEqual([...CONTENT_LIFECYCLE_KINDS].sort(), ["article", "businessObservation", "content", "practice", "profile"]);
  for (const kind of CONTENT_LIFECYCLE_KINDS) assert.equal(getContentLifecycleAdapter(kind).kind, kind);
  assert.throws(() => getContentLifecycleAdapter("unknown"), /not registered/);
});
test("Practice reconcile proves canonical before to package after without generic lifecycle files", async () => {
  const root = await fixture();
  try {
    const result = await reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId });
    assert.equal(result.beforeHash, "4c54ea2ef449c0868d1aee65d6207c4ee882d33a7764774a4ec26476bc955fe9");
    assert.equal(result.afterHash, result.contentHash);
    assert.equal(result.proofEnvelope.changeSetId, "changeset-practice-robotaxi-four-media-binding-v1");
    assert.equal(result.proofEnvelope.reviewEnvelope.logicalContentId, "practice:robotaxi");
    assert.equal(result.proofEnvelope.recoveryEnvelope.type, "operations-reverse");
    assert.equal(result.supersedesPackageId, releaseId);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Practice before and after drift hard fail before a revision is written", async () => {
  const root = await fixture();
  try {
    const canonicalPath = path.join(root, ".content-workspace/content/products/robotaxi.json");
    const canonical = JSON.parse(await readFile(canonicalPath, "utf8"));
    canonical.modules[1].mediaId = "stale-canonical-value";
    await writeFile(canonicalPath, `${JSON.stringify(canonical)}\n`);
    await assert.rejects(
      reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId }),
      /before hash drift/,
    );
    const cleanRoot = await fixture();
    try {
      const packagePath = path.join(cleanRoot, `.content-workspace/releases/${releaseId}/source/.content-workspace/content/products/robotaxi.json`);
      const packageProduct = JSON.parse(await readFile(packagePath, "utf8"));
      packageProduct.modules[1].mediaId = "after-drift";
      await writeFile(packagePath, `${JSON.stringify(packageProduct)}\n`);
      await assert.rejects(
        reconcileContentPackage({ sourceRoot: cleanRoot, contentReleaseId: releaseId, baseSiteArtifactId: artifactId }),
        /after snapshot drift/,
      );
    } finally {
      await rm(cleanRoot, { recursive: true, force: true });
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Practice finalize advances canonical only after public verification and is idempotent", async () => {
  const root = await fixture();
  try {
    const result = await reconcileContentPackage({ sourceRoot: root, contentReleaseId: releaseId, baseSiteArtifactId: artifactId });
    const finalized = await finalizeContentRelease({ ...result, sourceRoot: root, publicVerify: { ok: true }, sitePublicationId: "site-publication-test", deploymentId: "deployment-test", baseProductVersion: "v0.25.14", baseProductCommit: "b0bb49dcebb0b5b888ac844115f59695be0cf4cb" });
    assert.equal(finalized.lifecycle.finalized, true);
    const second = await finalizeContentRelease({ ...result, sourceRoot: root, proofEnvelope: result.proofEnvelope, publicVerify: { ok: true }, sitePublicationId: "site-publication-test", deploymentId: "deployment-test", baseProductVersion: "v0.25.14", baseProductCommit: "b0bb49dcebb0b5b888ac844115f59695be0cf4cb" });
    assert.equal(second.lifecycle.alreadyFinalized, true);
    const canonical = JSON.parse(await readFile(path.join(root, ".content-workspace/content/products/robotaxi.json"), "utf8"));
    assert.equal(canonical.modules.filter((module) => module.mediaId).length, 4);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
