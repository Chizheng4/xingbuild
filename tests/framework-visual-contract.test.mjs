import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtime = await readFile(new URL("../src/components/framework/FrameworkGraphRuntime.jsx", import.meta.url), "utf8");
const explorer = await readFile(new URL("../src/components/framework/FrameworkExplorer.jsx", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

test("relationship paths use inline visual values that cannot be reset by React Flow stylesheet order", () => {
  assert.match(runtime, /const edgeStyle = \{/);
  assert.match(runtime, /stroke: data\.active \? "var\(--color-accent-strong\)" : "var\(--color-architecture-edge\)"/);
  assert.match(runtime, /strokeWidth: data\.active \? 2\.15 : 1\.7/);
  assert.match(runtime, /opacity: data\.active \? 1 : 0\.96/);
  assert.match(runtime, /style=\{edgeStyle\}/);
});

test("relationship arrows use the same default and selected visual hierarchy", () => {
  assert.match(explorer, /width: 16/);
  assert.match(explorer, /height: 16/);
  assert.match(explorer, /color: active \? "var\(--color-accent-strong\)" : "var\(--color-architecture-edge\)"/);
  assert.match(tokens, /--color-architecture-edge: #60564b/);
});
