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
  "content/articles/enterprise-operating-system.json",
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
  "src/components/reading/EvergreenArticle.jsx",
  "src/components/reading/ReadingTOC.jsx",
  "src/components/reading/RichDocument.jsx",
  "src/content/evergreenArticleRepository.js",
  "src/content/diagramFigureAssets.js",
  "src/content/pageDefinitions.js",
  "src/content/pageContentResolver.js",
  "src/components/page-compositions/PageCompositionRenderer.jsx",
  "scripts/generate-evergreen-figures.mjs",
  "scripts/article-content-check.mjs",
  "scripts/article-scope-check.mjs",
  "scripts/practice-scope-check.mjs",
  "scripts/verify-practice-release.mjs",
  "scripts/verify-article-release.mjs",
  "publish-xingbuild.command",
  "publish-content.command",
  "publish-practice.command",
  "publish-article.command",
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
  "tests/framework-layout.test.mjs",
  "tests/framework-experience.test.mjs",
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
const evergreenRepository = await readFile(new URL("../src/content/evergreenArticleRepository.js", import.meta.url), "utf8");
assert(evergreenRepository.includes("content/articles/enterprise-operating-system.json"), "framework article must use the evergreen content source");
const pageDefinitions = await readFile(new URL("../src/content/pageDefinitions.js", import.meta.url), "utf8");
const compositionRenderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
assert(pageDefinitions.includes("pageDefinitionRegistry"), "page definitions must expose a controlled registry");
for (const composition of ["HomeComposition", "ShowcaseComposition", "CollectionComposition", "ReadingComposition"]) {
  assert(pageDefinitions.includes(composition), `page definitions must register ${composition}`);
  assert(compositionRenderer.includes(composition), `composition renderer must support ${composition}`);
}
assert(app.includes("findPageDefinitionByRoute"), "app routes must resolve through the page definition registry");
assert(app.includes("PageCompositionRenderer"), "app routes must use the shared composition renderer");
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
assert(app.includes("/business-observations#digital-implementation"), "legacy digital view must replace to its evergreen anchor");
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
