import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  ContentSlotCompareAndSwapError,
  ContentSlotRegistryMigrationError,
  compareAndSwapContentSlot,
  contentReceiptId,
  ensureContentSlotRegistry,
  resolveContentSlotCandidate,
  scanLegacyContentSlotRegistry,
} from "../scripts/lib/content-slot-registry.mjs";
import { assertContentSlotArtifactCompatible } from "../scripts/lib/base-site-artifact.mjs";
import { finalizeSitePublication } from "../scripts/lib/site-publication-coordinator.mjs";
import { writeJsonAtomically } from "../scripts/lib/content-release-state.mjs";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);

test("legacy historical corpus migrates to one active slot per logical content", async () => {
  const registry = await ensureContentSlotRegistry({ sourceRoot: projectRoot });
  assert.equal(registry.slots.length, 34);
  assert.equal(registry.slots.filter((slot) => slot.logicalContentId === "practice:robotaxi").length, 1);
  const practice = registry.slots.find((slot) => slot.logicalContentId === "practice:robotaxi");
  assert.equal(practice.activeReceiptId, "practice-robotaxi-d67fcedd760acc5a");
  assert.equal(practice.predecessorReceiptId, null);

  const candidate = JSON.parse(await readFile(path.join(
    projectRoot,
    ".content-workspace/releases/practice-robotaxi-604214b3bfddf09f/revisions/revision-9bb22df0f30845e8/content-release.json",
  ), "utf8"));
  const resolved = resolveContentSlotCandidate({ registry, candidate });
  assert.equal(resolved.predecessorReceiptId, practice.activeReceiptId);
  assert.equal(resolved.predecessorPackageSlotId, practice.activePackageSlotId);
  assert.equal(candidate.supersedesPackageId, "practice-robotaxi-604214b3bfddf09f");
  assert.notEqual(candidate.supersedesPackageId, resolved.predecessorPackageSlotId);
});

test("legacy migration reports conflicting active leaves instead of guessing", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-slot-conflict-"));
  try {
    const releases = path.join(root, ".content-workspace/releases");
    for (const [id, supersedes] of [["first", null], ["second", null]]) {
      const directory = path.join(releases, id);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, "content-release.json"), JSON.stringify({
        contentReleaseId: id,
        kind: "content",
        target: "same",
        contentHash: id.padEnd(64, "0").slice(0, 64),
        state: "released",
        ...(supersedes ? { supersedesPackageId: supersedes } : {}),
      }));
    }
    await assert.rejects(
      scanLegacyContentSlotRegistry({ sourceRoot: root, releasesRoot: releases }),
      (error) => error instanceof ContentSlotRegistryMigrationError
        && error.conflicts.some((item) => item.code === "ACTIVE_SLOT_NOT_UNIQUE"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("registry compare-and-swap keeps one active receipt and rejects stale or self transitions", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-slot-cas-"));
  try {
    const initial = {
      contentReleaseId: "release-one",
      logicalContentId: "practice:robotaxi",
      kind: "practice",
      target: "robotaxi",
      contentHash: "a".repeat(64),
      state: "prepared",
    };
    const first = await compareAndSwapContentSlot({ sourceRoot: root, logicalContentId: initial.logicalContentId, candidate: initial, expectedRegistryRevision: 1, transition: { activePackageDirectory: ".content-workspace/releases/release-one" } });
    assert.equal(first.registry.slots.length, 1);
    assert.equal(first.nextSlot.activeReceiptId, contentReceiptId(initial));

    const replacement = {
      contentReleaseId: "release-two",
      packageRevisionId: "revision-two",
      logicalContentId: initial.logicalContentId,
      kind: "practice",
      target: "robotaxi",
      contentHash: "b".repeat(64),
      predecessorReceiptId: first.nextSlot.activeReceiptId,
      state: "prepared",
    };
    const second = await compareAndSwapContentSlot({ sourceRoot: root, logicalContentId: initial.logicalContentId, expectedReceiptId: first.nextSlot.activeReceiptId, expectedRegistryRevision: first.registry.registryRevision, candidate: replacement, transition: { activePackageDirectory: ".content-workspace/releases/release-two/revisions/revision-two" } });
    assert.equal(second.nextSlot.activeReceiptId, contentReceiptId(replacement));
    assert.equal(second.nextSlot.predecessorReceiptId, first.nextSlot.activeReceiptId);
    assert.equal((await ensureContentSlotRegistry({ sourceRoot: root })).slots.filter((slot) => slot.logicalContentId === initial.logicalContentId).length, 1);

    await assert.rejects(
      compareAndSwapContentSlot({ sourceRoot: root, logicalContentId: initial.logicalContentId, expectedReceiptId: first.nextSlot.activeReceiptId, expectedRegistryRevision: second.registry.registryRevision, candidate: { ...replacement, contentReleaseId: "release-three", packageRevisionId: "revision-three" } }),
      (error) => error instanceof ContentSlotCompareAndSwapError,
    );
    assert.throws(
      () => resolveContentSlotCandidate({ registry: second.registry, candidate: { ...replacement, contentReleaseId: "release-three", packageRevisionId: "revision-three", predecessorReceiptId: contentReceiptId({ contentReleaseId: "release-three", packageRevisionId: "revision-three" }) } }),
      /cannot reference itself/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy artifacts remain readable only during legacy migration; authoritative artifacts require the contract", async () => {
  const artifact = JSON.parse(await readFile(path.join(projectRoot, ".content-workspace/base-site-artifacts/v0.25.12-2e76e026aaa1/base-site-artifact.json"), "utf8"));
  assert.equal(assertContentSlotArtifactCompatible(artifact, { registryMode: "legacy", requiredKinds: ["practice"] }).legacy, true);
  assert.throws(() => assertContentSlotArtifactCompatible(artifact, { registryMode: "authoritative", requiredKinds: ["practice"] }), /capability contract is unknown/);
  assert.throws(() => assertContentSlotArtifactCompatible({ ...artifact, capabilityContractVersion: "content-slot-registry-v1", capabilityContract: { registeredTargets: "ContentSlotRegistry", mediaContract: "approved-media-manifest-v1", routeContract: "content-target-path-v1", contentKinds: ["practice"], fieldContract: [] } }, { registryMode: "authoritative", requiredKinds: ["practice"] }), /field contract is incompatible/);
});

test("SitePublication finalize performs compare-and-swap once and reuses the transition on resume", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-publication-cas-"));
  const publicationDirectory = path.join(root, ".content-workspace/site-publications/v0.25.16-test");
  try {
    const predecessor = {
      contentReleaseId: "release-one",
      logicalContentId: "practice:robotaxi",
      kind: "practice",
      target: "robotaxi",
      contentHash: "a".repeat(64),
    };
    const candidate = {
      contentReleaseId: "release-two",
      packageRevisionId: "revision-two",
      logicalContentId: "practice:robotaxi",
      kind: "practice",
      target: "robotaxi",
      contentHash: "b".repeat(64),
      predecessorReceiptId: contentReceiptId(predecessor),
      targetPath: "/products",
    };
    const initial = await compareAndSwapContentSlot({ sourceRoot: root, logicalContentId: predecessor.logicalContentId, candidate: predecessor, expectedRegistryRevision: 1 });
    const manifest = {
      activeContentReleaseIds: [candidate.contentReleaseId],
      activeReceiptIds: [contentReceiptId(candidate)],
      contentReleaseReceipts: [candidate],
    };
    const publication = {
      sitePublicationId: "v0.25.16-test+publication",
      snapshotHash: "c".repeat(64),
      productVersion: "v0.25.16",
      productCommit: "d".repeat(40),
      productArtifactId: "v0.25.16-dddddddddddd",
      deploymentId: "deployment-one",
      state: "verified",
      contentReleaseIds: [candidate.contentReleaseId],
      candidateContentReleaseId: candidate.contentReleaseId,
      candidatePackageRevisionId: candidate.packageRevisionId,
      candidatePackageDirectory: ".content-workspace/releases/release-two/revisions/revision-two",
      contentSlotRegistryRevision: initial.registry.registryRevision,
      contentReplacement: { predecessorReceiptId: initial.nextSlot.activeReceiptId },
      contentManifest: manifest,
    };
    await mkdir(publicationDirectory, { recursive: true });
    await writeJsonAtomically(path.join(publicationDirectory, "site-publication.json"), publication);
    const publicVerify = {
      sitePublicationId: publication.sitePublicationId,
      snapshotHash: publication.snapshotHash,
      activeContentReleaseIds: publication.contentReleaseIds,
      contentManifest: manifest,
    };
    const finalized = await finalizeSitePublication({ publicationDirectory, publicVerify, sourceRoot: root });
    assert.equal(finalized.state, "released");
    assert.equal(finalized.contentSlotTransition.type, "compare-and-swap");
    assert.equal(finalized.contentSlotTransition.predecessorReceiptId, initial.nextSlot.activeReceiptId);
    const resumed = await finalizeSitePublication({ publicationDirectory, publicVerify, sourceRoot: root });
    assert.equal(resumed.contentSlotTransition.type, "compare-and-swap");
    assert.equal(resumed.contentSlotTransition.activeReceiptId, contentReceiptId(candidate));
    const registry = await ensureContentSlotRegistry({ sourceRoot: root });
    assert.equal(registry.slots.find((slot) => slot.logicalContentId === candidate.logicalContentId).activeReceiptId, contentReceiptId(candidate));
    assert.equal(registry.slots.filter((slot) => slot.logicalContentId === candidate.logicalContentId).length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
