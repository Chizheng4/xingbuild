import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateContentScope } from "../scripts/content-scope-check.mjs";
import { verifyContentReleaseOnce } from "../scripts/verify-content-release.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(root, "tests", "fixtures", "observation-candidate.valid.json");

function runScript(script, args, contentRoot) {
  return spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], {
    cwd: root,
    env: { ...process.env, XINGBUILD_CONTENT_ROOT: contentRoot },
    encoding: "utf8",
  });
}

test("valid candidate moves through isolated draft preview and promote", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const preview = runScript("content-preview.mjs", ["--slug", "sanitized-candidate-preview"], contentRoot);
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /\?draft=1/);
  const promoted = runScript("content-promote.mjs", ["--slug", "sanitized-candidate-preview"], contentRoot);
  assert.equal(promoted.status, 0, promoted.stderr);
  const publication = JSON.parse(
    await readFile(path.join(contentRoot, "content", "observations", "sanitized-candidate-preview.json"), "utf8"),
  );
  assert.equal(publication.status, "published");
});

test("invalid candidates fail instead of receiving invented fields", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-invalid-"));
  const candidate = JSON.parse(await readFile(fixturePath, "utf8"));
  delete candidate.operatingImpact;
  const invalidFile = path.join(contentRoot, "invalid.json");
  await writeFile(invalidFile, JSON.stringify(candidate));
  const result = runScript("content-import.mjs", ["--input", invalidFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /operatingImpact is required/);
});

test("content-only scope rejects mixed engineering files", () => {
  assert.deepEqual(validateContentScope(["content/observations/new-item.json"]), []);
  assert.ok(
    validateContentScope(["content/observations/new-item.json", "src/App.jsx"])
      .some((error) => error.includes("forbidden files")),
  );
  assert.ok(validateContentScope(["src/App.jsx"]).length);
});

test("production source and bundle contracts exclude local drafts", async () => {
  const repository = await readFile(path.join(root, "src", "content", "observationRepository.js"), "utf8");
  const vite = await readFile(path.join(root, "vite.config.mjs"), "utf8");
  const gitignore = await readFile(path.join(root, ".gitignore"), "utf8");
  assert.match(repository, /content\/observations\/\*\.json/);
  assert.doesNotMatch(repository, /\.content-workspace/);
  assert.match(vite, /apply: "serve"/);
  assert.match(gitignore, /\.content-workspace\//);

  const assetDirectory = path.join(root, "dist", "client", "assets");
  const assets = (await readdir(assetDirectory)).filter((name) => /\.(?:js|css)$/.test(name));
  const bundleText = (
    await Promise.all(assets.map((name) => readFile(path.join(assetDirectory, name), "utf8")))
  ).join("\n");
  assert.doesNotMatch(bundleText, /sanitized-candidate-preview|示例候选：只用于验证内容流水线/);
});

test("product and content publish scripts retain distinct safety contracts", async () => {
  const product = await readFile(path.join(root, "publish-xingbuild.command"), "utf8");
  const content = await readFile(path.join(root, "publish-content.command"), "utf8");
  assert.match(product, /HEAD_TAG[\s\S]*HEAD_TAG" != "\$VERSION"/);
  assert.match(content, /content-scope-check\.mjs --commit HEAD/);
  assert.match(content, /\.content-workspace/);
  assert.match(content, /npm run content:check[\s\S]*npm run build[\s\S]*npm run test:sites/);
  assert.doesNotMatch(content, /git push origin "\$HEAD_TAG"|push_with_retry "\$HEAD_TAG"/);
});

test("public content verification requires the target slug in the build manifest", async () => {
  const version = "v0.10.0";
  const commit = "0123456789abcdef";
  const html = "<!doctype html><title>xingbuild｜作品与实践</title>";
  const fetchWithManifest = (publishedSlugs) => async (input) => {
    const pathname = new URL(input).pathname;
    if (pathname === "/release.json") {
      return Response.json({ version, commit });
    }
    if (pathname === "/content-manifest.json") {
      return Response.json({ version, commit, publishedSlugs });
    }
    return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
  };

  const verified = await verifyContentReleaseOnce({
    baseUrl: "https://xingbuild.top/",
    expectedVersion: version,
    expectedCommit: commit,
    targetPath: "/observations/existing-slug",
    fetchImpl: fetchWithManifest(["existing-slug"]),
  });
  assert.equal(verified.targetSlug, "existing-slug");

  await assert.rejects(
    verifyContentReleaseOnce({
      baseUrl: "https://xingbuild.top/",
      expectedVersion: version,
      expectedCommit: commit,
      targetPath: "/observations/missing-slug",
      fetchImpl: fetchWithManifest(["existing-slug"]),
    }),
    /does not contain target slug: missing-slug/,
  );
});

test("built content manifest contains only current published slugs", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "dist", "client", "content-manifest.json"), "utf8"),
  );
  assert.deepEqual(
    manifest.publishedSlugs,
    ["four-planes-of-enterprise-digitalization", "robotaxi-simulation-boundary"],
  );
});
