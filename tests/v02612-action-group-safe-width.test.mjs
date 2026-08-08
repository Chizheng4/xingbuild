import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const actionGroup = await readFile(new URL("../src/components/site/ActionGroup.jsx", import.meta.url), "utf8");

test("v0.26.12 gives equal ActionGroups a shared inline-size safe rail", () => {
  assert.match(tokens, /--action-label-narrow-safe: 0\.734375rem;/);
  assert.match(tokens, /--action-group-safe-breakpoint: 17\.5rem;/);
  assert.match(components, /\.action-group--equal \{[\s\S]*container: action-group \/ inline-size;/);
  assert.match(components, /@container action-group \(max-width: 17\.5rem\)/);
  assert.match(components, /\.action-group--equal \.action-group__action \{ font-size: var\(--action-label-narrow-safe\); \}/);
  assert.doesNotMatch(components, /\.home-page[^\n]*action-group[^\n]*font-size/);
  assert.doesNotMatch(components, /\.products-showcase[^\n]*action-group[^\n]*font-size/);
  assert.match(actionGroup, /equalWidth \? "action-group--equal"/);
});

test("v0.26.12 preserves the shared equal-width action contract", () => {
  assert.match(components, /grid-template-columns: repeat\(var\(--action-count\), minmax\(0, 1fr\)\)/);
  assert.match(components, /\.action-group--equal \.action-group__action \{ min-width: 0; \}/);
  assert.match(components, /white-space: nowrap/);
});
