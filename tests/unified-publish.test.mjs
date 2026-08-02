import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assertPublishAuthorization,
  isPublishAuthorized,
  readPreparedDist,
  trackedDirtyPaths,
} from "../scripts/unified-publish.mjs";
import { evaluateVersionState, parseVersionState } from "../scripts/lib/version-state.mjs";

test("unified publish authorization is explicit and independent from version identity", () => {
  assert.equal(isPublishAuthorized({ argv: [], env: {} }), false);
  assert.equal(isPublishAuthorized({ argv: ["--authorize-publish"], env: {} }), true);
  assert.equal(isPublishAuthorized({ argv: [], env: { XINGBUILD_PUBLISH_AUTHORIZATION: "confirmed" } }), true);
  assert.throws(() => assertPublishAuthorization({ argv: [], env: {} }), /publish authorization is required/);
});

test("unified publish treats tracked build output as a hard failure", () => {
  assert.deepEqual(trackedDirtyPaths(" M src/generated/view.jsx\n?? dist/client/index.html\n"), [
    "src/generated/view.jsx",
    "dist/client/index.html",
  ]);
  assert.deepEqual(trackedDirtyPaths(""), []);
  assert.deepEqual(trackedDirtyPaths("\n"), []);
});

test("current stores only immutable local version identity facts", () => {
  const complete = "状态：Engineering 已完成本地 commit/tag；提交后事件由外部记录。\nlocalSubmission: complete";
  assert.equal(parseVersionState(complete).valid, true);
  assert.equal(evaluateVersionState({ currentText: complete, phase: "preflight", headTagged: true, clean: true }).ready, true);
  const mutable = `${complete}\nproductVisualAcceptance: pending\npublishAuthorization: pending\nonlineRelease: pending`;
  assert.equal(parseVersionState(mutable).valid, false);
  assert.equal(evaluateVersionState({ currentText: mutable, phase: "preflight", headTagged: true, clean: true }).ready, false);
  const contradictory = "状态：等待本地 commit/tag。\nlocalSubmission: complete";
  assert.equal(evaluateVersionState({ currentText: contradictory, phase: "preflight", headTagged: true, clean: true }).ready, false);
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
