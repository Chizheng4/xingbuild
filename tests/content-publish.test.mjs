import assert from "node:assert/strict";
import { access, readFile, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  buildContentRelease,
  prepareContentRelease,
  verifyContentPackageOnce,
} from "../scripts/content-release.mjs";
import { hashArtifactValue, validateBaseSiteArtifact } from "../scripts/lib/base-site-artifact.mjs";
import { publish } from "../scripts/unified-publish.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const target = "enterprise-operating-system";

async function pathExists(file) {
  try { await access(file); return true; } catch { return false; }
}

test("content preparation creates an independent identity without product release files", async () => {
  const prepared = await prepareContentRelease({ kind: "article", target, sourceRoot: root });
  try {
    assert.match(prepared.contentReleaseId, /^article-enterprise-operating-system-[a-f0-9]{16}$/);
    assert.equal(prepared.baseProductVersion.startsWith("v"), true);
    assert.match(prepared.baseProductCommit, /^[a-f0-9]{40}$/);
    const manifest = JSON.parse(await readFile(prepared.manifestPath, "utf8"));
    for (const field of ["contentReleaseId", "target", "contentHash", "sources", "reviewedAt", "publishedAt", "deploymentId", "publicVerify", "baseProductVersion", "baseProductCommit"]) {
      assert.ok(field in manifest, `${field} must be recorded`);
    }
    assert.equal(await pathExists(path.join(prepared.packageDirectory, "package.json")), false);
    assert.equal(await pathExists(path.join(prepared.packageDirectory, "VERSION.md")), false);
    assert.equal(prepared.baseSiteArtifactId, prepared.baseSiteArtifact.baseSiteArtifactId);
    assert.equal(prepared.baseSiteArtifact.productVersion, prepared.baseProductVersion);
  } finally {
    await rm(prepared.packageDirectory, { recursive: true, force: true });
  }
});

test("content baseSiteArtifact is explicit, immutable and independently hashed", () => {
  const artifact = {
    baseSiteArtifactId: "site-v0.21.0-abc123",
    productVersion: "v0.21.0",
    productCommit: "abc1234",
    releaseManifestHash: hashArtifactValue({ release: "v0.21.0" }),
    artifactContentHash: hashArtifactValue({ files: ["dist/client/index.html"] }),
    sourceDeploymentId: "prepared-site-001",
  };
  assert.equal(validateBaseSiteArtifact(artifact), artifact);
  assert.throws(() => validateBaseSiteArtifact({ ...artifact, releaseManifestHash: "not-a-hash" }), /SHA-256/);
});

test("content preparation accepts an explicit baseSiteArtifact without reading product release identity", async () => {
  const artifact = {
    baseSiteArtifactId: "site-v0.24.22-fixed",
    productVersion: "v0.24.22",
    productCommit: "97d095ca5d9c5e6a6cbe92940b188af58f298c80",
    releaseManifestHash: "a".repeat(64),
    artifactContentHash: "b".repeat(64),
    sourceDeploymentId: "prepared-dist-v0.24.22",
  };
  const prepared = await prepareContentRelease({ kind: "article", target, baseSiteArtifact: artifact, sourceRoot: root });
  try {
    assert.equal(prepared.baseSiteArtifactId, artifact.baseSiteArtifactId);
    assert.equal(prepared.baseProductCommit, artifact.productCommit);
  } finally {
    await rm(prepared.packageDirectory, { recursive: true, force: true });
  }
});

test("content build uses a staging copy and emits an independent content manifest", async () => {
  const prepared = await prepareContentRelease({ kind: "article", target, sourceRoot: root });
  try {
    const built = await buildContentRelease({ packageInfo: prepared, sourceRoot: root });
    const manifest = JSON.parse(await readFile(path.join(built.client, "content-manifest.json"), "utf8"));
    const release = JSON.parse(await readFile(path.join(built.client, "release.json"), "utf8"));
    assert.equal(manifest.contentReleaseId, prepared.contentReleaseId);
    assert.equal(manifest.target, target);
    assert.equal(manifest.publishedArticleSlugs[0], target);
    assert.equal(release.version, prepared.baseProductVersion);
    assert.equal(release.commit, prepared.baseProductCommit);
  } finally {
    await rm(prepared.packageDirectory, { recursive: true, force: true });
  }
});

test("public content verification checks only independent content identity", async () => {
  const manifest = {
    contentReleaseId: "article-demo-1234567890abcdef",
    target: "demo",
    contentHash: "a".repeat(64),
    targetPath: "/business-observations",
  };
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/content-manifest.json") return new Response(JSON.stringify(manifest), { status: 200 });
    if (pathname === "/release.json") return new Response(JSON.stringify({ version: "v0.24.15", commit: "old-product" }), { status: 200 });
    return new Response("<title>xingbuild</title>", { status: 200 });
  };
  const result = await verifyContentPackageOnce({ baseUrl: "https://example.test/", manifest, fetchImpl });
  assert.equal(result.contentReleaseId, manifest.contentReleaseId);
});

test("unified product publisher rejects content kinds before product gates", async () => {
  await assert.rejects(
    publish({ kind: "content", target: target, argv: ["--authorize-publish"] }),
    /only handles product transport/,
  );
});

test("content publisher has no product release gates or Git transport", async () => {
  const source = await readFile(path.join(root, "scripts", "content-release.mjs"), "utf8");
  assert.doesNotMatch(source, /release:preflight|release:closeout-check|git\s*\(|git push|git tag|git commit/);
  assert.match(source, /content:build|XINGBUILD_CONTENT_BUILD/);
  assert.match(source, /contentReleaseId/);
});
