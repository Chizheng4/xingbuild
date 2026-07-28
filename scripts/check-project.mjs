#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const requiredFiles = [
  "AGENTS.md",
  "VERSION.md",
  "docs/iterations/current.md",
  "docs/rules/iteration-and-release.md",
  "src/App.jsx",
  "src/content/siteContent.js",
  "src/content/practiceRepository.js",
  "src/content/observationRepository.js",
  "src/content/sourceUrls.js",
  "content/schema/observation.schema.json",
  "content/practices/robotaxi.json",
  "content/media/robotaxi/manifest.json",
  "src/styles.css",
  "src/styles/tokens.css",
  "src/styles/foundations.css",
  "src/styles/layout.css",
  "src/styles/components.css",
  "src/styles/pages.css",
  "src/components/site/SiteHeader.jsx",
  "src/components/reading/Article.jsx",
  "src/components/works/Works.jsx",
  "publish-xingbuild.command",
  "publish-content.command",
  "scripts/verify-public-release.mjs",
  "edgeone.json",
  ".openai/hosting.json",
  "worker/index.js",
];

for (const file of requiredFiles) {
  const info = await stat(new URL(`../${file}`, import.meta.url));
  assert(info.isFile(), `${file} must be a file`);
}

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const version = await readFile(new URL("../VERSION.md", import.meta.url), "utf8");
const current = await readFile(
  new URL("../docs/iterations/current.md", import.meta.url),
  "utf8",
);
const siteContent = await readFile(
  new URL("../src/content/siteContent.js", import.meta.url),
  "utf8",
);
const observationRepository = await readFile(
  new URL("../src/content/observationRepository.js", import.meta.url),
  "utf8",
);
const practiceRepository = await readFile(
  new URL("../src/content/practiceRepository.js", import.meta.url),
  "utf8",
);
const app = await readFile(
  new URL("../src/App.jsx", import.meta.url),
  "utf8",
);
const edgeOneConfig = JSON.parse(
  await readFile(new URL("../edgeone.json", import.meta.url), "utf8"),
);

assert.match(packageJson.version, /^\d+\.\d+\.\d+$/, "package version must use x.y.z");
assert(
  version.includes(`v${packageJson.version}`),
  "VERSION.md must contain the package version",
);
assert(
  current.includes(`v${packageJson.version}`),
  "current iteration must contain the package version",
);
assert(siteContent.includes("Robotaxi"), "site content must include the Robotaxi work");
assert(siteContent.includes("企业经营"), "site content must include the cognition work");
assert(siteContent.includes("export const profile"), "site content must define the profile");
assert(!siteContent.includes("export const observations"), "observations must not be inlined in site content");
assert(!siteContent.includes("export const practices"), "practices must use the controlled content repository");
assert(observationRepository.includes("import.meta.glob"), "published observations must use the repository");
assert(practiceRepository.includes("content/practices/robotaxi.json"), "practice content must use the repository");
for (const route of ["/observations", "/works", "/about"]) {
  assert(app.includes(route), `app must include the ${route} route`);
}
assert(
  siteContent.includes("不代表真实城市运营、自动驾驶核心技术或真实企业经营结果"),
  "Robotaxi evidence boundary must remain explicit",
);
assert.deepEqual(edgeOneConfig.redirects, [
  {
    source: "$wwwhost",
    destination: "$host",
    statusCode: 301,
  },
]);

console.log(`xingbuild project check passed for v${packageJson.version}`);
