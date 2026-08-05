import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { finalizeContentRelease } from "../scripts/content-release.mjs";
import { contentPackageRevisionIdentity, validateContentReplacement } from "../scripts/lib/content-replacement.mjs";
import {
  assertContentLifecycleProjection,
  resolveContentLifecycleTimes,
} from "../scripts/lib/content-lifecycle-time.mjs";

const firstAt = "2026-08-04T13:46:03.884Z";
const revisionAt = "2026-08-05T15:00:00.000Z";

test("first publication and revision finalization use one lifecycle clock", () => {
  assert.deepEqual(
    resolveContentLifecycleTimes({}, { finalize: true, now: () => revisionAt }),
    { firstPublishedAt: revisionAt, revisionReleasedAt: revisionAt, publishedAt: revisionAt },
  );
});

test("legacy publishedAt is read as firstPublishedAt without inventing revision time", () => {
  assert.deepEqual(
    resolveContentLifecycleTimes({ publishedAt: firstAt }),
    { firstPublishedAt: firstAt, revisionReleasedAt: null, publishedAt: firstAt },
  );
});

test("replacement candidate with null times inherits the active logical first publication", () => {
  assert.deepEqual(
    resolveContentLifecycleTimes({ publishedAt: null, revisionReleasedAt: null }, { activeRecord: { publishedAt: firstAt } }),
    { firstPublishedAt: firstAt, revisionReleasedAt: null, publishedAt: firstAt },
  );
});

test("replacement rejects explicit first publication drift", () => {
  assert.throws(
    () => resolveContentLifecycleTimes({ firstPublishedAt: "2026-08-06T00:00:00.000Z" }, { activeRecord: { publishedAt: firstAt } }),
    /firstPublishedAt drift/,
  );
});

test("legacy projection remains readable while new projections must preserve both lifecycle facts", () => {
  assert.doesNotThrow(() => assertContentLifecycleProjection({ publishedAt: firstAt }, { publishedAt: firstAt }));
  assert.throws(
    () => assertContentLifecycleProjection({ publishedAt: firstAt }, { firstPublishedAt: firstAt, revisionReleasedAt: revisionAt, publishedAt: firstAt }),
    /fields are missing/,
  );
  assert.throws(
    () => assertContentLifecycleProjection(
      { firstPublishedAt: firstAt, revisionReleasedAt: revisionAt, publishedAt: firstAt },
      { firstPublishedAt: firstAt, revisionReleasedAt: "2026-08-05T14:00:00.000Z", publishedAt: firstAt },
    ),
    /revisionReleasedAt projection drift/,
  );
});

test("content finalize writes firstPublishedAt, revisionReleasedAt, and publishedAt atomically", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-lifecycle-finalize-"));
  try {
    const contentFile = path.join(root, ".content-workspace", "content", "profile", "about.json");
    const packageDirectory = path.join(root, ".content-workspace", "releases", "profile-about-v02514");
    await mkdir(path.dirname(contentFile), { recursive: true });
    await mkdir(packageDirectory, { recursive: true });
    await writeFile(contentFile, JSON.stringify({ id: "about" }));
    const result = await finalizeContentRelease({
      packageDirectory,
      sourceRoot: root,
      contentReleaseId: "profile-about-v02514",
      logicalContentId: "profile:about",
      contentHash: "a".repeat(64),
      baseSiteArtifactId: "v0.25.13-e63ff943d4d1",
      kind: "profile",
      target: "about",
      now: () => revisionAt,
    });
    const completion = JSON.parse(await readFile(result.completionPath, "utf8"));
    assert.equal(completion.firstPublishedAt, revisionAt);
    assert.equal(completion.revisionReleasedAt, revisionAt);
    assert.equal(completion.publishedAt, revisionAt);
    assert.deepEqual(result.lifecycleTimes, {
      firstPublishedAt: revisionAt,
      revisionReleasedAt: revisionAt,
      publishedAt: revisionAt,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("replacement cannot predeclare a revision release time", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-lifecycle-revision-"));
  const candidateDirectory = path.join(root, ".content-workspace", "releases", "new", "revisions");
  try {
    await mkdir(candidateDirectory, { recursive: true });
    const identity = contentPackageRevisionIdentity({
      contentReleaseId: "new",
      logicalContentId: "content:demo",
      contentHash: "b".repeat(64),
      sourceHash: "a".repeat(64),
      baseSiteArtifactId: "v0.25.14-test",
    });
    const candidate = {
      contentReleaseId: "new",
      logicalContentId: "content:demo",
      kind: "content",
      target: "demo",
      contentHash: "b".repeat(64),
      sourceHash: "a".repeat(64),
      baseSiteArtifactId: "v0.25.14-test",
      packageRevisionId: identity.packageRevisionId,
      revisionHash: identity.revisionHash,
      revisionTuple: identity.tuple,
      contractVersion: "content-package-revision-v1",
      supersedesPackageId: "old",
      state: "prepared",
      revisionReleasedAt: revisionAt,
    };
    await assert.rejects(
      validateContentReplacement({ candidate, candidatePackageDirectory: candidateDirectory, activeReceipt: { contentReleaseId: "old", logicalContentId: "content:demo", packageRevisionId: "old", kind: "content", target: "demo", contentHash: "a".repeat(64), reviewedAt: null, sources: [], sourceRefs: [] }, productArtifactId: "v0.25.14-test", sourceRoot: root }),
      /revisionReleasedAt must be null/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
