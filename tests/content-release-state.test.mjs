import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertContentPackageIdentity, finalizeContentRelease, verifyContentPackage, verifyContentPackageOnce } from "../scripts/content-release.mjs";
import {
  CONTENT_RELEASE_STATES,
  acquireContentReleasePackageLease,
  assertContentReleaseTransition,
  canResumeState,
  contentReleaseIdempotencyKey,
  releaseContentReleasePackageLease,
} from "../scripts/lib/content-release-state.mjs";

test("content release state machine permits only ordered immutable transitions", () => {
  assert.deepEqual(CONTENT_RELEASE_STATES.slice(0, 6), ["prepared", "built", "transported", "verifying", "finalized", "released"]);
  assert.doesNotThrow(() => assertContentReleaseTransition("prepared", "built"));
  assert.throws(() => assertContentReleaseTransition("built", "prepared"), /invalid content release transition/);
  assert.doesNotThrow(() => assertContentReleaseTransition("recoverable", "transported"));
  assert.equal(canResumeState("released", "built"), true);
  assert.equal(canResumeState("prepared", "built"), false);
});

test("content release lease and idempotency key are stable for resume", async () => {
  const packageDirectory = await fsMkdtemp("xingbuild-state-");
  const key = contentReleaseIdempotencyKey({ contentReleaseId: "article-demo-1234567890abcdef", contentHash: "a".repeat(64), baseSiteArtifactId: "v0.24.26-70847cdf6df0" });
  const first = await acquireContentReleasePackageLease({ packageDirectory, idempotencyKey: key });
  const second = await acquireContentReleasePackageLease({ packageDirectory, idempotencyKey: key });
  assert.equal(first.lease.idempotencyKey, second.lease.idempotencyKey);
  await releaseContentReleasePackageLease(second);
});

test("legacy resume hard fails an embedded base artifact mismatch and revision drift", () => {
  const base = { contentReleaseId: "content-a", contentHash: "a".repeat(64), baseSiteArtifactId: "current", baseSiteArtifact: { baseSiteArtifactId: "stale" } };
  assert.throws(() => assertContentPackageIdentity(base, base), /reconcile is required/);
  const revision = { ...base, baseSiteArtifact: { baseSiteArtifactId: "current" }, packageRevisionId: "revision-a" };
  assert.throws(() => assertContentPackageIdentity({ ...revision, packageRevisionId: "revision-b" }, revision), /revision identity mismatch/);
});

test("public verification retries bounded propagation without changing identity", async () => {
  let calls = 0;
  const manifest = { contentReleaseId: "article-demo-1234567890abcdef", target: "demo", contentHash: "a".repeat(64), targetPath: "/business-observations" };
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    calls += 1;
    if (calls < 5) return new Response("propagating", { status: 503 });
    if (pathname === "/content-manifest.json") return new Response(JSON.stringify(manifest), { status: 200 });
    if (pathname === "/release.json") return new Response(JSON.stringify({ version: "v0.24.26", commit: "product" }), { status: 200 });
    return new Response("<title>xingbuild</title>", { status: 200 });
  };
  const result = await verifyContentPackage({ manifest, baseUrl: "https://example.test/", fetchImpl, maxAttempts: 3, delayMs: 0 });
  assert.equal(result.contentReleaseId, manifest.contentReleaseId);
  assert.ok(calls >= 5);
});

test("combined public verification retains active releases and candidate", async () => {
  const manifest = { contentReleaseId: "candidate", contentHash: "a".repeat(64), target: "candidate", targetPath: "/observations/candidate", activeContentReleaseIds: ["active-a", "active-b", "candidate"] };
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/content-manifest.json") return new Response(JSON.stringify({ activeContentReleaseIds: ["active-a", "active-b", "candidate"], publishedSlugs: ["candidate"], baseSiteArtifactId: "base" }), { status: 200 });
    if (pathname === "/release.json") return new Response(JSON.stringify({ version: "v0.24.32", commit: "commit" }), { status: 200 });
    return new Response("<title>xingbuild</title>", { status: 200 });
  };
  const result = await verifyContentPackageOnce({ manifest, fetchImpl });
  assert.deepEqual(result.activeContentReleaseIds, manifest.activeContentReleaseIds);
});

test("finalize writes an independent atomic completion fact and preserves lifecycle evidence", async () => {
  const root = await fsMkdtemp("xingbuild-finalize-");
  const contentFile = path.join(root, ".content-workspace", "content", "profile", "about.json");
  await mkdir(path.dirname(contentFile), { recursive: true });
  await writeFile(contentFile, JSON.stringify({ id: "about" }));
  const packageDirectory = path.join(root, ".content-workspace", "releases", "profile-about-hash");
  await mkdir(packageDirectory, { recursive: true });
  const result = await finalizeContentRelease({ packageDirectory, sourceRoot: root, contentReleaseId: "profile-about-hash", contentHash: "a".repeat(64), baseSiteArtifactId: "v0.24.26-base", kind: "profile", target: "about" });
  const completion = JSON.parse(await readFile(result.completionPath, "utf8"));
  assert.equal(completion.target, "about");
  assert.deepEqual(completion.profileIds, ["about"]);
  assert.deepEqual(completion.publishedSlugs, []);
  assert.equal(JSON.parse(await readFile(result.factPath, "utf8")).contentReleaseId, "profile-about-hash");
  assert.equal(await readFile(contentFile, "utf8"), JSON.stringify({ id: "about" }));
});

async function fsMkdtemp(prefix) {
  const { mkdtemp } = await import("node:fs/promises");
  return mkdtemp(path.join(os.tmpdir(), prefix));
}
