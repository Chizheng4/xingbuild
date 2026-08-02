import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPublishAuthorization,
  isPublishAuthorized,
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
