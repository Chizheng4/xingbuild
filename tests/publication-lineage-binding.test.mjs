import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  writeContentSlotRegistry,
} from "../scripts/lib/content-slot-registry.mjs";
import {
  assertPublicationLineageBindingAgainstRegistry,
  createOrReusePublicationLineageBinding,
  publicationLineageBindingPath,
  publicationLineageBindingProjection,
  readPublicationLineageBinding,
} from "../scripts/lib/publication-lineage-binding.mjs";
import { finalizeSitePublication } from "../scripts/lib/site-publication-coordinator.mjs";
import { writeJsonAtomically } from "../scripts/lib/content-release-state.mjs";

const logicalContentId = "practice:robotaxi";
const activeReceiptId = "practice-robotaxi-d67fcedd760acc5a";
const candidateReleaseId = "practice-robotaxi-604214b3bfddf09f";
const candidateRevisionId = "revision-9bb22df0f30845e8";

function registry(revision = 2, active = activeReceiptId) {
  return {
    schemaVersion: "content-slot-registry-v1",
    mode: "legacy",
    registryRevision: revision,
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
    migration: { sourceCount: 0, sourceHash: "" },
    slots: [{
      logicalContentId,
      kind: "practice",
      target: "robotaxi",
      activeReceiptId: active,
      activeContentReleaseId: active,
      activePackageRevisionId: null,
      activePackageSlotId: active,
      activeContentHash: "a".repeat(64),
      predecessorReceiptId: null,
      firstPublishedAt: "2026-08-04T13:46:03.884Z",
      activePackageDirectory: ".content-workspace/releases/practice-robotaxi-d67fcedd760acc5a",
      activeBaseSiteArtifactId: "v0.25.2-77b50f1a0aa9",
    }],
  };
}

function candidate(overrides = {}) {
  return {
    contentReleaseId: candidateReleaseId,
    packageRevisionId: candidateRevisionId,
    logicalContentId,
    kind: "practice",
    target: "robotaxi",
    contentHash: "b".repeat(64),
    supersedesPackageId: candidateReleaseId,
    state: "recoverable",
    ...overrides,
  };
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-lineage-binding-"));
  await writeContentSlotRegistry({ sourceRoot: root, registry: registry() });
  return root;
}

test("legacy self-reference binds to the Registry predecessor without changing the revision", async () => {
  const root = await fixture();
  const publicationId = "v0.25.17-test-publication";
  const packageDirectory = path.join(root, ".content-workspace/releases", candidateReleaseId, "revisions", candidateRevisionId);
  await mkdir(packageDirectory, { recursive: true });
  const original = candidate();
  const manifestPath = path.join(packageDirectory, "content-release.json");
  await writeJsonAtomically(manifestPath, original);
  const before = await readFile(manifestPath, "utf8");
  try {
    const first = await createOrReusePublicationLineageBinding({ sourceRoot: root, sitePublicationId: publicationId, candidate: original, expectedRegistryRevision: 2, now: () => "2026-08-05T00:00:01.000Z" });
    assert.equal(first.predecessorReceiptId, activeReceiptId);
    assert.equal(first.predecessorPackageId, activeReceiptId);
    assert.equal(first.registryRevision, 2);
    assert.equal(first.reused, false);
    assert.equal(JSON.parse(await readFile(manifestPath, "utf8")).supersedesPackageId, candidateReleaseId);
    assert.equal(await readFile(manifestPath, "utf8"), before);

    const second = await createOrReusePublicationLineageBinding({ sourceRoot: root, sitePublicationId: publicationId, candidate: original, expectedRegistryRevision: 2, now: () => "later" });
    assert.equal(second.reused, true);
    assert.equal(second.lineageBindingId, first.lineageBindingId);
    assert.equal(second.bindingHash, first.bindingHash);
    assert.equal(second.createdAt, first.createdAt);
    const persisted = await readPublicationLineageBinding({ sourceRoot: root, lineageBindingId: first.lineageBindingId, expected: { sitePublicationId: publicationId, predecessorReceiptId: activeReceiptId } });
    assert.deepEqual(publicationLineageBindingProjection(persisted), publicationLineageBindingProjection(first));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("binding drift and Registry CAS changes are hard failures", async () => {
  const root = await fixture();
  try {
    const binding = await createOrReusePublicationLineageBinding({ sourceRoot: root, sitePublicationId: "publication-drift", candidate: candidate() });
    const bindingPath = publicationLineageBindingPath(root, binding.lineageBindingId);
    await writeJsonAtomically(bindingPath, { ...binding, bindingHash: "0".repeat(64) });
    await assert.rejects(readPublicationLineageBinding({ sourceRoot: root, lineageBindingId: binding.lineageBindingId }), /hash or id drift/);

    await writeJsonAtomically(bindingPath, binding);
    await writeContentSlotRegistry({ sourceRoot: root, registry: registry(3) });
    await assert.rejects(
      assertPublicationLineageBindingAgainstRegistry({ sourceRoot: root, binding, candidate: candidate() }),
      /registry changed before finalize/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("old publication finalize materializes binding and CASes the Registry predecessor", async () => {
  const root = await fixture();
  const publicationDirectory = path.join(root, ".content-workspace/site-publications/v0.25.17-test");
  const publication = {
    sitePublicationId: "v0.25.17-test-publication",
    snapshotHash: "c".repeat(64),
    productVersion: "v0.25.17",
    productCommit: "d".repeat(40),
    productArtifactId: "v0.25.17-dddddddddddd",
    deploymentId: "deployment-one",
    state: "verified",
    contentReleaseIds: [candidateReleaseId],
    candidateContentReleaseId: candidateReleaseId,
    candidatePackageRevisionId: candidateRevisionId,
    contentSlotRegistryRevision: 2,
    contentReplacement: { predecessorReceiptId: candidateReleaseId, supersedesPackageId: candidateReleaseId },
    contentManifest: { contentReleaseReceipts: [] },
  };
  const candidateReceipt = { ...candidate(), targetPath: "/products", predecessorReceiptId: activeReceiptId, supersedesPackageId: activeReceiptId };
  const publicVerify = {
    sitePublicationId: publication.sitePublicationId,
    snapshotHash: publication.snapshotHash,
    activeContentReleaseIds: [candidateReleaseId],
    contentManifest: { contentReleaseReceipts: [candidateReceipt] },
  };
  await mkdir(publicationDirectory, { recursive: true });
  await writeJsonAtomically(path.join(publicationDirectory, "site-publication.json"), publication);
  try {
    const finalized = await finalizeSitePublication({ publicationDirectory, publicVerify, sourceRoot: root });
    assert.equal(finalized.state, "released");
    assert.equal(finalized.lineageBinding.predecessorReceiptId, activeReceiptId);
    assert.equal(finalized.contentSlotTransition.lineageBindingId, finalized.lineageBindingId);
    assert.equal(finalized.contentSlotTransition.type, "compare-and-swap");
    const resumed = await finalizeSitePublication({ publicationDirectory, publicVerify, sourceRoot: root });
    assert.equal(resumed.lineageBindingId, finalized.lineageBindingId);
    assert.equal(resumed.contentSlotTransition.activeReceiptId, `${candidateReleaseId}@${candidateRevisionId}`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
