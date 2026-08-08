import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");

test("v0.26.11 owns ordinary page entry spacing with a shared 48/32px token", () => {
  assert.match(tokens, /--space-content-entry: 3rem;/);
  assert.match(tokens, /@media \(max-width: 58\.25rem\) \{[\s\S]*--space-content-entry: 2rem;/);
  assert.match(layout, /\.layout-shell \{[^}]*padding-block: var\(--space-content-entry\) 0;/);
  assert.doesNotMatch(pages, /\.page-composition \{ padding-block-start: var\(--space-6\);/);
  assert.match(pages, /\.page-composition--home \{ padding-block-start: var\(--rhythm-home-focus-mobile\);/);
});

test("v0.26.11 removes duplicate ProductHero entry padding and uses the shared narrow action token", () => {
  assert.doesNotMatch(components, /\.product-hero \{ padding-block-start: var\(--space-8\);/);
  assert.match(components, /\.action-group__action \{ padding-inline: var\(--space-2\); font-size: var\(--action-label-narrow\); \}/);
  assert.match(tokens, /--action-label-narrow: 0\.78125rem;/);
});
