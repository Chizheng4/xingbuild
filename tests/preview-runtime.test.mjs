import test from "node:test";
import assert from "node:assert/strict";
import { isPreviewRecordFor, previewPort } from "../scripts/preview-runtime.mjs";

const identity = {
  cwd: "/tmp/xingbuild",
  commit: "abc123",
  version: "v0.22.0",
};

test("preview identity requires the same worktree, commit, version and port", () => {
  assert.equal(isPreviewRecordFor({ ...identity, port: previewPort }, identity), true);
  assert.equal(isPreviewRecordFor({ ...identity, port: previewPort + 1 }, identity), false);
  assert.equal(isPreviewRecordFor({ ...identity, cwd: "/tmp/other", port: previewPort }, identity), false);
  assert.equal(isPreviewRecordFor({ ...identity, commit: "def456", port: previewPort }, identity), false);
  assert.equal(isPreviewRecordFor({ ...identity, version: "v0.21.0", port: previewPort }, identity), false);
});

test("missing or incomplete preview metadata never counts as a match", () => {
  assert.equal(isPreviewRecordFor(null, identity), false);
  assert.equal(isPreviewRecordFor({ port: previewPort }, identity), false);
});
