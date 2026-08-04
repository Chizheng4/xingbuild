import assert from "node:assert/strict";
import test from "node:test";
import { assertContentBatchCoverage, planContentBatch } from "../scripts/lib/content-batch.mjs";

function intents(count) {
  return Array.from({ length: count }, (_, index) => ({ contentReleaseId: `content-${String(index + 1).padStart(2, "0")}`, contentHash: `${index}`.repeat(64), target: `target-${index + 1}`, kind: "content", review: { approved: true }, changeSetId: `change-${index + 1}`, fileCount: 1, totalBytes: 10, maxFileBytes: 10 }));
}

test("planner deterministically covers thirty intents in bounded shards", () => {
  const source = intents(30);
  const plan = planContentBatch(source, { maxFiles: 10, maxTotalBytes: 100 });
  assert.equal(plan.shards.length, 3);
  assert.deepEqual(plan.shards.map((shard) => shard.fileCount), [10, 10, 10]);
  assertContentBatchCoverage(plan, source);
  assert.deepEqual(plan.planId, planContentBatch(source, { maxFiles: 10, maxTotalBytes: 100 }).planId);
});

test("planner isolates target and media path conflicts", () => {
  const source = intents(2);
  source[1].target = source[0].target;
  source[1].mediaPaths = ["/media/shared.mp4"];
  source[0].mediaPaths = ["/media/shared.mp4"];
  const plan = planContentBatch(source);
  assert.equal(plan.shards.length, 2);
  assertContentBatchCoverage(plan, source);
});

test("planner hard fails an oversized single file before transport", () => {
  assert.throws(() => planContentBatch([{ ...intents(1)[0], maxFileBytes: 101 }], { maxFileBytes: 100 }), /max single file size/);
});
