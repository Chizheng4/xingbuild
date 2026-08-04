import { createHash } from "node:crypto";

const text = (value, name) => {
  if (typeof value !== "string" || !value) throw new Error(`content batch requires ${name}`);
  return value;
};

function intentDescriptor(intent) {
  const id = text(intent.contentReleaseId || intent.id, "contentReleaseId");
  const contentHash = text(intent.contentHash, "contentHash");
  const target = text(intent.target || intent.slug, "target");
  const type = text(intent.kind || intent.type, "content type");
  if (!intent.review && !intent.reviewedAt) throw new Error(`content intent ${id} is not reviewed`);
  if (!intent.changeSet && !intent.changeSetId && !intent.changeSetHash && !intent.packageRevisionId) throw new Error(`content intent ${id} is missing ChangeSet or package revision identity`);
  const mediaPaths = [...new Set((intent.mediaPaths || intent.media || []).map((item) => typeof item === "string" ? item : item?.path).filter(Boolean))].sort();
  const files = Number(intent.fileCount ?? intent.files?.length ?? 1);
  const bytes = Number(intent.totalBytes ?? intent.bytes ?? 0);
  const largestFileBytes = Number(intent.maxFileBytes ?? intent.singleFileBytes ?? bytes);
  if (!Number.isInteger(files) || files < 1 || !Number.isFinite(bytes) || bytes < 0 || !Number.isFinite(largestFileBytes) || largestFileBytes < 0) throw new Error(`content intent ${id} has invalid file metrics`);
  return { intent, contentReleaseId: id, contentHash, target, type, mediaPaths, files, bytes, largestFileBytes };
}

export function contentBatchPlanId(shards = []) {
  return createHash("sha256").update(JSON.stringify(shards.map((shard) => shard.map((item) => item.contentReleaseId)))).digest("hex");
}

export function planContentBatch(intents = [], constraints = {}) {
  if (!Array.isArray(intents) || !intents.length) throw new Error("content batch requires intents");
  const limits = { maxFiles: 10000, maxFileBytes: 50 * 1024 * 1024, maxTotalBytes: 500 * 1024 * 1024, ...constraints };
  const items = intents.map(intentDescriptor).sort((a, b) => a.contentReleaseId.localeCompare(b.contentReleaseId));
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.contentReleaseId)) throw new Error(`duplicate contentReleaseId: ${item.contentReleaseId}`);
    seen.add(item.contentReleaseId);
    if (item.largestFileBytes > limits.maxFileBytes) throw new Error(`content intent ${item.contentReleaseId} exceeds max single file size`);
  }
  const shards = [];
  for (const item of items) {
    let shard = shards.at(-1);
    const targetConflict = shard?.some((entry) => entry.target === item.target);
    const mediaConflict = shard?.some((entry) => item.mediaPaths.some((media) => entry.mediaPaths.includes(media)));
    const files = (shard || []).reduce((sum, entry) => sum + entry.files, 0) + item.files;
    const bytes = (shard || []).reduce((sum, entry) => sum + entry.bytes, 0) + item.bytes;
    if (!shard || targetConflict || mediaConflict || files > limits.maxFiles || bytes > limits.maxTotalBytes) {
      shard = [];
      shards.push(shard);
    }
    shard.push(item);
  }
  return {
    planType: "ContentBatchPlan",
    planId: contentBatchPlanId(shards),
    constraints: limits,
    shards: shards.map((entries, index) => ({
      shardId: `${contentBatchPlanId([entries]).slice(0, 16)}-${index + 1}`,
      index,
      contentReleaseIds: entries.map((entry) => entry.contentReleaseId),
      intents: entries.map((entry) => entry.intent),
      fileCount: entries.reduce((sum, entry) => sum + entry.files, 0),
      totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
      mediaPaths: [...new Set(entries.flatMap((entry) => entry.mediaPaths))].sort(),
    })),
  };
}

export function assertContentBatchCoverage(plan, intents) {
  const expected = intents.map((intent) => intent.contentReleaseId || intent.id).sort();
  const actual = plan.shards.flatMap((shard) => shard.contentReleaseIds).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error("content batch coverage mismatch");
  return true;
}
