import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const explorer = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/framework.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("the enterprise framework is one continuous public page", () => {
  assert.match(app, /parts\[1\] === "enterprise-operating-framework"\) return <FrameworkPage/);
  assert.match(app, /replaceState\(\{\}, "", FRAMEWORK_BASE\)/);
  assert.doesNotMatch(app, /FrameworkConceptPage|FrameworkApplicationPage/);
  assert.match(page, /认知企业经营体系/);
  assert.match(page, /<FrameworkExplorer \/>/);
  for (const removed of ["如何阅读", "来源与版本", "career", "当前视图"]) {
    assert.doesNotMatch(page, new RegExp(removed));
    assert.doesNotMatch(explorer, new RegExp(removed));
  }
});

test("hover and focus preview clickability while click owns stable selection", () => {
  assert.match(explorer, /onMouseEnter=\{\(\) => onPreview/);
  assert.match(explorer, /onFocus=\{\(\) => onPreview/);
  assert.match(explorer, /onClick=\{\(\) => onSelect/);
  assert.match(explorer, /aria-pressed=\{selected\}/);
  assert.match(explorer, /aria-live="polite"/);
  assert.match(explorer, /const activeNodeId = previewId \?\? selectedId/);
  assert.doesNotMatch(explorer, /navigate\(|href=/);
});

test("relation paths have arrows only at real edge targets and routing tracks have none", () => {
  assert.match(explorer, /className={`architecture-track/);
  assert.doesNotMatch(explorer, /architecture-track[\s\S]{0,160}markerEnd/);
  assert.match(explorer, /architecture\.edges\.map[\s\S]*markerEnd=/);
  assert.match(explorer, /data-edge-id=\{item\.id\}/);
});

test("desktop and mobile consume the same architecture data with distinct projections", () => {
  assert.match(explorer, /architectures\.map/);
  assert.match(explorer, /projection="desktop"/);
  assert.match(explorer, /projection="mobile"/);
  assert.match(styles, /max-width: 56\.1875rem/);
  assert.match(styles, /\.architecture-lines\.is-desktop[\s\S]*display: none/);
  assert.match(styles, /\.architecture-lines\.is-mobile[\s\S]*display: block/);
  assert.doesNotMatch(styles, /overflow-x:\s*(?:auto|scroll)/);
  assert.match(styles, /min-height: var\(--touch-target\)/);
});

test("no-JavaScript fallback preserves all four architecture questions", () => {
  assert.match(html, /<html lang="zh-CN">/);
  for (const text of [
    "一家企业如何持续创造价值、形成经营结果并调整自身？",
    "如何把战略和经营目标转化为可执行、可度量的业务设计？",
    "如何把业务设计转化为真正进入企业运作的产品、数据和系统？",
    "如何避免同一个业务词在不同讨论中混用，失去明确边界？",
  ]) assert.ok(html.includes(text), `${text} must remain readable without JavaScript`);
});
