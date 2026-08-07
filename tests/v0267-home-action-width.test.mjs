import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const legacyHome = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const actionGroup = await readFile(new URL("../src/components/site/ActionGroup.jsx", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("v0.26.7 keeps Home alignment separate from shared ActionGroup sizing", () => {
  for (const source of [renderer, legacyHome]) {
    assert.match(source, /<div className="home-page__actions-align">[\s\S]*<ActionGroup className="home-page__actions"[^>]*equalWidth \/>[\s\S]*<\/div>/);
  }
  assert.match(actionGroup, /equalWidth \? "action-group--equal"/);
  assert.match(components, /\.action-group--equal \{[\s\S]*width: min\(100%, var\(--measure-action-group\)\);/);
  assert.match(pages, /\.home-page__actions-align \{ display: flex; width: min\(100%, var\(--measure-product-hero\)\); margin-inline: auto; justify-content: center;/);
  assert.doesNotMatch(pages, /\.home-page__actions \{ width: min\(100%, var\(--measure-product-hero\)/);
});

test("v0.26.7 preserves the independent Products ActionGroup contract", () => {
  assert.match(actionGroup, /<div[\s\S]*className=\{classes\}[\s\S]*data-action-count/);
  assert.match(components, /\.action-group--equal \.action-group__action \{ min-width: 0; \}/);
  assert.doesNotMatch(pages, /\.products-showcase[^\n]*\.home-page__actions/);
});
