import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertCurrentPracticeContent, validatePracticeBundle } from "../scripts/lib/practice-content.mjs";
import { countCompleteBriefs } from "../src/content/briefRail.js";
import { selectObservationBriefs as selectBriefs } from "../src/content/observationQueries.js";
import { findPractice, projectPractice } from "../src/content/practiceRepository.js";

test("practice preserves superseded Robotaxi media records without projecting them publicly", async () => {
  const { practice, manifest } = await assertCurrentPracticeContent();
  assert.equal(practice.id, "robotaxi");
  assert.equal(manifest.reviewStatus, "superseded");
  assert.equal(manifest.publicStatus, "internal");
  assert.equal(manifest.currentPublication.status, "suspended");
  assert.equal(manifest.approvalRecord.approvalStatus, "approved");
  assert.equal(manifest.provenance.commit, "1e01d4998f21212f4c716522fbb1f880fbee73b8");
  assert.deepEqual(practice.modules.map((module) => module.id), [
    "robotaxi-operations-current-simulation",
    "robotaxi-operations-city-spatial-progress",
    "robotaxi-operating-model",
    "robotaxi-operating-metrics-overview",
  ]);
  assert.deepEqual(practice.modules.map((module) => module.group), ["运营中控台", "运营中控台", "经营模型", "经营总览"]);
  assert.equal(manifest.assets.length, 4);
  assert.ok(manifest.assets.every((asset) => asset.type === "image" && asset.ratio === "16:10"));
  assert.ok(manifest.assets.every((asset) => asset.archivePath?.startsWith("content/media/robotaxi/archive/")));
  assert.deepEqual(manifest.assets.map((asset) => asset.provenance.approvalStatus), ["paused", "revoked", "paused", "paused"]);
  assert.ok(practice.modules.every((module) => module.action?.href === "https://robotaxi.xingbuild.top/"));
  assert.deepEqual(findPractice("robotaxi").modules, []);
});

test("practice media keeps reader interaction separate from internal provenance", () => {
  const practice = {
    id: "robotaxi",
    route: "/products",
    navLabel: "Robotaxi运营平台",
    title: "标题",
    intro: "说明",
    boundary: "边界",
    modules: [{
      id: "planning",
      group: "运营中控台",
      label: "经营目标与规划",
      shortDescription: "说明",
      loopRelation: "关系",
      mediaId: "planning",
      action: { href: "https://robotaxi.xingbuild.top/" },
    }],
  };
  const manifest = {
    id: "robotaxi-approved-evidence-media",
    version: "v1",
    directory: "/media/robotaxi",
    reviewStatus: "approved",
    publicStatus: "public",
    approvalRecord: {
      approvalId: "approval-1",
      approvalStatus: "approved",
      authority: "user",
      approvedAt: "2026-07-28",
      scope: "测试",
    },
    currentPublication: {
      status: "active",
      effectiveAt: "2026-07-29",
      authority: "user",
      reason: "测试",
    },
    provenance: {
      repository: "Robotaxi",
      manifestPath: "media/evidence-approved/manifest.json",
      version: "v1",
      commit: "abcdef0",
      sourceDraftManifestSha256: "a".repeat(64),
    },
    assets: [{
      id: "planning",
      type: "image",
      src: "/media/robotaxi/planning.png",
      altZh: "公开运行界面",
      ratio: "16:10",
      assetSha256: "b".repeat(64),
      reviewStatus: "approved",
      publicStatus: "public",
      provenance: {
        mediaRole: "current_system_evidence",
        stateBoundary: "系统证据。",
        robotaxiVersion: "v1",
        commit: "abcdef0",
        approvalStatus: "approved",
      },
    }],
  };
  assert.deepEqual(validatePracticeBundle(practice, manifest), []);
  assert.equal(projectPractice(practice, manifest).modules.length, 1);
  assert.ok(validatePracticeBundle(practice, { ...manifest, assets: [{ ...manifest.assets[0], ratio: "4:3" }] }).length);
  assert.ok(validatePracticeBundle(practice, { ...manifest, reviewStatus: "draft" }).length);
  assert.ok(validatePracticeBundle(practice, { ...manifest, assets: [{ ...manifest.assets[0], assetSha256: "not-a-hash" }] }).length);
  assert.ok(validatePracticeBundle({ ...practice, modules: [{ ...practice.modules[0], action: { href: "javascript:alert(1)" } }] }, manifest).length);
  assert.ok(validatePracticeBundle({ ...practice, modules: [{ ...practice.modules[0], group: "" }] }, manifest).length);

  const archivedAsset = {
    ...manifest.assets[0],
    src: undefined,
    archivePath: "content/media/robotaxi/archive/planning.png",
    publicStatus: "internal",
  };
  for (const change of [
    { currentPublication: { ...manifest.currentPublication, status: "suspended" }, assets: [archivedAsset] },
    { reviewStatus: "superseded", assets: [archivedAsset] },
    { publicStatus: "internal", assets: [archivedAsset] },
    { assets: [{ ...manifest.assets[0], reviewStatus: "revoked", publicStatus: "internal", archivePath: "content/media/robotaxi/archive/planning.png", src: undefined, provenance: { ...manifest.assets[0].provenance, approvalStatus: "revoked" } }] },
    { assets: [{ ...manifest.assets[0], reviewStatus: "pending_review", publicStatus: "internal", archivePath: "content/media/robotaxi/archive/planning.png", src: undefined, provenance: { ...manifest.assets[0].provenance, approvalStatus: "paused" } }] },
  ]) {
    const candidate = { ...manifest, ...change };
    assert.deepEqual(validatePracticeBundle(practice, candidate), []);
    assert.deepEqual(projectPractice(practice, candidate).modules, []);
  }

});

test("practice headings advance from the presentation root rather than using a fixed module level", async () => {
  const practicePage = await readFile(new URL("../src/components/practice/PracticePage.jsx", import.meta.url), "utf8");
  assert.match(practicePage, /headingLevel=\{headingLevel \+ 1\}/);
  assert.match(practicePage, /const Heading = `h\$\{headingLevel\}`/);
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
  assert.equal(countCompleteBriefs(boxes, 280, { moreHeight: 32, railGap: 16 }), 2);
  assert.equal(countCompleteBriefs(boxes, 120, { moreHeight: 32, railGap: 16 }), 0);
});

test("rail contracts keep main height independent, reserve more and allow zero visible briefs", async () => {
  const layout = await readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8");
  const rail = await readFile(new URL("../src/components/observations/Briefs.jsx", import.meta.url), "utf8");
  const robotaxiPage = await readFile(new URL("../src/pages/RobotaxiPage.jsx", import.meta.url), "utf8");
  const components = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
  const pages = await readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8");
  assert.match(layout, /\.two-column-layout\.has-rail[^}]*align-items: start/);
  assert.match(rail, /moreHeight: more\?\.height/);
  assert.match(rail, /setVisibleCount\(\(current\) => current === count \? current : count\)/);
  assert.doesNotMatch(rail, /Math\.max\(1/);
  assert.match(rail, /aria-hidden="true" inert>/);
  assert.doesNotMatch(rail, /inert=""/);
  assert.match(robotaxiPage, /practice\.modules\.length && briefs\.length/);
  assert.match(components, /\.observation-rail \.brief-item__statement/);
  assert.match(pages, /\.observation-rail__measure[^}]*height: 0;[^}]*overflow: hidden;/);
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
