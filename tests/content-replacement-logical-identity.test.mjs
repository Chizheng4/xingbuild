import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { contentPackageRevisionIdentity, validateContentReplacement } from "../scripts/lib/content-replacement.mjs";

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("approved logical replacement permits a content hash update while retaining one active slot", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-logical-replacement-"));
  const target = "logical-replacement";
  const source = `${JSON.stringify({ slug: target, status: "published", title: "approved snapshot" }, null, 2)}\n`;
  const sourceHash = sha(source);
  const relative = `.content-workspace/content/observations/${target}.json`;
  const candidateRoot = path.join(root, ".content-workspace/releases/new-release/revisions");
  try {
    for (const directory of [
      path.join(root, ".content-workspace/content/observations"),
      path.join(root, ".content-workspace/drafts"),
      path.join(root, ".content-workspace/recoveries"),
      path.join(root, ".content-workspace/reviews"),
    ]) await mkdir(directory, { recursive: true });
    await writeFile(path.join(root, relative), source);
    await writeFile(path.join(root, `.content-workspace/drafts/${target}.json`), source);
    await writeFile(path.join(root, `.content-workspace/recoveries/${target}.json`), source);
    await writeFile(path.join(root, `.content-workspace/reviews/${target}.json`), JSON.stringify({ status: "approved", contentHash: sourceHash }));
    const identity = contentPackageRevisionIdentity({
      contentReleaseId: "new-release",
      logicalContentId: `content:${target}`,
      contentHash: "b".repeat(64),
      sourceHash,
      baseSiteArtifactId: "v0.25.13-test",
    });
    const candidateDirectory = path.join(candidateRoot, identity.packageRevisionId);
    await mkdir(path.join(candidateDirectory, "source", ".content-workspace/content/observations"), { recursive: true });
    await writeFile(path.join(candidateDirectory, "source", relative), source);
    const candidate = {
      contentReleaseId: "new-release",
      logicalContentId: `content:${target}`,
      kind: "content",
      target,
      contentHash: "b".repeat(64),
      sourceHash,
      baseSiteArtifactId: "v0.25.13-test",
      packageRevisionId: identity.packageRevisionId,
      revisionHash: identity.revisionHash,
      revisionTuple: identity.tuple,
      contractVersion: "content-package-revision-v1",
      supersedesPackageId: "old-revision",
      state: "prepared",
      changeSetId: "changeset-logical-replacement",
      changedTargets: ["content.logical-replacement.title"],
      operations: [{ targetId: "content.logical-replacement.title", beforeHash: "a".repeat(64), afterHash: "b".repeat(64) }],
      targetPath: `/observations/${target}`,
      reviewedAt: null,
      sources: [],
      sourceRefs: ["approved-source"],
    };
    await writeFile(path.join(candidateDirectory, "package-lineage.json"), JSON.stringify({
      type: "ContentPackageLineage",
      contentReleaseId: candidate.contentReleaseId,
      logicalContentId: candidate.logicalContentId,
      packageRevisionId: candidate.packageRevisionId,
      supersedesPackageId: candidate.supersedesPackageId,
      revisionTuple: identity.tuple,
    }));
    const activeReceipt = {
      contentReleaseId: "old-release",
      logicalContentId: `content:${target}`,
      packageRevisionId: "old-revision",
      kind: "content",
      target,
      contentHash: "a".repeat(64),
      targetPath: `/observations/${target}`,
      sources: [],
      sourceRefs: [],
      reviewedAt: null,
      publishedAt: null,
      receiptHash: "receipt-old",
    };
    const result = await validateContentReplacement({ candidate, candidatePackageDirectory: candidateDirectory, activeReceipt, productArtifactId: "v0.25.13-test", sourceRoot: root });
    assert.equal(result.previousPackageRevisionId, "old-revision");
    await assert.rejects(
      validateContentReplacement({ candidate: { ...candidate, changeSetId: null, operations: [] }, candidatePackageDirectory: candidateDirectory, activeReceipt, productArtifactId: "v0.25.13-test", sourceRoot: root }),
      /approved ChangeSet lineage/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
