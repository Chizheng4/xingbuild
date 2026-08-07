import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { projectPractice } from "../src/content/practiceRepository.js";
import { APPROVED_ROBOTAXI_MEDIA_ID, projectRobotaxiVisualQaFixture } from "../src/content/visualQaFixture.js";

const header = await readFile(new URL("../src/components/site/SiteHeader.jsx", import.meta.url), "utf8");
const latest = await readFile(new URL("../src/components/showcase/LatestUpdateCard.jsx", import.meta.url), "utf8");
const hero = await readFile(new URL("../src/components/practice/PracticePrimitives.jsx", import.meta.url), "utf8");
const tokens = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");

const approvedMedia = {
  id: APPROVED_ROBOTAXI_MEDIA_ID,
  type: "video",
  src: "/media/robotaxi/robotaxi-evidence-fleet-operations-console-v1.mp4",
  ratio: "8:5",
  reviewStatus: "approved",
  publicStatus: "public",
};

const practice = {
  id: "robotaxi",
  modules: [
    { id: "one", mediaId: APPROVED_ROBOTAXI_MEDIA_ID },
    { id: "two" },
    { id: "three", mediaId: null },
    { id: "four" },
  ],
};

test("v0.25.10 geometry contracts are explicit and remove public metadata", () => {
  assert.doesNotMatch(header, /author-lockup/);
  assert.match(latest, /data-release-status=\{status\}/);
  assert.match(latest, /data-release-commit=\{release\.commit\}/);
  assert.match(latest, /查看最新版/);
  assert.doesNotMatch(latest, /release\.commit\.slice/);
  assert.match(hero, /product-hero\$\{headingLevel > 1/);
  assert.match(tokens, /--type-product-title: clamp\(2\.75rem, 3\.4vw, 3\.5rem\)/);
  assert.match(tokens, /--measure-product-hero: 57\.5rem/);
  assert.match(tokens, /--shadow-media: 0 8px 24px rgba\(15, 23, 42, 0\.08\)/);
  assert.match(components, /width: fit-content/);
  assert.match(components, /product-hero--compact/);
  assert.match(pages, /home-page__positioning-shell \{ width: min\(100%, var\(--measure-product-hero\)\)/);
});

test("visual QA fixture gives four independent media slots without changing normal content", () => {
  const manifest = { assets: [approvedMedia] };
  const normal = projectPractice(practice, manifest);
  assert.deepEqual(normal.modules.map((module) => module.mediaId), [APPROVED_ROBOTAXI_MEDIA_ID, null, null, null]);
  const fixture = projectRobotaxiVisualQaFixture(normal, manifest);
  assert.equal(fixture.modules.length, 4);
  assert.deepEqual(fixture.modules.map((module) => module.mediaId), [APPROVED_ROBOTAXI_MEDIA_ID, APPROVED_ROBOTAXI_MEDIA_ID, APPROVED_ROBOTAXI_MEDIA_ID, APPROVED_ROBOTAXI_MEDIA_ID]);
  assert.ok(fixture.modules.every((module) => module.media === approvedMedia));
  const empty = projectPractice({ modules: [{ id: "empty" }] }, { assets: [] });
  assert.equal(empty.modules[0].media, undefined);
});
