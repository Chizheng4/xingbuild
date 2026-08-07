import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/components/page-compositions/HomeProductProjection.jsx", import.meta.url), "utf8");
const products = await readFile(new URL("../src/components/page-compositions/ProductsShowcase.jsx", import.meta.url), "utf8");
const definitions = await readFile(new URL("../src/content/pageDefinitions.js", import.meta.url), "utf8");
const legacy = await readFile(new URL("../src/components/showcase/ShowcaseFlow.jsx", import.meta.url), "utf8");

test("Home and Products own separate page-level composition contracts", () => {
  assert.match(renderer, /HomeProductProjection/);
  assert.match(renderer, /ProductsShowcase/);
  assert.doesNotMatch(renderer, /ShowcaseFlow/);
  assert.doesNotMatch(home, /LatestUpdateCard|heroActions/);
  assert.match(home, /eyebrow="最新作品" eyebrowAlign="start"/);
  assert.match(home, /headingId="home-product-title"/);
  assert.match(products, /LatestUpdateCard|heroActions/);
  assert.doesNotMatch(products, /最新作品/);
  assert.doesNotMatch(definitions, /shared-content-projection|统一投影/);
  assert.doesNotMatch(legacy, /PracticePresentation|showClosing|sectionLabel|heroAlign/);
});

test("same Robotaxi object has separate structure and empty fallback branches", () => {
  assert.match(home, /if \(!practice\) return <EmptyHomeProduct \/>/);
  assert.match(products, /if \(!practice\) return <EmptyProductsShowcase \/>/);
  assert.match(home, /<ProductHero practice=\{practice\} headingLevel=\{2\}/);
  assert.match(products, /<ProductHero practice=\{practice\} headingLevel=\{1\}/);
  assert.match(home, /<PracticeModuleList modules=\{practice\.modules\} headingLevel=\{3\}/);
  assert.match(products, /<PracticeModuleList modules=\{practice\.modules\} headingLevel=\{2\}/);
});
