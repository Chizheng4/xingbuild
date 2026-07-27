import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const foundations = await readFile(new URL("../src/styles/foundations.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const homePage = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const content = await readFile(new URL("../src/content/siteContent.js", import.meta.url), "utf8");
const startCommand = await readFile(new URL("../start-xingbuild.command", import.meta.url), "utf8");
const pageStructure = await readFile(new URL("../src/components/site/PageStructure.jsx", import.meta.url), "utf8");
const observations = await readFile(new URL("../src/components/content/Observations.jsx", import.meta.url), "utf8");
const works = await readFile(new URL("../src/components/works/Works.jsx", import.meta.url), "utf8");
const aboutPage = await readFile(new URL("../src/pages/AboutPage.jsx", import.meta.url), "utf8");
const workPage = await readFile(new URL("../src/pages/WorkPage.jsx", import.meta.url), "utf8");
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

test("Chinese semantic titles use native phrase-aware wrapping", () => {
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(
    foundations,
    /\.home-hero h1,[\s\S]*\.article-header h1[\s\S]*word-break: auto-phrase;[\s\S]*text-wrap: balance;/,
  );
  assert.match(
    foundations,
    /\.section-intro h2,[\s\S]*\.work-summary h3,[\s\S]*word-break: auto-phrase;[\s\S]*text-wrap: pretty;/,
  );
  assert.doesNotMatch(allStyles, /word-break:\s*(?:break-all|keep-all)/);
  assert.match(homePage, /构\\u2060建/);
  assert.match(content, /企\\u2060业\\u2060数\\u2060字\\u2060化，需要同\\u2060时/);
  assert.doesNotMatch(homePage, /<br\s*\/?>/);
});

test("reading flow assigns each adjacent relationship one semantic spacing owner", () => {
  assert.match(components, /\.prose section \{[\s\S]*display: flow-root;[\s\S]*margin: 0;/);
  assert.match(components, /\.prose section \+ section,[\s\S]*margin-top: var\(--rhythm-group\)/);
  assert.match(components, /\.prose h2 \{[\s\S]*margin: 0 0 var\(--rhythm-relate\)/);
  assert.match(components, /\.prose p \{[\s\S]*margin: 0;/);
  assert.match(components, /\.prose p \+ p \{ margin-top: var\(--rhythm-relate\); \}/);
  assert.match(components, /\.article-summary \{[\s\S]*margin: 0;/);
});

test("visual hierarchy uses semantic relationship tokens and parent-owned flows", () => {
  for (const token of [
    "--rhythm-bind", "--rhythm-relate", "--rhythm-object",
    "--rhythm-group", "--rhythm-section",
  ]) assert.ok(tokens.includes(token), `${token} must exist`);
  assert.match(layout, /\.page-stack \{ gap: var\(--rhythm-section\); \}/);
  assert.match(layout, /\.section-flow \{ gap: var\(--rhythm-object\); \}/);
  assert.match(layout, /\.collection-flow \{ gap: var\(--rhythm-group\); \}/);
  assert.match(layout, /\.object-stack \{ gap: var\(--rhythm-relate\); \}/);
  assert.doesNotMatch(layout, /\.object-stack \{ gap: var\(--rhythm-object\); \}/);
  assert.match(homePage, /home-page page-stack/);
  assert.match(homePage, /home-section home-observations section-flow/);
  assert.match(pageStructure, /section-intro__copy/);
  assert.match(observations, /content-object object-stack/);
  assert.match(observations, /object-identity/);
  assert.match(observations, /object-proposition/);
  assert.match(observations, /object-evidence/);
  assert.match(observations, /object-action/);
  assert.match(works, /work-summary-copy object-stack/);
  assert.match(works, /work-evidence object-evidence/);
  assert.doesNotMatch(pages, /\.home-section\s*\{[^}]*padding-block/);
});

test("visible numbers keep semantic meaning instead of simulating structure", () => {
  assert.doesNotMatch(homePage, /eyebrow="0[12]"/);
  assert.doesNotMatch(content, /\bindex:\s*"0[12]"/);
  assert.doesNotMatch(works, /work-index|work\.index/);
  assert.doesNotMatch(workPage, /padStart|map\(\(section,\s*index\)/);
  assert.doesNotMatch(aboutPage, /padStart|map\(\(item,\s*index\)/);
  assert.match(aboutPage, /<ul>[\s\S]*profile\.problems/);
  assert.match(works, /ArchitectureDiagram[\s\S]*padStart\(2, "0"\)/);
  assert.doesNotMatch(allStyles, /--rail-index|\.work-index\b/);
});

test("local startup reuses a healthy service and never drifts from port 4317", () => {
  assert.match(startCommand, /LOCAL_URL="http:\/\/127\.0\.0\.1:4317\/"/);
  assert.match(startCommand, /ONLINE_URL="https:\/\/xingbuild\.top\/"/);
  assert.match(startCommand, /curl --noproxy "\*"[\s\S]*open "\$\{LOCAL_URL\}"/);
  assert.match(startCommand, /lsof -nP -iTCP:4317 -sTCP:LISTEN/);
  assert.match(startCommand, /--port 4317 --strictPort --open \/ <\/dev\/null/);
  assert.doesNotMatch(startCommand, /(?:^|\n)\s*(?:echo\s+)?["']?h["']?\s*(?:\n|$)/);
});
