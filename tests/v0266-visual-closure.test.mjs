import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const frameworkPage = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/components/page-compositions/HomeProductProjection.jsx", import.meta.url), "utf8");
const hero = await readFile(new URL("../src/components/practice/PracticePrimitives.jsx", import.meta.url), "utf8");
const article = await readFile(new URL("../src/components/reading/EvergreenArticle.jsx", import.meta.url), "utf8");
const richDocument = await readFile(new URL("../src/components/reading/RichDocument.jsx", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("Home keeps independent label anchoring, centered hero, and centered action axis", () => {
  assert.match(home, /eyebrow="最新作品" eyebrowAlign="start"/);
  assert.match(home, /projectHomeClosingAction/);
  assert.doesNotMatch(home, /align="start"/);
  assert.match(hero, /align = "center"/);
  assert.match(pages, /\.home-page__actions-align \{ display: flex; width: min\(100%, var\(--measure-product-hero\)\); margin-inline: auto; justify-content: center;/);
});

test("business observations owns a full-row H1 and aligned column headings", () => {
  for (const source of [renderer, frameworkPage]) {
    assert.match(source, /<header className="business-observations-page__header"><h1>经营观察<\/h1><\/header>/);
    assert.match(source, /<header className="business-observations-column-heading"><h2>最新经营观察<\/h2><\/header>/);
  }
  assert.match(renderer, /<header className="business-observations-rail__header"><h2>最新简讯<\/h2><\/header>/);
  assert.match(components, /\.business-observations-column-heading, \.business-observations-rail__header \{ display: flex; align-items: baseline;/);
});

test("article projection hides summary, figures, and architecture without deleting source capabilities", () => {
  assert.match(renderer, /showSummary=\{false\} showFigures=\{false\} showArchitectureViews=\{false\}/);
  assert.match(frameworkPage, /showSummary=\{false\} showFigures=\{false\} showArchitectureViews=\{false\}/);
  assert.match(article, /showSummary = true/);
  assert.match(article, /showSummary && article\.summary/);
  assert.match(article, /showFigures=\{showFigures\} showArchitectureViews=\{showArchitectureViews\}/);
  assert.match(richDocument, /showFigures = true, showArchitectureViews = true/);
  assert.match(richDocument, /if \(!showFigures\) return null/);
  assert.match(richDocument, /showArchitectureViews \? <EnterpriseArchitectureViews/);
});

test("page independence and content boundaries remain explicit", () => {
  assert.doesNotMatch(renderer, /ShowcaseFlow/);
  assert.doesNotMatch(home, /BusinessObservationPresentation/);
  assert.doesNotMatch(renderer, /content-release|ContentSetCandidate|publish/);
});
