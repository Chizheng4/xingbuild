import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const practice = await readFile(new URL("../src/components/practice/PracticePage.jsx", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");

test("v0.26.4 H-02 projects the home label into the shared product content structure", () => {
  assert.match(renderer, /sectionLabel="最新作品"/);
  assert.match(renderer, /heroAlign="start"/);
  assert.doesNotMatch(renderer, /heroEyebrow="最新作品"/);
  assert.match(practice, /practice-presentation--section-labeled/);
  assert.match(practice, /practice-presentation__section-label/);
  assert.match(practice, /align = "center"/);
  assert.match(practice, /product-hero--start/);
});

test("v0.26.4 H-02 keeps the shared four-pixel binding and removes narrow-screen padding", () => {
  assert.match(pages, /practice-presentation\.practice-presentation--section-labeled \{ gap: var\(--space-1\); \}/);
  assert.match(pages, /practice-presentation__section-label \{ width: min\(100%, var\(--measure-product-hero\)\); margin: 0 auto; \}/);
  assert.match(pages, /\.home-page__projection \.product-hero--start \{ padding-block-start: 0; \}/);
  assert.match(components, /\.product-hero--start \{ justify-items: start; text-align: start; \}/);
  assert.match(components, /\.product-hero--start \.product-hero__heading \{ justify-items: start; \}/);
  assert.match(components, /\.product-hero--start \.action-group \{ justify-content: start; \}/);
});
