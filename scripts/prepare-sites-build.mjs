#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBaseSiteArtifact } from "./lib/base-site-artifact.mjs";
import { contentRootDirectory } from "./lib/content-root.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");
const edgeOneConfig = path.join(root, "edgeone.json");
const contentRoot = contentRootDirectory({ sourceRoot: root });
const observationsDirectory = path.join(contentRoot, "observations");
const articlesDirectory = path.join(contentRoot, "articles");
// Relative import keys may retain the independent root name; only an absolute
// local filesystem path would leak the canonical workspace into the artifact.
const workspaceMarker = path.join(root, ".content-workspace");

for (const file of [index, worker, hosting, edgeOneConfig]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
copyFileSync(edgeOneConfig, path.join(dist, "client", "edgeone.json"));
const independentMediaRoot = path.join(contentRoot, "media");
if (existsSync(independentMediaRoot)) cpSync(independentMediaRoot, path.join(dist, "client", "media"), { recursive: true });

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const commit = process.env.XINGBUILD_PRODUCT_COMMIT || execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const releaseVersion = process.env.XINGBUILD_PRODUCT_VERSION || `v${packageJson.version}`;
const publishedSlugs = readdirSync(observationsDirectory)
  .filter((name) => name.endsWith(".json"))
  .map((name) => {
    const observation = JSON.parse(readFileSync(path.join(observationsDirectory, name), "utf8"));
    if (observation.status !== "published") {
      throw new Error(`Production content must be published: ${name}`);
    }
    if (name !== `${observation.slug}.json`) {
      throw new Error(`Observation filename must match slug: ${name}`);
    }
    return observation.slug;
  })
  .sort();
const publishedArticleSlugs = readdirSync(articlesDirectory)
  .filter((name) => name.endsWith(".json"))
  .map((name) => {
    const article = JSON.parse(readFileSync(path.join(articlesDirectory, name), "utf8"));
    if (article.status !== "published") throw new Error(`Production article must be published: ${name}`);
    if (name !== `${article.slug}.json`) throw new Error(`Article filename must match slug: ${name}`);
    return article.slug;
  })
  .sort();

writeFileSync(
  path.join(dist, "client", "release.json"),
  `${JSON.stringify(
    {
      version: releaseVersion,
      commit,
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(dist, "client", "content-manifest.json"),
  `${JSON.stringify(
    {
      version: releaseVersion,
      commit,
      publishedSlugs,
      publishedArticleSlugs,
    },
    null,
    2,
  )}\n`,
);

const baseSiteArtifact = await createBaseSiteArtifact({
  sourceRoot: root,
  productVersion: releaseVersion,
  productCommit: commit,
  release: JSON.parse(readFileSync(path.join(dist, "client", "release.json"), "utf8")),
  contentManifest: JSON.parse(readFileSync(path.join(dist, "client", "content-manifest.json"), "utf8")),
});
writeFileSync(
  path.join(dist, "client", "base-site-artifact.json"),
  `${JSON.stringify(baseSiteArtifact, null, 2)}\n`,
);

const inspectFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? inspectFiles(file) : [file];
});
for (const file of inspectFiles(path.join(dist, "client"))) {
  if (!/\.(?:html|js|css|json|txt|xml|svg)$/.test(file)) continue;
  if (path.basename(file) === "base-site-artifact.json") continue;
  if (readFileSync(file, "utf8").includes(workspaceMarker)) {
    throw new Error(`Production build contains workspace path: ${path.relative(root, file)}`);
  }
}

console.log(
  `Prepared Sites build and content manifest: ${publishedSlugs.length} published observation(s), ${publishedArticleSlugs.length} evergreen article(s)`,
);
