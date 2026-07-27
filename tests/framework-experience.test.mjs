import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { architectureById } from "../src/content/frameworkModel.js";
import { clampGraphPan, validateGraphGeometry } from "../src/components/framework/frameworkGeometry.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const explorer = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/framework.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("the enterprise framework has one public overview route with legacy compatibility", () => {
  assert.match(app, /if \(pathname === FRAMEWORK_BASE\) return <FrameworkPage \/>/);
  assert.match(app, /"\/works\/enterprise-operating-framework": FRAMEWORK_BASE/);
  assert.match(page, /<FrameworkExplorer \/>/);
  assert.match(page, /PositioningStrip/);
  assert.doesNotMatch(page, /WORK · ENTERPRISE SYSTEMS|如何阅读|来源与版本|career/);
});

test("the explorer consumes only the overview while reserving controlled view state", () => {
  assert.match(explorer, /architectureById\.get\("enterprise-operation"\)/);
  assert.match(explorer, /const \[activeViewId\] = useState\("overview"\)/);
  assert.match(explorer, /viewportTransform/);
  assert.match(explorer, /onPointerDown=\{pointerDown\}/);
  assert.match(explorer, /复位视图/);
  assert.doesNotMatch(explorer, /architectures\.map/);
  assert.doesNotMatch(explorer, /href=/);
});

test("hover, focus, click and keyboard maintain a stable selected explanation", () => {
  for (const contract of [
    /onMouseEnter=\{\(\) => onPreview/,
    /onFocus=\{\(\) => onPreview/,
    /aria-pressed=\{selected\}/,
    /event\.key === "Enter" \|\| event\.key === " "/,
    /aria-live="polite"/,
    /const activeNodeId = previewId \?\? selectedId/,
    /framework-explanation/,
  ]) assert.match(explorer, contract);
});

test("the overview has real arrows, a 16:10 canvas, and geometry contracts", () => {
  assert.match(explorer, /markerEnd=\{`url/);
  assert.match(explorer, /isLabelSafe\(overview, edge\)/);
  assert.match(styles, /aspect-ratio: var\(--media-ratio\)/);
  assert.match(styles, /\.graph-canvas \{[\s\S]*overflow: hidden/);
  assert.deepEqual(validateGraphGeometry(architectureById.get("enterprise-operation")), []);
});

test("canvas pan stays within bounded context while reset restores the default", () => {
  assert.match(explorer, /clampGraphPan/);
  assert.match(explorer, /setViewportTransform\(\{ x: 0, y: 0 \}\)/);
  assert.deepEqual(clampGraphPan({ x: 1000, y: -1000 }, { width: 940, height: 588 }), { x: 72, y: -47 });
});

test("no-JavaScript fallback retains the single overview explanation", () => {
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /一家企业如何持续创造价值、形成经营结果并调整自身？/);
  assert.doesNotMatch(html, /如何把战略和经营目标转化为可执行、可度量的业务设计？/);
});
