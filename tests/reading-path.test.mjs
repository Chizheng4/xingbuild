import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readPublishedObservations } from "../scripts/lib/observation-content.mjs";

const observations = await readPublishedObservations();
const article = await readFile(new URL("../src/components/reading/Article.jsx", import.meta.url), "utf8");
const header = await readFile(new URL("../src/components/site/SiteHeader.jsx", import.meta.url), "utf8");
const footer = await readFile(new URL("../src/components/site/SiteFooter.jsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("article presentation has one reader-facing title and no governance projection", () => {
  const deep = observations.find((item) => item.level === "deep");
  assert.ok(deep);
  assert.match(article, /article-dimensions/);
  assert.match(article, /sourceRefs/);
  assert.doesNotMatch(article, /claim-kind|fact-overview|evidence-and-boundary|ArticleToc|reading-toc|rangeAndFacts|operatingImpact/);
});

test("article sources remain a final inline reader line", () => {
  assert.match(article, /className="article-sources"/);
  assert.doesNotMatch(article, /<ol className="source-list"/);
  assert.doesNotMatch(article, /访问于/);
});

test("global chrome stays minimal and mobile navigation is a full viewport layer", () => {
  assert.match(header, /<List aria-hidden="true"/);
  assert.match(header, /<X aria-hidden="true"/);
  assert.match(header, /aria-label=\{menuOpen \? "关闭菜单" : "打开菜单"\}/);
  assert.match(header, /identity-lockup/);
  assert.match(header, /author-lockup/);
  assert.doesNotMatch(footer, /updatedAt|location|author/);
  assert.match(components, /position: fixed;\s+inset: 0;/);
});
