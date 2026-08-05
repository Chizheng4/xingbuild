import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareContentRelease } from "../scripts/content-release.mjs";
import {
  applyContentChangeSetDocuments,
  createContentChangeSet,
  hashValue,
  readContentChangeSet,
  readFieldValue,
  writeContentChangeSet,
} from "../scripts/lib/content-targets.mjs";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const approvedMediaId = "robotaxi-evidence-fleet-operations-console-v1";
const moduleIds = [
  "robotaxi-operations-current-simulation",
  "robotaxi-operations-city-spatial-progress",
  "robotaxi-operating-model",
  "robotaxi-operating-metrics-overview",
];

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-multi-changeset-"));
  await mkdir(path.join(root, "content/registry"), { recursive: true });
  await cp(path.join(projectRoot, "content/registry/content-targets.json"), path.join(root, "content/registry/content-targets.json"));
  await mkdir(path.join(root, ".content-workspace/content/products"), { recursive: true });
  await mkdir(path.join(root, ".content-workspace/content/media/robotaxi"), { recursive: true });
  await mkdir(path.join(root, "public/media/robotaxi"), { recursive: true });
  await cp(path.join(projectRoot, ".content-workspace/content/products/robotaxi.json"), path.join(root, ".content-workspace/content/products/robotaxi.json"));
  await cp(path.join(projectRoot, ".content-workspace/content/media/robotaxi/manifest.json"), path.join(root, ".content-workspace/content/media/robotaxi/manifest.json"));
  await cp(path.join(projectRoot, ".content-workspace/content/media/robotaxi/robotaxi-evidence-fleet-operations-console-v1.mp4"), path.join(root, "public/media/robotaxi/robotaxi-evidence-fleet-operations-console-v1.mp4"));
  const practice = JSON.parse(await readFile(path.join(root, ".content-workspace/content/products/robotaxi.json"), "utf8"));
  return { root, practice };
}

function operations() {
  return moduleIds.map((moduleId) => ({
    targetId: `products.robotaxi.module.${moduleId}.mediaId`,
    afterValue: approvedMediaId,
    sourceRefs: ["Robotaxi:approved-media-manifest", `media:${approvedMediaId}`],
    boundary: "只绑定既有已审核 Robotaxi 媒体，不复制媒体或改变正文。",
    authority: "xing-approved-media",
    provenance: { approvalStatus: "approved", source: `Robotaxi/manifest.json#${approvedMediaId}` },
  }));
}

test("Robotaxi four media slots form one deterministic logical ChangeSet", async () => {
  const { root, practice } = await fixture();
  try {
    const changeSet = await createContentChangeSet({
      logicalContentId: "practice:robotaxi",
      operations: operations(),
      rootDirectory: root,
    });
    assert.equal(changeSet.scope, "field-set");
    assert.equal(changeSet.logicalContentId, "practice:robotaxi");
    assert.equal(changeSet.operations.length, 4);
    assert.deepEqual(changeSet.changedTargets, moduleIds.map((id) => `products.robotaxi.module.${id}.mediaId`));
    const written = await writeContentChangeSet(changeSet, { rootDirectory: root });
    const loaded = await readContentChangeSet(written.file, { rootDirectory: root });
    assert.equal(loaded.changeSetId, changeSet.changeSetId);
    assert.equal(loaded.operations.length, 4);
    const applied = applyContentChangeSetDocuments({ "content/products/robotaxi.json": practice }, loaded);
    assert.deepEqual(applied["content/products/robotaxi.json"].modules.map((module) => module.mediaId), [approvedMediaId, approvedMediaId, approvedMediaId, approvedMediaId]);
    assert.equal(practice.modules[1].mediaId, undefined);
    const artifact = JSON.parse(await readFile(path.join(projectRoot, "dist/client/base-site-artifact.json"), "utf8"));
    const prepared = await prepareContentRelease({ kind: "practice", target: "robotaxi", changeSetPath: written.file, baseSiteArtifact: artifact, sourceRoot: root });
    assert.equal(prepared.logicalContentId, "practice:robotaxi");
    assert.equal(prepared.changeSetId, changeSet.changeSetId);
    assert.equal(prepared.changedTargets.length, 4);
    assert.equal(prepared.operations.length, 4);
    await rm(prepared.packageDirectory, { recursive: true, force: true });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("multi-operation staging is atomic on the second/fourth precondition and rejects invalid identity", async () => {
  const { root, practice } = await fixture();
  try {
    const changeSet = await createContentChangeSet({ logicalContentId: "practice:robotaxi", operations: operations(), rootDirectory: root });
    const stale = structuredClone(practice);
    stale.modules[1].mediaId = "canonical-drift";
    const beforeSnapshot = JSON.stringify(stale);
    assert.throws(
      () => applyContentChangeSetDocuments({ "content/products/robotaxi.json": stale }, changeSet),
      /beforeHash conflict/,
    );
    assert.equal(JSON.stringify(stale), beforeSnapshot);
    await assert.rejects(
      createContentChangeSet({ logicalContentId: "practice:robotaxi", operations: [...operations(), operations()[0]], rootDirectory: root }),
      /duplicate target/,
    );
    await assert.rejects(
      createContentChangeSet({ logicalContentId: "practice:robotaxi", operations: [operations()[0], { ...operations()[1], logicalContentId: "content:other" }], rootDirectory: root }),
      /cross logical content identities/,
    );
    const staleOperation = operations();
    staleOperation[3].beforeHash = hashValue("not-the-current-value");
    await assert.rejects(
      createContentChangeSet({ logicalContentId: "practice:robotaxi", operations: staleOperation, rootDirectory: root }),
      /beforeHash conflict/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
