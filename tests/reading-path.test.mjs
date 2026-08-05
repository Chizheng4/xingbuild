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
  assert.match(article, /RichDocument/);
  assert.doesNotMatch(article, /<ol className="source-list"/);
  assert.doesNotMatch(article, /访问于/);
});

test("global chrome stays minimal and mobile navigation is a full viewport layer", () => {
  assert.match(header, /<List aria-hidden="true"/);
  assert.match(header, /<X aria-hidden="true"/);
  assert.match(header, /aria-label=\{menuOpen \? "关闭菜单" : "打开菜单"\}/);
  assert.match(header, /identity-lockup/);
  assert.doesNotMatch(header, /author-lockup/);
  assert.doesNotMatch(footer, /updatedAt|location|author/);
  assert.match(components, /position: fixed;\s+inset: 0;/);
});

test("one global shell keeps a normal-flow footer at the viewport or content end", () => {
  assert.match(layout, /\.site-shell\s*\{[\s\S]*?display: flex;[\s\S]*?flex-direction: column;/);
  assert.match(layout, /min-height: 100vh;[\s\S]*?min-height: 100dvh;/);
  assert.match(layout, /main\s*\{[^}]*flex: 1 0 auto;/);
  assert.match(layout, /\.site-footer\s*\{[\s\S]*?margin-top: var\(--rhythm-section\);/);
  assert.match(layout, /env\(safe-area-inset-bottom\)/);
  const footerRule = layout.match(/\.site-footer\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(footerRule, /position:\s*(?:fixed|absolute|sticky)/);
});

test("observation return context is safe, refreshable, and labelled from its real destination", async () => {
  const navigation = await readFile(new URL("../src/lib/navigation.jsx", import.meta.url), "utf8");
  const briefs = await readFile(new URL("../src/components/observations/Briefs.jsx", import.meta.url), "utf8");
  const collection = await readFile(new URL("../src/pages/ObservationsPage.jsx", import.meta.url), "utf8");
  const article = await readFile(new URL("../src/components/reading/Article.jsx", import.meta.url), "utf8");
  const returnNavigation = await readFile(new URL("../src/components/navigation/ReturnNavigation.jsx", import.meta.url), "utf8");
  assert.match(navigation, /value\.startsWith\("\/"\)/);
  assert.match(navigation, /value\.startsWith\("\/\/"\)/);
  assert.match(navigation, /return `返回\$\{returnDestinationFor\(href\)\}`/);
  assert.match(navigation, /return "B端产品"/);
  assert.match(navigation, /return "经营观察"/);
  assert.match(navigation, /`\/observations\?origin=\$\{encodeURIComponent\(safeOrigin\)\}`/);
  assert.match(briefs, /observationCollectionHref\(origin\)/);
  assert.match(collection, /safeReturnTo/);
  assert.match(collection, /<ReturnNavigation/);
  assert.match(article, /<ReturnNavigation/);
  assert.match(returnNavigation, /safeReturnTo/);
  assert.match(returnNavigation, /data-origin/);
  assert.match(returnNavigation, /data-return-to/);
  assert.match(returnNavigation, /← 返回\{destination\}/);
});
