import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assertPublishAuthorization,
  assertFixedPublishTarget,
  edgeoneProject,
  edgeoneProjectId,
  edgeoneDomain,
  isPublishAuthorized,
  readDeploymentResult,
  readFixedEdgeoneTarget,
  readPreparedDist,
  trackedDirtyPaths,
} from "../scripts/unified-publish.mjs";
import { assertNoVersionStateFields } from "../scripts/lib/release-readiness.mjs";

test("unified publish authorization is explicit and independent from version identity", () => {
  assert.equal(isPublishAuthorized({ argv: [], env: {} }), false);
  assert.equal(isPublishAuthorized({ argv: ["--authorize-publish"], env: {} }), true);
  assert.equal(isPublishAuthorized({ argv: [], env: { XINGBUILD_PUBLISH_AUTHORIZATION: "confirmed" } }), true);
  assert.throws(() => assertPublishAuthorization({ argv: [], env: {} }), /publish authorization is required/);
});

test("transport target is fixed and rejects undeclared overrides", async () => {
  assert.equal(edgeoneProject, "xingbuild-nochina");
  assert.equal(edgeoneProjectId, "makers-ze0f6txvlhco");
  assert.equal(edgeoneDomain, "xingbuild.top");
  assert.doesNotThrow(() => assertFixedPublishTarget({}));
  assert.throws(
    () => assertFixedPublishTarget({ XINGBUILD_EDGEONE_PROJECT: "other" }),
    /XINGBUILD_EDGEONE_PROJECT is not supported/,
  );
  const target = await readFixedEdgeoneTarget(process.cwd());
  assert.deepEqual(target, { name: edgeoneProject, projectId: edgeoneProjectId, domain: edgeoneDomain });
  assert.throws(
    () => readDeploymentResult(JSON.stringify({ status: "success", projectId: "other" })),
    /deployment identity mismatch/,
  );
});

test("unified publish treats tracked build output as a hard failure", () => {
  assert.deepEqual(trackedDirtyPaths(" M src/generated/view.jsx\n?? dist/client/index.html\n"), [
    "src/generated/view.jsx",
    "dist/client/index.html",
  ]);
  assert.deepEqual(trackedDirtyPaths(""), []);
  assert.deepEqual(trackedDirtyPaths("\n"), []);
});

test("current stores no lifecycle state fields", () => {
  assert.doesNotThrow(() => assertNoVersionStateFields("## 当前唯一版本：`v0.24.18`\n\n## 本版本目标\n"));
  for (const field of ["localSubmission", "productVisualAcceptance", "publishAuthorization", "onlineRelease"]) {
    assert.throws(() => assertNoVersionStateFields(`${field}: pending`), /must not store lifecycle state fields/);
  }
});

test("transport accepts only a prepared dist matching the exact version and HEAD", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "xingbuild-prepared-dist-"));
  try {
    await mkdir(path.join(directory, "dist", "client"), { recursive: true });
    const release = { version: "v0.24.12", commit: "head" };
    const manifest = { version: "v0.24.12", commit: "head", publishedSlugs: ["target"] };
    await writeFile(path.join(directory, "dist", "client", "release.json"), `${JSON.stringify(release)}\n`);
    await writeFile(path.join(directory, "dist", "client", "content-manifest.json"), `${JSON.stringify(manifest)}\n`);
    const prepared = await readPreparedDist({ sourceCwd: directory, version: "v0.24.12", head: "head", kind: "content", target: "target" });
    assert.equal(prepared.release.commit, "head");
    await writeFile(path.join(directory, "dist", "client", "release.json"), `${JSON.stringify({ ...release, commit: "other" })}\n`);
    await assert.rejects(readPreparedDist({ sourceCwd: directory, version: "v0.24.12", head: "head", kind: "product" }), /release\.json does not match/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
