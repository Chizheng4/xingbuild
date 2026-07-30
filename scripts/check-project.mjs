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
  "src/content/showcaseRepository.js",
  "src/content/profileRepository.js",
  "src/content/practiceRepository.js",
  "src/content/observationRepository.js",
  "src/content/sourceUrls.js",
  "src/lib/visitQualification.js",
  "content/schema/observation.schema.json",
  "content/products/robotaxi.json",
  "content/business-observations/enterprise-operating-framework.json",
  "content/profile/about.json",
  "content/media/robotaxi/manifest.json",
  "src/styles.css",
  "src/styles/tokens.css",
  "src/styles/foundations.css",
  "src/styles/layout.css",
  "src/styles/components.css",
  "src/styles/pages.css",
  "src/components/site/SiteHeader.jsx",
  "src/components/reading/Article.jsx",
  "src/components/showcase/SystemStage.jsx",
  "src/components/reading/RichDocument.jsx",
  "publish-xingbuild.command",
  "publish-content.command",
  "scripts/release-preflight.mjs",
  "scripts/release-closeout-check.mjs",
  "scripts/lib/release-readiness.mjs",
  "scripts/content-review.mjs",
  "scripts/content-promote.mjs",
  "scripts/content-approve.mjs",
  "scripts/content-supersede.mjs",
  "scripts/content-scope-check.mjs",
  "scripts/lib/content-finalize.mjs",
  "scripts/lib/content-approval.mjs",
  "scripts/lib/content-release-readiness.mjs",
  "scripts/verify-public-release.mjs",
  "edgeone.json",
  ".openai/hosting.json",
  "worker/index.js",
  "tests/visit-overview.test.mjs",
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
const worker = await readFile(
  new URL("../worker/index.js", import.meta.url),
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
const showcaseRepository = await readFile(new URL("../src/content/showcaseRepository.js", import.meta.url), "utf8");
const profileRepository = await readFile(new URL("../src/content/profileRepository.js", import.meta.url), "utf8");
assert(showcaseRepository.includes("content/products/robotaxi.json"), "Robotaxi must use the controlled product content source");
assert(showcaseRepository.includes("content/business-observations/enterprise-operating-framework.json"), "framework must use the controlled business-observation source");
assert(profileRepository.includes("content/profile/about.json"), "profile must use the controlled profile content source");
assert(!siteContent.includes("export const observations"), "observations must not be inlined in site content");
assert(!siteContent.includes("export const practices"), "practices must use the controlled content repository");
assert(observationRepository.includes("import.meta.glob"), "published observations must use the repository");
assert(practiceRepository.includes("content/products/robotaxi.json"), "practice content must use the repository");
for (const route of ["/products", "/business-observations", "/observations", "/about"]) {
  assert(app.includes(route), `app must include the ${route} route`);
}
assert.deepEqual(edgeOneConfig.redirects, [
  {
    source: "$wwwhost",
    destination: "$host",
    statusCode: 301,
  },
]);
assert(app.includes("startVisitQualification"), "app must start the formal-site visit qualifier");
for (const contract of [
  "visitKv",
  "visitHashSecret",
  "XINGBUILD",
  "/api/visits/qualify",
  "Asia/Shanghai",
]) {
  assert(worker.includes(contract), `worker must retain visit contract: ${contract}`);
}

console.log(`xingbuild project check passed for v${packageJson.version}`);
