import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const explorer = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/framework.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("stable framework routes and URL-selected state are implemented", () => {
  assert.match(app, /enterprise-operating-framework/);
  assert.match(app, /concepts/);
  assert.match(app, /applications/);
  assert.match(explorer, /query\.set\("concept", id\)/);
  assert.match(explorer, /aria-current=\{selected/);
});

test("hover, focus, click, Escape and status notification are equivalent", () => {
  assert.match(explorer, /onMouseEnter/);
  assert.match(explorer, /onFocus/);
  assert.match(explorer, /onClick/);
  assert.match(explorer, /event\.key === "Escape"/);
  assert.match(explorer, /aria-live="polite"/);
});

test("framework uses a content-driven 900px projection and safe mobile flow", () => {
  assert.match(styles, /max-width: 56\.1875rem/);
  assert.match(styles, /\.framework-explorer \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  assert.match(styles, /min-height: var\(--touch-target\)/);
  assert.doesNotMatch(styles, /overflow-x:\s*(?:auto|scroll)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("no-JavaScript fallback preserves the complete primary reading path", () => {
  assert.match(html, /<noscript>/);
  for (const text of ["企业经营体系总览", "数字化实现", "企业业务架构", "业务对象", "对象", "Robotaxi 应用"]) {
    assert.ok(html.includes(text));
  }
});
