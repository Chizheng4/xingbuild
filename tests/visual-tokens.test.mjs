import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const foundations = await readFile(new URL("../src/styles/foundations.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const allStyles = [tokens, foundations, layout, components, pages].join("\n");

test("root stylesheet imports local fonts and visual responsibility layers", () => {
  for (const dependency of [
    "@fontsource-variable/noto-serif-sc",
    "@fontsource-variable/noto-sans-sc",
    "./styles/tokens.css",
    "./styles/foundations.css",
    "./styles/layout.css",
    "./styles/components.css",
    "./styles/pages.css",
  ]) assert.match(root, new RegExp(dependency.replace(/[./-]/g, "\\$&")));
});

test("semantic brand tokens are global and immutable across breakpoints", () => {
  const names = [
    "--color-canvas", "--color-surface-subtle", "--color-text",
    "--color-text-muted", "--color-border", "--color-accent", "--color-accent-strong",
  ];
  for (const name of names) {
    assert.equal((allStyles.match(new RegExp(`${name}:`, "g")) || []).length, 1);
    assert.equal(allStyles.slice(allStyles.indexOf("@media")).includes(`${name}:`), false);
  }
  assert.doesNotMatch(allStyles, /prefers-color-scheme/);
});

test("font roles, readable minimums, containers and content breakpoints are explicit", () => {
  for (const token of [
    "--font-display", "--font-reading", "--font-ui", "--font-meta", "--font-wordmark",
    "--type-reading", "--type-meta", "--type-caption", "--type-hero-summary", "--type-wordmark",
    "--measure-page: 80rem", "--measure-content: 65rem", "--measure-reading: 45rem",
    "--measure-display: 58.75rem", "--space-hero-start", "--space-content-entry",
  ]) assert.ok(tokens.includes(token), `${token} must exist`);
  for (const breakpoint of ["74.9375rem", "56.1875rem", "32.4375rem"]) {
    assert.ok(allStyles.includes(`max-width: ${breakpoint}`), `${breakpoint} breakpoint must exist`);
  }
  assert.match(components, /\.architecture small[\s\S]*var\(--type-meta\)/);
});

test("hero and explanation roles use semantic visual contracts", () => {
  assert.match(pages, /\.home-hero h1[\s\S]*var\(--measure-display\)/);
  assert.match(pages, /\.hero-description[\s\S]*var\(--type-hero-summary\)[\s\S]*var\(--font-ui\)/);
  assert.match(components, /\.section-intro__description[\s\S]*var\(--font-ui\)/);
  assert.match(components, /\.wordmark[\s\S]*text-transform: lowercase/);
  assert.doesNotMatch(pages, /\.home-hero h1 br/);
});
