import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const foundations = await readFile(new URL("../src/styles/foundations.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const header = await readFile(new URL("../src/components/site/SiteHeader.jsx", import.meta.url), "utf8");
const practice = await readFile(new URL("../src/components/practice/PracticePage.jsx", import.meta.url), "utf8");
const observations = await readFile(new URL("../src/components/observations/Briefs.jsx", import.meta.url), "utf8");
const observationsPage = await readFile(new URL("../src/pages/ObservationsPage.jsx", import.meta.url), "utf8");
const siteContent = await readFile(new URL("../src/content/siteContent.js", import.meta.url), "utf8");
const homePage = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const robotaxiPage = await readFile(new URL("../src/pages/RobotaxiPage.jsx", import.meta.url), "utf8");
const observationRepository = await readFile(new URL("../src/content/observationRepository.js", import.meta.url), "utf8");
const practiceRepository = await readFile(new URL("../src/content/practiceRepository.js", import.meta.url), "utf8");
const practiceContent = await readFile(new URL("../content/practices/robotaxi.json", import.meta.url), "utf8");
const startCommand = await readFile(new URL("../start-xingbuild.command", import.meta.url), "utf8");
const allStyles = [tokens, foundations, layout, components, pages].join("\n");

test("root stylesheet retains local fonts and responsibility layers", () => {
  for (const dependency of ["@fontsource-variable/noto-serif-sc", "@fontsource-variable/noto-sans-sc", "./styles/tokens.css", "./styles/framework.css"]) {
    assert.match(root, new RegExp(dependency.replace(/[./-]/g, "\\$&")));
  }
});

test("brand and high-density layout tokens are semantic and fixed across breakpoints", () => {
  for (const token of ["--color-canvas", "--color-text", "--color-accent", "--site-max: 80rem", "--gutter-page: 2rem", "--gutter-mobile: 1.25rem", "--gutter-narrow: 1rem", "--rail-width: 20rem", "--two-column-gap: 3rem", "--two-column-main-min: 37.5rem", "--media-ratio: 16 / 10"]) assert.ok(tokens.includes(token), `${token} must exist`);
  assert.doesNotMatch(allStyles, /prefers-color-scheme/);
  assert.match(layout, /\.site-header \{ min-height: 4\.5rem; \}/);
  assert.match(layout, /\.site-header \{ min-height: 4rem; \}/);
  assert.match(layout, /max-width: 64\.5rem/);
});

test("routes and navigation expose the four approved top-level destinations", () => {
  for (const path of ["/robotaxi", "/enterprise-operating-framework", "/observations", "/about"]) assert.ok(app.includes(path));
  for (const label of ["Robotaxi运营平台", "企业经营体系", "观察", "关于我"]) assert.ok(header.includes(label));
  assert.match(header, /aria-current/);
  assert.doesNotMatch(header, /href: "\/works"/);
  assert.match(app, /"\/works": "\/robotaxi"/);
});

test("home title stays content-driven and phrase-aware", () => {
  assert.match(siteContent, /homeTitle:.*\\u2060/);
  assert.match(foundations, /word-break: auto-phrase/);
  assert.match(foundations, /text-wrap: balance/);
  assert.doesNotMatch(foundations, /word-break:\s*(?:break-all|keep-all)/);
  assert.match(homePage, /site\.homeTitle/);
  assert.doesNotMatch(robotaxiPage, /site\.homeTitle/);
});

test("practice modules require explicit evidence media and do not create placeholders", () => {
  assert.match(practiceContent, /"modules": \[\]/);
  assert.match(practiceRepository, /robotaxiMediaManifest/);
  assert.match(practice, /module\.image\?\.src/);
  assert.match(practice, /if \(!image\) return null/);
  assert.match(pages, /aspect-ratio: var\(--media-ratio\)/);
  assert.doesNotMatch(practice, /placeholder|robotaxi\.xingbuild\.top/);
  assert.match(practice, /PracticeHeader/);
  assert.match(practice, /PracticeEmptyState/);
  assert.doesNotMatch(practice, /PositioningStrip/);
});

test("observation stream only consumes explicit reading projections", () => {
  assert.match(observationRepository, /projectObservationBrief/);
  assert.match(observationRepository, /projectObservationBrief/);
  assert.match(observations, /brief-item__identity/);
  assert.match(observations, /brief-item__dimension/);
  assert.match(observations, /brief-item__statement/);
  assert.match(observationsPage, /ObservationEmptyState/);
  assert.match(observationsPage, /site\.emptyStates\.observations/);
  assert.match(observations, /observations-empty-title/);
  assert.match(siteContent, /暂无已核验简讯/);
  assert.doesNotMatch(observationsPage, /ObservationArchive|summary/);
  assert.doesNotMatch(observations, /ObservationCard|ContentCard|claimKind|articleHref/);
  assert.match(observations, /brief-item__sources/);
  assert.doesNotMatch(components, /border-block-(?:start|end):.*color-mix/);
});

test("layout owns sibling spacing and components do not create desktop rails without content", () => {
  assert.match(layout, /\.two-column-layout\.has-rail/);
  assert.match(layout, /\.two-column-layout__main \{ min-width: 0; max-width: var\(--measure-practice\); \}/);
  assert.match(layout, /\.collection-layout \{ width: min\(100%, var\(--measure-observation\)\); margin-inline: auto; \}/);
  assert.match(layout, /main \{ min-height: 0; flex: 0 0 auto; \}/);
  assert.match(components, /\.observation-stream \{ display: grid; gap: var\(--space-5\); \}/);
  assert.match(components, /@media \(max-width: 32\.4375rem\) \{[\s\S]*?\.observation-stream \{ gap: var\(--space-4\); \}/);
  assert.doesNotMatch(pages, /\.practice-page\s*\{[^}]*width:/);
});

test("local startup continues to use only the fixed preview URL", () => {
  assert.match(startCommand, /LOCAL_URL="http:\/\/127\.0\.0\.1:4317\/"/);
  assert.match(startCommand, /ONLINE_URL="https:\/\/xingbuild\.top\/"/);
  assert.match(startCommand, /--port 4317 --strictPort --open \//);
});
