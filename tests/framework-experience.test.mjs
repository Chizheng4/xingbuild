import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { architectureById } from "../src/content/frameworkModel.js";
import { clampGraphPan, validateGraphGeometry } from "../src/components/framework/frameworkGeometry.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const explorer = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const presentation = await readFile(new URL("../src/components/business-observations/BusinessObservationPresentation.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/framework.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("the enterprise framework has one public overview route with legacy compatibility", () => {
  assert.match(app, /if \(pathname === FRAMEWORK_BASE\) return <FrameworkPage \/>/);
  assert.match(app, /"\/works\/enterprise-operating-framework": "\/business-observations"/);
  assert.match(page, /BusinessObservationPresentation/);
  assert.match(page, /headingLevel=\{1\}/);
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
    /framework-description/,
  ]) assert.match(explorer, contract);
});

test("framework explanation uses one source-driven heading level and a mobile current-node state", () => {
  assert.match(explorer, /descriptionHeadingLevel/);
  assert.match(explorer, /framework-description__status/);
  assert.match(styles, /framework-description__status \{ display: none;/);
  assert.match(styles, /@media \(max-width: 58\.25rem\)[\s\S]*framework-description__status/);
  assert.match(styles, /background: var\(--color-observation-surface\)/);
});

test("framework projections advance the explanation hierarchy from their own root heading", () => {
  assert.match(page, /BusinessObservationPresentation[\s\S]*headingLevel=\{1\}/);
  assert.match(home, /BusinessObservationPresentation[\s\S]*headingLevel=\{2\}/);
  assert.match(presentation, /descriptionHeadingLevel=\{headingLevel \+ 1\}/);
  assert.match(explorer, /const Subheading = `h\$\{headingLevel \+ 1\}`/);
  for (const label of ["定义", "作用", "直接关系"]) {
    assert.match(explorer, new RegExp(`<Subheading>${label}</Subheading>`));
  }
  assert.match(styles, /\.framework-description > :is\(h2, h3\)/);
  assert.match(styles, /\.framework-description__body :is\(h3, h4\)/);
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
