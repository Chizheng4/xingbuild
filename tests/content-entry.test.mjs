import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertCurrentPracticeContent, validatePracticeBundle } from "../scripts/lib/practice-content.mjs";
import { countCompleteBriefs } from "../src/content/briefRail.js";
import { selectObservationBriefs as selectBriefs } from "../src/content/observationQueries.js";
import { findPractice } from "../src/content/practiceRepository.js";

test("practice content is a controlled empty source until real evidence media exists", async () => {
  const { practice, manifest } = await assertCurrentPracticeContent();
  assert.equal(practice.id, "robotaxi");
  assert.deepEqual(practice.modules, []);
  assert.deepEqual(manifest.assets, []);
  assert.deepEqual(findPractice("robotaxi").modules, []);
});

test("practice modules require one public 16:10 media record and cannot use a platform root", () => {
  const practice = {
    id: "robotaxi",
    route: "/robotaxi",
    navLabel: "Robotaxi运营平台",
    title: "标题",
    intro: "说明",
    boundary: "边界",
    modules: [{ id: "planning", label: "经营目标与规划", shortDescription: "说明", loopRelation: "关系", mediaId: "planning" }],
  };
  const manifest = {
    id: "robotaxi-public-media",
    version: "2026-07-28",
    directory: "/media/robotaxi",
    assets: [{
      id: "planning",
      src: "/media/robotaxi/planning.png",
      alt: "公开运行界面",
      sourceVersion: "v1",
      sourceUrl: "https://robotaxi.xingbuild.top/operations/planning",
      ratio: "16:10",
      availability: "public",
    }],
  };
  assert.deepEqual(validatePracticeBundle(practice, manifest), []);
  assert.ok(validatePracticeBundle(practice, { ...manifest, assets: [{ ...manifest.assets[0], ratio: "4:3" }] }).length);
  assert.ok(validatePracticeBundle({ ...practice, modules: [{ ...practice.modules[0], href: "https://robotaxi.xingbuild.top/" }] }, manifest).length);
});

test("brief reading source belongs to published observations, not an independent JS list", async () => {
  const observationsPage = await readFile(new URL("../src/pages/ObservationsPage.jsx", import.meta.url), "utf8");
  const homePage = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
  const frameworkPage = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
  const repository = await readFile(new URL("../src/content/observationRepository.js", import.meta.url), "utf8");
  assert.match(repository, /\.map\(projectObservationBrief\)/);
  assert.match(observationsPage, /selectObservationBriefs/);
  assert.match(homePage, /ObservationRail/);
  assert.match(frameworkPage, /ObservationRail/);
  await assert.rejects(readFile(new URL("../src/content/observationBriefs.js", import.meta.url), "utf8"));
});

test("rail budgets every candidate before selecting only complete items", () => {
  const boxes = [
    { top: 0, height: 80 },
    { top: 96, height: 80 },
    { top: 192, height: 80 },
    { top: 288, height: 80 },
  ];
  assert.equal(countCompleteBriefs(boxes, 280), 3);
  assert.equal(countCompleteBriefs(boxes, 250), 2);
});

test("practice and framework rails both receive the newest robotaxi-only brief", async () => {
  const robotaxiOnlyBrief = {
    id: "brief-robotaxi-event",
    eventAt: "2026-07-10",
    publishedAt: "2026-07-28",
    subject: "Robotaxi主体",
    primaryDimension: "运营与市场",
    statement: "一条可核验事件。",
    sourceRefs: ["source-example"],
    sources: [],
    isOpinion: false,
    relatedWorks: ["robotaxi"],
  };
  assert.deepEqual(selectBriefs([robotaxiOnlyBrief], { scope: "robotaxi" }), [robotaxiOnlyBrief]);
  assert.deepEqual(selectBriefs([robotaxiOnlyBrief]), [robotaxiOnlyBrief]);

  const homePage = await readFile(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
  const frameworkPage = await readFile(new URL("../src/pages/FrameworkPage.jsx", import.meta.url), "utf8");
  assert.match(homePage, /selectObservationBriefs\(\)/);
  assert.match(frameworkPage, /selectObservationBriefs\(\)/);
});

test("briefs display and sort by event date without repurposing publication date", async () => {
  const items = [
    { id: "brief-z", eventAt: "2026-07-08", publishedAt: "2026-07-28", relatedWorks: ["robotaxi"] },
    { id: "brief-a", eventAt: "2026-07-08", publishedAt: "2026-07-28", relatedWorks: ["robotaxi"] },
    { id: "brief-later-published", eventAt: "2026-07-04", publishedAt: "2026-07-29", relatedWorks: ["robotaxi"] },
    { id: "brief-newest-event", eventAt: "2026-07-10", publishedAt: "2026-07-28", relatedWorks: ["robotaxi"] },
  ];
  assert.deepEqual(selectBriefs(items).map((item) => item.id), [
    "brief-newest-event",
    "brief-a",
    "brief-z",
    "brief-later-published",
  ]);

  const briefs = await readFile(new URL("../src/components/observations/Briefs.jsx", import.meta.url), "utf8");
  assert.match(briefs, /brief-item__identity/);
  assert.match(briefs, /brief-item__dimension/);
  assert.match(briefs, /dateTime=\{item\.eventAt\}/);
  assert.doesNotMatch(briefs, /dateTime=\{item\.publishedAt\}/);
});
