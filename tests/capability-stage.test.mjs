import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CAPABILITY_KINDS,
  CAPABILITY_STATES,
  capabilityFixtures,
  validateCapabilityPresentation,
} from "../src/content/capabilityPresentation.js";

const host = await readFile(new URL("../src/components/capability/VisualizationHost.jsx", import.meta.url), "utf8");
const stage = await readFile(new URL("../src/components/capability/CapabilityStage.jsx", import.meta.url), "utf8");
const fixture = await readFile(new URL("../src/pages/CapabilityFixturePage.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/capability.css", import.meta.url), "utf8");

test("capability declarations are semantic and reject page geometry", () => {
  assert.deepEqual(CAPABILITY_KINDS, ["media", "architecture", "flow", "state", "lifecycle", "interactive-system"]);
  assert.deepEqual(CAPABILITY_STATES, ["idle", "active", "selected", "result", "error", "fallback"]);
  assert.equal(capabilityFixtures.every((entry) => validateCapabilityPresentation(entry, { allowFixture: true }).length === 0), true);
  const invalid = validateCapabilityPresentation({ id: "bad", kind: "media", mediaId: "m", alt: "x", width: 400, mobileSrc: "/x.svg" });
  assert.ok(invalid.some((error) => error.includes("forbidden geometry")));
});

test("one declaration is projected by a shared host and fixture only changes composition", () => {
  assert.match(host, /assertCapabilityPresentation/);
  assert.match(host, /data-state/);
  for (const state of ["active", "selected", "result", "error", "fallback"]) assert.match(host, new RegExp(state));
  assert.match(host, /<picture/);
  assert.match(host, /diagramFigureAssets/);
  assert.match(host, /onClick=\{activate\}/);
  assert.match(stage, /VisualizationHost/);
  assert.match(fixture, /SystemStage/);
  assert.match(fixture, /capabilityFixtures/);
  assert.match(app, /__fixtures__\/capability-stage/);
  assert.match(css, /visualization-host__viewport/);
  assert.match(css, /@media \(max-width: 32\.4375rem\)/);
  assert.doesNotMatch(css, /overflow-y:\s*(auto|scroll)/);
});

test("invalid source renders a readable fallback path instead of a success projection", () => {
  const missing = validateCapabilityPresentation({ id: "missing-source", kind: "architecture", alt: "图" });
  assert.ok(missing.some((error) => error.includes("requires sourcePath")));
  assert.match(host, /可读降级/);
  assert.match(host, /当前能力暂不可用/);
});
