import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { observations } from "../src/content/siteContent.js";

const article = await readFile(new URL("../src/components/reading/Article.jsx", import.meta.url), "utf8");
const header = await readFile(new URL("../src/components/site/SiteHeader.jsx", import.meta.url), "utf8");
const footer = await readFile(new URL("../src/components/site/SiteFooter.jsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("observation formats have the expected reading contract", () => {
  const analysis = observations.find((item) => item.format === "analysis");
  const brief = observations.find((item) => item.format === "brief");
  assert.ok(analysis?.discussionQuestion);
  assert.ok(analysis.sections.length > 2);
  assert.ok(brief);
  assert.equal(brief.discussionQuestion, undefined);
  assert.ok(brief.sections.length <= 2);
});

test("long articles provide desktop and collapsible mobile navigation", () => {
  assert.match(article, /className="reading-toc desktop-toc"/);
  assert.match(article, /<details className="mobile-toc">/);
  assert.match(layout, /\.mobile-toc \{ display: none;/);
  assert.match(layout, /\.mobile-toc \{ display: block;/);
});

test("global chrome stays minimal and mobile navigation is a full viewport layer", () => {
  assert.match(header, /<List aria-hidden="true"/);
  assert.match(header, /<X aria-hidden="true"/);
  assert.match(header, /aria-label=\{menuOpen \? "关闭菜单" : "打开菜单"\}/);
  assert.doesNotMatch(header, /author-name|menu-author/);
  assert.doesNotMatch(footer, /updatedAt|location|author/);
  assert.match(components, /position: fixed;\s+inset: 0;/);
});
