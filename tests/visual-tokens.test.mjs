import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const header = await readFile(new URL("../src/components/site/SiteHeader.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const practice = await readFile(new URL("../src/components/practice/PracticePage.jsx", import.meta.url), "utf8");
const framework = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const brief = await readFile(new URL("../src/components/observations/Briefs.jsx", import.meta.url), "utf8");

test("v0.13 uses one shell, showcase geometry, reading width and sticky compact header", () => {
  for (const token of ["--site-max: 80rem", "--rail-width: 19rem", "--two-column-gap: 1.5rem", "--two-column-main: 59.5rem", "--showcase-description-width: 13rem", "--showcase-gap: 1.25rem", "--measure-reading: 46rem", "--header-height: 3.5rem", "--header-height-mobile: 3.25rem"]) assert.match(tokens, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(layout, /position: sticky/);
  assert.match(layout, /grid-template-columns: var\(--showcase-description-width\)/);
  assert.match(layout, /showcase-layout__stage \{ order: -1/);
  assert.doesNotMatch(layout, /prefers-color-scheme/);
});

test("navigation and home project the approved IA without a fourth primary item", () => {
  for (const label of ["B端产品", "经营观察", "关于我"]) assert.match(header, new RegExp(label));
  assert.doesNotMatch(header, /label: "观察"/);
  for (const path of ["/products", "/business-observations", "/observations", "/about"]) assert.match(app, new RegExp(path.replace("/", "\\/")));
  assert.match(home, /site\.homeTitle/);
  assert.match(home, /PracticePresentation/);
  assert.match(home, /FrameworkExplorer/);
});

test("showcase and observation components preserve data-driven reader anatomy", () => {
  assert.match(practice, /ShowcaseLayout/);
  assert.match(practice, /SystemStage/);
  assert.doesNotMatch(practice, /loopRelation \?/);
  assert.match(framework, /FrameworkDescription/);
  assert.doesNotMatch(framework, /ExplanationPanel/);
  assert.match(brief, /brief-item__identity/);
  assert.match(brief, /brief-item__dimension/);
  assert.match(brief, /brief-item__sources/);
  assert.match(pages, /home-page__positioning/);
});
