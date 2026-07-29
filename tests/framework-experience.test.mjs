import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { architectureById } from "../src/content/frameworkModel.js";
import { clampGraphPan, validateGraphGeometry } from "../src/components/framework/frameworkGeometry.js";
import { DIGITAL_IMPLEMENTATION_VIEW, FRAMEWORK_BASE_PATH, FRAMEWORK_OVERVIEW_VIEW, frameworkViewPath, resolveFrameworkView } from "../src/components/framework/frameworkView.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const explorer = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const presentation = await readFile(new URL("../src/components/business-observations/BusinessObservationPresentation.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/framework.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

const overview = architectureById.get("enterprise-operation");
const digital = architectureById.get("digital-implementation");

test("the enterprise framework keeps one public route with legacy compatibility", () => {
  assert.match(app, /if \(pathname === FRAMEWORK_BASE\) return <FrameworkPage \/>/);
  assert.match(app, /"\/works\/enterprise-operating-framework": "\/business-observations"/);
  assert.match(page, /BusinessObservationPresentation/);
  assert.match(page, /headingLevel=\{1\}/);
  assert.doesNotMatch(page, /WORK · ENTERPRISE SYSTEMS|如何阅读|来源与版本|career/);
});

test("the one local view has stable URL resolution and a single source model", () => {
  assert.equal(resolveFrameworkView(""), FRAMEWORK_OVERVIEW_VIEW);
  assert.equal(resolveFrameworkView("?view=digital-implementation"), DIGITAL_IMPLEMENTATION_VIEW);
  assert.equal(resolveFrameworkView("?view=unknown"), FRAMEWORK_OVERVIEW_VIEW);
  assert.equal(frameworkViewPath(FRAMEWORK_OVERVIEW_VIEW), FRAMEWORK_BASE_PATH);
  assert.equal(frameworkViewPath(DIGITAL_IMPLEMENTATION_VIEW), "/business-observations?view=digital-implementation");
  assert.equal(digital.nodes.length, 9);
  assert.equal(digital.edges.length, 13);
  assert.equal(digital.defaultNodeId, "b2b-product-architecture");
  assert.match(explorer, /architectureById\.get\("digital-implementation"\)/);
  assert.match(explorer, /const activeArchitecture = activeViewId === digitalImplementation\.id \? digitalImplementation : overview/);
  assert.doesNotMatch(explorer, /architectures\.map/);
});

test("overview drilldown enters immediately while local nodes retain selection semantics", () => {
  assert.match(explorer, /const isDrilldown = activeViewId === FRAMEWORK_OVERVIEW_VIEW && item\.id === drilldownNodeId/);
  assert.match(explorer, /if \(isDrilldown\) onEnterView\(\);/);
  assert.match(explorer, /进入数字化实现/);
  assert.match(explorer, /navigate\(frameworkViewPath\(DIGITAL_IMPLEMENTATION_VIEW\), \{ scroll: false \}\)/);
  assert.match(explorer, /replace: true/);
  assert.match(explorer, /frameworkReturnFocus: true/);
  assert.match(explorer, /setSelectedId\(isExplicitReturn \? drilldownNodeId : activeArchitecture\.defaultNodeId\)/);
  assert.match(explorer, /returnNodeRef\.current\?\.focus\(\)/);
  assert.match(explorer, /返回总览/);
  assert.match(explorer, /复位视图/);
});

test("only the canvas background owns pan pointer sessions", () => {
  assert.match(explorer, /event\.target\.closest\("\.graph-node, button, a, input, select, textarea"\)\) return;/);
  assert.match(explorer, /event\.currentTarget\.setPointerCapture\(event\.pointerId\)/);
  assert.match(explorer, /if \(start\.dragged\) \{[\s\S]*suppressClickRef\.current = true/);
  assert.match(explorer, /if \(!suppressClickRef\.current\) \{[\s\S]*if \(isDrilldown\) onEnterView\(\);/);
});

test("hover, focus, click and keyboard maintain an active-architecture explanation", () => {
  for (const contract of [
    /onMouseEnter=\{\(\) => onPreview/,
    /onFocus=\{\(\) => onPreview/,
    /aria-pressed=\{selected\}/,
    /event\.key === "Enter" \|\| event\.key === " "/,
    /aria-live="polite"/,
    /const activeNodeId = previewId \?\? selectedId/,
    /architecture\.edges\.filter/,
    /connectedEdgeIds\(architecture, activeNodeId\)/,
  ]) assert.match(explorer, contract);
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

test("overview and digital projections keep valid desktop and mobile geometry", () => {
  for (const architecture of [overview, digital]) {
    for (const projection of ["desktop", "mobile"]) assert.deepEqual(validateGraphGeometry(architecture, projection), []);
  }
  assert.match(explorer, /<GraphEdges architecture=\{activeArchitecture\}[\s\S]*projection="desktop"/);
  assert.match(explorer, /projection="mobile"/);
  assert.match(explorer, /architecture\.tracks\.map/);
  assert.match(explorer, /markerEnd=\{`url/);
  assert.match(styles, /aspect-ratio: var\(--media-ratio\)/);
  assert.match(styles, /\.graph-canvas \{[\s\S]*overflow: hidden/);
});

test("digital mobile pan uses world-height bounds while overview keeps its bounded context", () => {
  assert.deepEqual(clampGraphPan({ x: 1000, y: -1000 }, { width: 940, height: 588 }), { x: 72, y: -47 });
  const mobileClamp = clampGraphPan({ x: 1000, y: -1000 }, { width: 335, height: 520 }, digital, "mobile");
  assert.equal(mobileClamp.x, 0);
  assert.ok(Math.abs(mobileClamp.y + 446.7142857142857) < 0.000001);
  assert.match(styles, /data-mobile-world="true"/);
  assert.match(styles, /85\.7vw \+ 11\.6rem/);
});

test("no-JavaScript fallback retains the overview explanation", () => {
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /一家企业如何持续创造价值、形成经营结果并调整自身？/);
  assert.doesNotMatch(html, /如何把战略和经营目标转化为可执行、可度量的业务设计？/);
});
