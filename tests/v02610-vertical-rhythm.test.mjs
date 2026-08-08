import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const home = await readFile(new URL("../src/components/page-compositions/HomeProductProjection.jsx", import.meta.url), "utf8");
const products = await readFile(new URL("../src/components/page-compositions/ProductsShowcase.jsx", import.meta.url), "utf8");

test("v0.26.10 uses fixed semantic showcase rhythm and home/business flow owners", () => {
  assert.match(tokens, /--showcase-module-gap: 6rem;/);
  assert.match(tokens, /--showcase-module-gap-mobile: 3\.5rem;/);
  assert.match(tokens, /--rhythm-home-focus: 4rem;/);
  assert.match(tokens, /--rhythm-home-focus-mobile: 2\.5rem;/);
  assert.match(tokens, /--rhythm-business-heading-content: 4rem;/);
  assert.match(tokens, /--rhythm-business-heading-content-mobile: 3rem;/);
  assert.doesNotMatch(pages, /100vh/);
  assert.match(pages, /\.page-composition--home \{ gap: 0; padding-block-start: var\(--rhythm-home-focus\); \}/);
  assert.match(pages, /\.home-page__actions-align \{[^}]*margin-inline: auto; justify-content: center; \}/);
  assert.match(pages, /\.home-page__actions-align \{ margin-bottom: var\(--rhythm-home-action-product\); \}/);
  assert.match(pages, /\.framework-page \{ gap: 0; \}/);
  assert.match(pages, /\.framework-page \.business-observations-column-heading \{ margin-bottom: var\(--rhythm-relate\); \}/);
  assert.match(components, /\.closing-action, \.resume-actions \{[\s\S]*margin-top: var\(--showcase-module-gap\);/);
  assert.match(components, /\.latest-update-card \{[\s\S]*height: 2\.5rem;[\s\S]*padding: 0\.5rem 1rem;/);
});

test("v0.26.10 keeps Home and Products composition lifecycles independent", () => {
  assert.match(home, /Home owns its product-section label, hero semantics, actions and closing/);
  assert.match(products, /Products owns its release card, hero actions, module flow and closing/);
  assert.doesNotMatch(home, /ShowcaseFlow/);
  assert.doesNotMatch(products, /ShowcaseFlow/);
});
