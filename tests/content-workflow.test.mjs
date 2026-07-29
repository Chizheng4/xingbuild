import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateContentScope } from "../scripts/content-scope-check.mjs";
import { readPublishedObservations } from "../scripts/lib/observation-content.mjs";
import { verifyContentReleaseOnce } from "../scripts/verify-content-release.mjs";
import {
  evaluateCloseoutReadiness,
  evaluateProductReleaseReadiness,
  expectedOrigin,
} from "../scripts/lib/release-readiness.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(root, "tests", "fixtures", "observation-candidate.valid.json");

function runScript(script, args, contentRoot) {
  return spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], {
    cwd: root,
    env: { ...process.env, XINGBUILD_CONTENT_ROOT: contentRoot },
    encoding: "utf8",
  });
}

async function pathExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

test("valid candidate moves through isolated draft preview and promote", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  assert.match(imported.stdout, /Workspace import consumed: no \(external input retained\)/);
  assert.equal(await pathExists(fixturePath), true);
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

test("workspace import is consumed only after a valid draft is written", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-consume-"));
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const inputFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  const draftFile = path.join(contentRoot, ".content-workspace", "drafts", "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await writeFile(inputFile, await readFile(fixturePath, "utf8"));

  const imported = runScript("content-import.mjs", ["--input", inputFile], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  assert.match(imported.stdout, /Workspace import consumed: yes/);
  assert.equal(await pathExists(inputFile), false);
  assert.equal(await pathExists(draftFile), true);
});

test("invalid candidates fail instead of receiving invented fields", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-invalid-"));
  const candidate = JSON.parse(await readFile(fixturePath, "utf8"));
  delete candidate.operatingImpact;
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const invalidFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await writeFile(invalidFile, JSON.stringify(candidate));
  const result = runScript("content-import.mjs", ["--input", invalidFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /operatingImpact is required/);
  assert.equal(await pathExists(invalidFile), true);
});

test("duplicate draft keeps the workspace import", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-duplicate-"));
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const draftsDirectory = path.join(contentRoot, ".content-workspace", "drafts");
  const inputFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  const draftFile = path.join(draftsDirectory, "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await mkdir(draftsDirectory, { recursive: true });
  await writeFile(inputFile, await readFile(fixturePath, "utf8"));
  await writeFile(draftFile, await readFile(fixturePath, "utf8"));

  const result = runScript("content-import.mjs", ["--input", inputFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Draft observation already exists/);
  assert.equal(await pathExists(inputFile), true);
});

test("draft write failure keeps the workspace import", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-write-failure-"));
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const blockedDraftPath = path.join(
    contentRoot,
    ".content-workspace",
    "drafts",
    "sanitized-candidate-preview.json",
  );
  const inputFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await mkdir(blockedDraftPath, { recursive: true });
  await writeFile(inputFile, await readFile(fixturePath, "utf8"));

  const result = runScript("content-import.mjs", ["--input", inputFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.equal(await pathExists(inputFile), true);
});

test("content-only scope rejects mixed engineering files", () => {
  assert.deepEqual(validateContentScope(["content/observations/new-item.json"]), []);
  assert.deepEqual(validateContentScope(["content/products/new-product.json"]), []);
  assert.deepEqual(validateContentScope(["content/business-observations/new-observation.json"]), []);
  assert.deepEqual(validateContentScope([
    "content/media/robotaxi/manifest.json",
    "content/media/robotaxi/archive/retired-media.png",
    "public/media/robotaxi/new-approved-media.png",
  ]), []);
  assert.ok(validateContentScope(["content/media/robotaxi/manifest.json", "content/products/new-product.json"]).length);
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
  assert.match(product, /npm run release:preflight/);
  assert.match(content, /content-scope-check\.mjs --commit HEAD/);
  assert.match(content, /\.content-workspace/);
  assert.ok(content.includes("content/media/[a-z0-9-]+/manifest\\.json"));
  assert.match(content, /npm run content:check[\s\S]*npm run practice:check[\s\S]*npm run build[\s\S]*npm run test:sites/);
  assert.doesNotMatch(content, /git push origin "\$HEAD_TAG"|push_with_retry "\$HEAD_TAG"/);
});

test("product release readiness requires a clean, tagged, version-consistent repository", () => {
  const readyInput = {
    branch: "main",
    statusEntries: [],
    packageVersion: "0.12.2",
    versionRecord: "v0.12.2",
    currentVersion: "v0.12.2",
    headTag: "v0.12.2",
    origin: expectedOrigin,
  };
  assert.equal(evaluateProductReleaseReadiness(readyInput).ready, true);

  const blocked = evaluateProductReleaseReadiness({
    ...readyInput,
    statusEntries: [" M AGENTS.md", "?? docs/design/v0.13.0.md"],
    headTag: "v0.12.1",
  });
  assert.equal(blocked.ready, false);
  assert.equal(blocked.blockers.length, 2);
  assert.match(blocked.blockers[0], /2 项未提交修改/);
  assert.match(blocked.blockers[1], /HEAD 标签/);
});

test("version closeout stops before commit when work remains outside the staged scope", () => {
  const stagedInput = {
    branch: "main",
    stagedEntries: ["scripts/release-preflight.mjs"],
    unstagedEntries: [],
    untrackedEntries: [],
    packageVersion: "0.12.2",
    versionRecord: "v0.12.2",
    currentVersion: "v0.12.2",
  };
  assert.equal(evaluateCloseoutReadiness(stagedInput).ready, true);

  const blocked = evaluateCloseoutReadiness({
    ...stagedInput,
    unstagedEntries: ["AGENTS.md"],
    untrackedEntries: ["docs/design/v0.13.0.md"],
  });
  assert.equal(blocked.ready, false);
  assert.deepEqual(blocked.blockers.slice(0, 2), [
    "仍有 1 项未暂存修改。",
    "仍有 1 项未追踪文件。",
  ]);
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
  const expectedPublishedSlugs = (await readPublishedObservations())
    .map((publication) => publication.slug)
    .sort();
  assert.deepEqual([...manifest.publishedSlugs].sort(), expectedPublishedSlugs);
});
