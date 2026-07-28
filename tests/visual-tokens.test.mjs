import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const header = await readFile(new URL("../src/components/site/SiteHeader.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const practice = await readFile(new URL("../src/components/practice/PracticePage.jsx", import.meta.url), "utf8");
const framework = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const brief = await readFile(new URL("../src/components/observations/Briefs.jsx", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("v0.14 uses one shell, showcase geometry, reading width and two-state compact header", () => {
  for (const token of ["--site-max: 80rem", "--rail-width: 19rem", "--two-column-gap: 1.5rem", "--two-column-main: 59.5rem", "--showcase-description-width: 13rem", "--showcase-gap: 1.25rem", "--measure-reading: 46rem", "--header-height: 3.5rem", "--header-height-mobile: 3.25rem"]) assert.match(tokens, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(layout, /position: sticky/);
  assert.match(layout, /site-header\.is-scrolled::before/);
  assert.match(layout, /site-header::before \{[\s\S]*position: fixed;[\s\S]*inset: 0 0 auto;[\s\S]*height: var\(--header-background-height\)/);
  assert.match(layout, /backdrop-filter: blur\(12px\)/);
  assert.doesNotMatch(layout, /\.site-header::before[\s\S]*width: 100vw/);
  assert.doesNotMatch(layout, /\.site-header::before[\s\S]*translateX\(-50%\)/);
  assert.match(header, /window\.scrollY > 8/);
  assert.match(layout, /grid-template-columns: var\(--showcase-description-width\)/);
  assert.match(layout, /showcase-layout__stage \{ order: -1/);
  assert.doesNotMatch(layout, /prefers-color-scheme/);
});

test("navigation and home project the approved IA without a fourth primary item", () => {
  for (const label of ["B端产品", "经营观察", "关于我"]) assert.match(header, new RegExp(label));
  assert.doesNotMatch(header, /label: "观察"/);
  for (const path of ["/products", "/business-observations", "/observations", "/about"]) assert.match(app, new RegExp(path.replace("/", "\\/")));
  assert.match(home, /site\.homeTitle/);
  assert.match(home, /PracticePresentation/);
  assert.match(home, /BusinessObservationPresentation/);
  assert.match(home, /home-page__positioning-shell[\s\S]*<TwoColumnLayout/);
});

test("showcase and observation components preserve data-driven reader anatomy", () => {
  assert.match(practice, /ShowcaseLayout/);
  assert.match(practice, /SystemStage/);
  assert.doesNotMatch(practice, /loopRelation \?/);
  assert.match(framework, /FrameworkDescription/);
  assert.doesNotMatch(framework, /ExplanationPanel/);
  assert.match(brief, /brief-item__identity/);
  assert.match(brief, /brief-item__dimension/);
  assert.match(brief, /brief-item__sources/);
  assert.match(pages, /home-page__positioning/);
  for (const token of ["--type-positioning", "--type-wordmark", "--type-page-title", "--type-article-title", "--type-section-title", "--type-reading", "--type-summary", "--type-meta"]) assert.match(tokens, new RegExp(token));
  assert.doesNotMatch(`${pages}\n${components}`, /--type-feature-title|--type-display|--leading-display|--type-hero-summary/);
  assert.match(components, /background: var\(--color-observation-surface\)/);
  assert.match(components, /white-space: nowrap/);
  assert.match(components, /brief-item__sources a \{ color: inherit/);
  assert.match(components, /rich-document > \* \+ h2 \{ margin-top: 2rem/);
  assert.doesNotMatch(components, /\.brief-item \{[^}]*border:/s);
});
