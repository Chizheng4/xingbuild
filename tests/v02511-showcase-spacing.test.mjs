import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("../src/components/showcase/ShowcaseModule.jsx", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const geometryQa = await readFile(new URL("../scripts/qa-v02511-showcase-spacing.mjs", import.meta.url), "utf8");

test("v0.25.11 assigns Showcase spacing to one owner", () => {
  assert.match(component, /className="showcase-module"/);
  assert.doesNotMatch(component, /practice-module/);
  assert.match(components, /\.showcase-module \{[\s\S]*gap: var\(--showcase-gap\)/);
  assert.doesNotMatch(components, /\.showcase-module \+ \.showcase-module/);
  assert.match(pages, /\.practice-module-list \{ display: grid; gap: var\(--showcase-module-gap\);/);
  assert.match(pages, /\.practice-module-list \{ gap: var\(--showcase-module-gap-mobile\);/);
  assert.doesNotMatch(pages, /\.practice-module(?:[ .{])/);
  assert.match(tokens, /--showcase-module-gap: clamp\(6rem, 6vw, 7\.5rem\)/);
  assert.match(tokens, /--showcase-module-gap-mobile: clamp\(3\.5rem, 8vw, 4\.5rem\)/);
});

test("computed geometry QA asserts the four v0.25.11 spacing ranges", () => {
  assert.match(geometryQa, /getBoundingClientRect\(\)/);
  assert.match(geometryQa, /copy→media/);
  assert.match(geometryQa, /moduleMin: 96, moduleMax: 120/);
  assert.match(geometryQa, /moduleMin: 56, moduleMax: 72/);
  assert.match(geometryQa, /copyMin: 48, copyMax: 48/);
  assert.match(geometryQa, /copyMin: 20, copyMax: 24/);
});
