import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { observations } from "../src/content/siteContent.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("observation formats have the expected reading contract", () => {
  const analysis = observations.find((item) => item.format === "analysis");
  const brief = observations.find((item) => item.format === "brief");

  assert.ok(analysis);
  assert.ok(analysis.discussionQuestion);
  assert.ok(analysis.sections.length > 2);
  assert.ok(brief);
  assert.equal(brief.discussionQuestion, undefined);
  assert.ok(brief.sections.length <= 2);
});

test("pages use shared reading-path components", () => {
  for (const component of [
    "SectionIntro",
    "ObservationFeature",
    "ObservationRow",
    "ObservationMeta",
    "ArticleHeader",
    "ArticleToc",
    "WorkSummary",
  ]) {
    assert.match(app, new RegExp(`function ${component}\\(`));
  }
});

test("mobile article toc is collapsible and brand colors stay global", () => {
  assert.match(app, /<details className="mobile-toc">/);
  assert.match(styles, /\.mobile-toc \{ display: none;/);
  assert.match(styles, /\.mobile-toc \{ display: block;/);

  const responsiveStyles = styles.slice(styles.indexOf("@media"));
  for (const token of ["--paper:", "--paper-deep:", "--ink:", "--line:", "--accent:"]) {
    assert.equal(responsiveStyles.includes(token), false);
  }
});
