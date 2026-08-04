import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { finalizeContentRelease, verifyContentPackage } from "../scripts/content-release.mjs";
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

test("finalize writes an independent atomic completion fact and preserves lifecycle evidence", async () => {
  const root = await fsMkdtemp("xingbuild-finalize-");
  const contentFile = path.join(root, ".content-workspace", "content", "profile", "about.json");
  await mkdir(path.dirname(contentFile), { recursive: true });
  await writeFile(contentFile, JSON.stringify({ id: "about" }));
  const packageDirectory = path.join(root, ".content-workspace", "releases", "profile-about-hash");
  await mkdir(packageDirectory, { recursive: true });
  const result = await finalizeContentRelease({ packageDirectory, sourceRoot: root, contentReleaseId: "profile-about-hash", contentHash: "a".repeat(64), baseSiteArtifactId: "v0.24.26-base", kind: "profile", target: "about" });
  assert.equal(JSON.parse(await readFile(result.completionPath, "utf8")).target, "about");
  assert.equal(JSON.parse(await readFile(result.factPath, "utf8")).contentReleaseId, "profile-about-hash");
  assert.equal(await readFile(contentFile, "utf8"), JSON.stringify({ id: "about" }));
});

async function fsMkdtemp(prefix) {
  const { mkdtemp } = await import("node:fs/promises");
  return mkdtemp(path.join(os.tmpdir(), prefix));
}
