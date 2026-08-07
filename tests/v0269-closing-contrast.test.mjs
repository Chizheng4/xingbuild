import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("v0.26.9 defines a semantic subtle-surface muted token without changing global muted", () => {
  assert.match(tokens, /--color-text-muted: #64748b;/);
  assert.match(tokens, /--color-text-muted-on-subtle: #526277;/);
});

test("ClosingAction summaries use the subtle-surface token while other muted text stays global", () => {
  assert.match(components, /\.closing-action p:not\(\.eyebrow\), \.resume-actions p:not\(\.eyebrow\) \{[\s\S]*color: var\(--color-text-muted-on-subtle\);/);
  assert.match(components, /\.showcase-module__copy > p:not\(\.showcase-module__label\) \{[\s\S]*color: var\(--color-text-muted\);/);
});
