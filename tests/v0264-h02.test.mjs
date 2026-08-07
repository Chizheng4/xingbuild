import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/components/page-compositions/HomeProductProjection.jsx", import.meta.url), "utf8");
const practice = await readFile(new URL("../src/components/practice/PracticePrimitives.jsx", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");

test("v0.26.6 preserves H-02 while centering the Home product hero", () => {
  assert.match(renderer, /<HomeProductProjection practice=/);
  assert.doesNotMatch(renderer, /ShowcaseFlow/);
  assert.match(home, /home-product-section__section-label/);
  assert.match(home, /最新作品/);
  assert.doesNotMatch(home, /align="start"/);
  assert.match(practice, /align = "center"/);
  assert.match(practice, /product-hero--start/);
});

test("v0.26.6 H-02 keeps the shared four-pixel binding and centers the Home action axis", () => {
  assert.match(pages, /\.home-product-section \{ gap: var\(--space-1\); \}/);
  assert.match(pages, /home-product-section__section-label \{ width: min\(100%, var\(--measure-product-hero\)\); margin: 0 auto; \}/);
  assert.match(pages, /\.home-page__actions \{ width: min\(100%, var\(--measure-product-hero\)\); margin-inline: auto;/);
  assert.match(components, /\.product-hero--start \{ justify-items: start; text-align: start; \}/);
  assert.match(components, /\.product-hero--start \.product-hero__heading \{ justify-items: start; \}/);
  assert.match(components, /\.product-hero--start \.action-group \{ justify-content: start; \}/);
});
