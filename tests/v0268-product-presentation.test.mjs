import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const home = await readFile(new URL("../src/components/page-compositions/HomeProductProjection.jsx", import.meta.url), "utf8");
const products = await readFile(new URL("../src/components/page-compositions/ProductsShowcase.jsx", import.meta.url), "utf8");
const primitives = await readFile(new URL("../src/components/practice/PracticePrimitives.jsx", import.meta.url), "utf8");
const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const homePage = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");

test("Home owns the H-02 label anchor while its ProductHero remains centered", () => {
  assert.match(home, /eyebrow="最新作品" eyebrowAlign="start"/);
  assert.match(home, /<ProductHero practice=\{practice\} headingLevel=\{2\} headingId="home-product-title"/);
  assert.doesNotMatch(home, /product-hero--start|home-product-section__section-label/);
  assert.match(renderer, /aria-labelledby="home-product-title"/);
  assert.match(homePage, /aria-labelledby="home-product-title"/);
  assert.match(primitives, /eyebrowAlign = "center"/);
  assert.match(primitives, /product-hero__eyebrow--start/);
  assert.match(components, /\.product-hero__eyebrow--start \{ justify-self: start; text-align: start; \}/);
  assert.match(pages, /\.home-product-section \{ gap: var\(--space-1\); \}/);
});

test("Home and Products own independent closing projections and copy", () => {
  assert.match(home, /function projectHomeClosingAction\(\)/);
  assert.match(home, /title: "查看我的最新作品"/);
  assert.match(home, /它将经营规划、需求、供给、运营调度、订单、履约、指标、经营反馈连接成可运行可学习经营闭环/);
  assert.match(home, /robotaxiProductConfiguration\.productAction/);
  assert.match(home, /<ClosingAction closing=\{projectHomeClosingAction\(\)\}/);

  assert.match(products, /function projectProductsClosingAction\(\)/);
  assert.match(products, /robotaxiProductConfiguration\.closing/);
  assert.match(products, /<ClosingAction closing=\{projectProductsClosingAction\(\)\}/);
  assert.doesNotMatch(products, /查看我的最新作品|可运行可学习经营闭环/);

  assert.doesNotMatch(primitives, /projectClosingAction/);
  assert.doesNotMatch(home, /projectClosingAction/);
  assert.doesNotMatch(products, /projectClosingAction/);
});

test("both closing projections retain the registered safe Robotaxi action without defaults", () => {
  const configuration = home + products;
  assert.match(configuration, /robotaxiProductConfiguration\.productAction/);
  assert.match(configuration, /robotaxiProductConfiguration\.closing/);
  assert.doesNotMatch(home, /继续进入/);
  assert.doesNotMatch(products, /继续进入/);
});
