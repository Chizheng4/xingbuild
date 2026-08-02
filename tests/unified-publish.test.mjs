import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAcceptedCurrent,
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
});

test("only an explicit product/visual acceptance status permits publishing", () => {
  assert.doesNotThrow(() => assertAcceptedCurrent("状态：产品/视觉验收通过；等待用户 publish。"));
  assert.doesNotThrow(() => assertAcceptedCurrent("状态：产品/视觉已验收；线上未发布。"));
  assert.throws(() => assertAcceptedCurrent("状态：产品/视觉已确认方案；等待 Engineering。"), /completed product\/visual acceptance/);
});

test("current machine fields reject contradictory local and online facts", () => {
  const pending = `状态：等待 Engineering 完成本地 commit/tag。\nlocalSubmission: pending\nproductVisualAcceptance: pending\npublishAuthorization: pending\nonlineRelease: pending`;
  assert.equal(parseVersionState(pending).valid, true);
  assert.equal(evaluateVersionState({ currentText: pending, phase: "preflight", headTagged: true, clean: true, expectedVersion: "v0.24.9" }).ready, false);
  const complete = `状态：Engineering 已完成本地 commit/tag；产品/视觉验收待确认。\nlocalSubmission: complete\nproductVisualAcceptance: pending\npublishAuthorization: pending\nonlineRelease: pending`;
  assert.equal(evaluateVersionState({ currentText: complete, phase: "preflight", headTagged: true, clean: true, expectedVersion: "v0.24.9", onlineVersion: "v0.24.1", onlineCommit: "old" }).ready, true);
  assert.equal(evaluateVersionState({ currentText: complete.replace("onlineRelease: pending", "onlineRelease: complete"), phase: "preflight", headTagged: true, clean: true, expectedVersion: "v0.24.9", expectedCommit: "head", onlineVersion: "v0.24.1", onlineCommit: "old" }).ready, false);
});
