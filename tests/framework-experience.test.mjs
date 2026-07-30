import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { architectureById } from "../src/content/frameworkModel.js";
import { frameworkLayouts } from "../src/generated/frameworkLayouts.js";
import { DIGITAL_IMPLEMENTATION_VIEW, FRAMEWORK_BASE_PATH, FRAMEWORK_OVERVIEW_VIEW, frameworkViewPath, resolveFrameworkView } from "../src/components/framework/frameworkView.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const explorer = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const runtime = await readFile(new URL("../src/components/framework/FrameworkGraphRuntime.jsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const presentation = await readFile(new URL("../src/components/business-observations/BusinessObservationPresentation.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/framework.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

const overview = architectureById.get("enterprise-operation");
const digital = architectureById.get("digital-implementation");

test("the enterprise framework keeps one canonical route with lazy legacy compatibility", () => {
  assert.match(app, /const BusinessObservationsPage = lazy\(\(\) => import\("\.\/pages\/BusinessObservationsPage"\)/);
  assert.match(app, /if \(pathname === FRAMEWORK_BASE\) return <BusinessObservationsPage \/>/);
  assert.match(app, /"\/works\/enterprise-operating-framework": "\/business-observations"/);
  assert.match(page, /BusinessObservationPresentation/);
  assert.match(page, /headingLevel=\{1\}/);
  assert.match(presentation, /const FrameworkExplorer = lazy\(\(\) => import\("\.\.\/framework\/FrameworkExplorer"\)/);
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
  assert.doesNotMatch(explorer, /definition:|role:|label:/);
});

test("overview drilldown, local selection, return focus and reset retain the established path", () => {
  assert.match(explorer, /const drilldown = activeViewId === FRAMEWORK_OVERVIEW_VIEW && node\.id === drilldownNodeId/);
  assert.match(explorer, /onActivate: drilldown \? enterDigitalImplementation : \(\) => selectNode\(node\.id\)/);
  assert.match(explorer, /navigate\(frameworkViewPath\(DIGITAL_IMPLEMENTATION_VIEW\), \{ scroll: false \}\)/);
  assert.match(explorer, /replace: true/);
  assert.match(explorer, /frameworkReturnFocus: true/);
  assert.match(explorer, /setSelectedId\(isExplicitReturn \? drilldownNodeId : activeArchitecture\.defaultNodeId\)/);
  assert.match(explorer, /returnNodeRef\.current\?\.focus\(\)/);
  assert.match(explorer, /返回总览/);
  assert.match(explorer, /复位视图/);
});

test("React Flow remains a read-only reader runtime", () => {
  for (const contract of [
    /<Handle type="target"/,
    /<Handle type="source"/,
    /nodesDraggable=\{false\}/,
    /nodesConnectable=\{false\}/,
    /elementsSelectable=\{false\}/,
    /nodesFocusable=\{false\}/,
    /edgesFocusable=\{false\}/,
    /disableKeyboardA11y/,
    /deleteKeyCode=\{null\}/,
    /onNodeClick=\{\(_, node\) => node\.data\.onActivate\(\)\}/,
    /zoomOnScroll=\{false\}/,
    /zoomOnPinch=\{false\}/,
    /zoomOnDoubleClick=\{false\}/,
    /proOptions=\{\{ hideAttribution: true \}\}/,
  ]) assert.match(runtime, contract);
  assert.doesNotMatch(runtime, /MiniMap|Controls|onNodesChange|onEdgesChange|onConnect/);
  assert.match(runtime, /data\.active && data\.label/);
  assert.match(runtime, /role="region"/);
  assert.match(runtime, /aria-label=\{ariaLabel\}/);
  assert.match(runtime, /只读业务架构节点。节点不可移动、删除或连接。/);
});

test("preview and persistent selection preserve authoritative explanation and accessible feedback", () => {
  assert.match(runtime, /onMouseEnter=\{\(\) => data\.onPreview\(data\.id\)\}/);
  assert.match(runtime, /onFocus=\{\(\) => data\.onPreview\(data\.id\)\}/);
  assert.match(runtime, /aria-pressed=\{data\.selected\}/);
  assert.match(runtime, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(explorer, /const activeNodeId = previewId \?\? selectedNode\.id/);
  assert.match(explorer, /architecture\.edges\.filter/);
  assert.match(explorer, /aria-live="polite"/);
  assert.match(explorer, /已选择\$\{node\.name\}，下方说明已更新/);
  assert.match(explorer, /prefers-reduced-motion: reduce/);
});

test("framework projections advance the explanation hierarchy from their own root heading", () => {
  assert.match(page, /BusinessObservationPresentation[\s\S]*headingLevel=\{1\}/);
  assert.match(home, /BusinessObservationPresentation[\s\S]*headingLevel=\{2\}/);
  assert.match(presentation, /descriptionHeadingLevel=\{headingLevel \+ 1\}/);
  assert.match(explorer, /const Subheading = `h\$\{headingLevel \+ 1\}`/);
  for (const label of ["定义", "作用", "直接关系"]) assert.match(explorer, new RegExp(`<Subheading>${label}</Subheading>`));
});

test("desktop and mobile use generated layouts with natural mobile page scrolling", () => {
  for (const architecture of [overview, digital]) {
    for (const projection of ["desktop", "mobile"]) {
      const layout = frameworkLayouts[architecture.id][projection];
      assert.equal(Object.keys(layout.nodes).length, architecture.nodes.length);
      assert.equal(Object.keys(layout.edges).length, architecture.edges.length);
    }
  }
  assert.match(explorer, /frameworkLayouts\[activeArchitecture\.id\]\?\.\[projection\]/);
  assert.match(runtime, /panOnDrag=\{projection === "desktop"\}/);
  assert.match(runtime, /preventScrolling=\{false\}/);
  assert.match(styles, /\.graph-canvas\[data-projection="mobile"\][\s\S]*touch-action: pan-y/);
  assert.doesNotMatch(styles, /data-mobile-world|--graph-pan|overflow-y:\s*(auto|scroll)/);
});

test("missing or invalid generated geometry falls back to same-source text", () => {
  assert.match(explorer, /function usableLayout/);
  assert.match(explorer, /FrameworkTextFallback/);
  assert.match(explorer, /架构图暂不可用，以下为同源节点与直接关系。/);
  assert.match(explorer, /architecture\.nodes\.map/);
  assert.doesNotMatch(explorer, /catch[\s\S]*return null/);
});

test("no-JavaScript fallback retains the overview explanation", () => {
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /一家企业如何持续创造价值、形成经营结果并调整自身？/);
  assert.doesNotMatch(html, /如何把战略和经营目标转化为可执行、可度量的业务设计？/);
});
