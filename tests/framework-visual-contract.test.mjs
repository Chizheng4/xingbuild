import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const architectureExplorer = await readFile(new URL("../src/components/framework/ArchitectureExplorer.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/framework.css", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

test("digital relationship paths set the contracted visible default hierarchy", () => {
  assert.match(styles, /\.architecture-explorer__lines polyline \{[^}]*stroke:#4f4941;[^}]*stroke-width:1\.7/);
  assert.match(styles, /\.architecture-explorer__lines marker path \{ fill:#4f4941/);
  assert.match(styles, /g\.is-active polyline \{ stroke:var\(--color-accent-strong\); stroke-width:2\.15/);
  assert.match(styles, /marker#architecture-arrow-active path \{ fill:var\(--color-accent-strong\)/);
  assert.match(architectureExplorer, /markerEnd=\{`url\(#architecture-arrow\$\{active \? "-active" : ""\}\)`\}/);
});

test("relationship labels and arrows are rendered from the generated relationship set", () => {
  assert.match(architectureExplorer, /architecture\.edges\.map/);
  assert.match(architectureExplorer, /<polyline points=\{pointString\(route\.points\)\}/);
  assert.match(architectureExplorer, /<text x=\{route\.label\[0\]\} y=\{route\.label\[1\]\}>\{edge\.label\}<\/text>/);
  assert.match(tokens, /--color-architecture-edge: #60564b/);
});
