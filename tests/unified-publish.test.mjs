import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAcceptedCurrent,
  assertPublishAuthorization,
  isPublishAuthorized,
  trackedDirtyPaths,
} from "../scripts/unified-publish.mjs";

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
