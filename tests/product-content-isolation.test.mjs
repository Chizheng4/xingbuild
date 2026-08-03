import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const client = path.join(root, "dist", "client");

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

test("product build is structurally independent from the ignored content root", async () => {
  const repositories = await Promise.all([
    readFile(path.join(root, "src/content/showcaseRepository.js"), "utf8"),
    readFile(path.join(root, "src/content/practiceRepository.js"), "utf8"),
    readFile(path.join(root, "src/content/observationRepository.js"), "utf8"),
    readFile(path.join(root, "src/content/evergreenArticleRepository.js"), "utf8"),
    readFile(path.join(root, "src/content/profileRepository.js"), "utf8"),
  ]);
  for (const source of repositories) {
    assert.match(source, /__XINGBUILD_CONTENT_BUILD__/);
    assert.doesNotMatch(source, /from ["']\.\.\/\.\.\/\.content-workspace\/content\//);
  }
  const prepare = await readFile(path.join(root, "scripts/prepare-sites-build.mjs"), "utf8");
  assert.doesNotMatch(prepare, /contentRootDirectory|independentMediaRoot/);
});

test("prepared product dist contains no independent content files or identity fields", async () => {
  if (!(await exists(client))) return;
  const entries = await readdir(client, { withFileTypes: true });
  assert.equal(entries.some((entry) => entry.name === "media"), false);
  const manifest = JSON.parse(await readFile(path.join(client, "content-manifest.json"), "utf8"));
  assert.deepEqual(manifest.publishedSlugs, []);
  assert.deepEqual(manifest.publishedArticleSlugs, []);
  for (const forbidden of ["contentReleaseId", "deploymentId", "publicVerify"]) {
    assert.equal(Object.hasOwn(manifest, forbidden), false, `product manifest must not contain ${forbidden}`);
  }
  const files = [];
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else files.push(file);
    }
  };
  await visit(client);
  const textFiles = files.filter((file) => /\.(?:html|js|css|json|txt|svg)$/.test(file));
  for (const file of textFiles) {
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(content, /robotaxi-evidence-fleet-operations-console-v1|contentReleaseId/);
  }
});
