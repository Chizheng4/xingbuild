import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const pageDefinitions = await readFile(new URL("../src/content/pageDefinitions.js", import.meta.url), "utf8");
const practice = await readFile(new URL("../src/components/practice/PracticePage.jsx", import.meta.url), "utf8");
const showcase = await readFile(new URL("../src/components/showcase/ShowcaseModule.jsx", import.meta.url), "utf8");
const latest = await readFile(new URL("../src/components/showcase/LatestUpdateCard.jsx", import.meta.url), "utf8");
const closing = await readFile(new URL("../src/components/showcase/ClosingAction.jsx", import.meta.url), "utf8");
const article = await readFile(new URL("../src/components/reading/EvergreenArticle.jsx", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("v0.26.4 keeps the approved Baseline 1 to 2 shared composition contract and moves H-02 into the product section", () => {
  assert.match(renderer, /sectionLabel="最新作品"/);
  assert.match(renderer, /heroAlign="start"/);
  assert.doesNotMatch(renderer, /heroEyebrow="最新作品"/);
  assert.match(renderer, /robotaxiProductConfiguration\.homeActions/);
  assert.match(renderer, /showClosing/);
  assert.match(renderer, /最新观察简讯/);
  assert.match(renderer, /<ObservationRail items=\{briefs\}/);
  assert.match(renderer, /business-observations-page__header/);
  assert.match(renderer, /<h1>经营观察<\/h1>/);
  assert.match(renderer, /headingLevel=\{2\}/);
  assert.match(pageDefinitions, /id: "business-observations"[\s\S]*home: \{ type: "home", id: "home" \}/);
});

test("v0.26.3 closes optional labels and preserves the registered release action", () => {
  assert.match(practice, /eyebrow = null/);
  assert.match(practice, /eyebrow \? <p className="eyebrow product-hero__eyebrow">/);
  assert.match(practice, /practice\.intro \? <p className="product-hero__intro">/);
  assert.match(practice, /showBoundary = false/);
  assert.match(practice, /showBoundary && practice\.boundary/);
  assert.match(practice, /<ActionGroup actions=\{actions\} equalWidth \/>/);
  assert.match(practice, /projectClosingAction/);
  assert.match(showcase, /const title = typeof module\.label === "string"/);
  assert.match(showcase, /const group = typeof module\.group === "string"/);
  assert.match(showcase, /group && group !== title/);
  assert.match(showcase, /label \? <p className="showcase-module__label">/);
  assert.match(latest, /<span className="eyebrow">NEW<\/span>/);
  assert.match(latest, /<span id="latest-update-title" className="latest-update-card__title">\{release\.version\}<\/span>/);
  assert.match(latest, /查看最新版/);
  assert.match(closing, /typeof closing\.eyebrow === "string"/);
  assert.doesNotMatch(closing, /继续进入/);
  assert.match(article, /headingLevel = 2/);
  assert.match(article, /const Heading = `h\$\{headingLevel\}`/);
});

test("v0.26.3 keeps media-only elevation, muted text and mobile action geometry", () => {
  assert.match(tokens, /--color-observation-surface: #ffffff/);
  assert.match(tokens, /--color-text-muted: #64748b/);
  assert.match(tokens, /--shadow-reading: none/);
  assert.match(tokens, /--shadow-media: 0 8px 24px rgba\(15, 23, 42, 0\.08\)/);
  assert.match(components, /\.rich-document \{ display: block; box-shadow: var\(--shadow-reading\); \}/);
  assert.match(components, /\.product-hero__heading \{ display: grid; gap: var\(--space-1\)/);
  assert.match(components, /\.business-observations-rail__header h2/);
  assert.match(components, /\.action-group--equal \{[\s\S]*grid-template-columns: repeat\(var\(--action-count\)/);
  assert.match(components, /\.closing-action \{ flex-direction: column; align-items: stretch; gap: var\(--space-6\); \}/);
  assert.match(components, /\.closing-action \.action-group \{ width: 100%; display: grid; grid-template-columns: minmax\(0, 1fr\); \}/);
  assert.match(components, /\.closing-action \.action-group__action \{ width: 100%; white-space: nowrap; \}/);
  assert.doesNotMatch(components, /\.brief-item \{[^}]*box-shadow:/s);
});
