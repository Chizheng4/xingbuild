import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { profile, works } from "../src/content/siteContent.js";
import {
  readPublishedObservations,
  validateObservation,
} from "../scripts/lib/observation-content.mjs";
import {
  observationDimensionMetadata,
  selectHomeObservations,
} from "../src/content/observationQueries.js";
import { classifySourceUrl } from "../src/content/sourceUrls.js";
import { projectObservationBrief, validateBriefDefinition } from "../src/content/briefProjection.js";

const observations = await readPublishedObservations();

test("content ids and slugs are unique", () => {
  for (const items of [observations, works]) {
    assert.equal(new Set(items.map((item) => item.id)).size, items.length);
    assert.equal(new Set(items.map((item) => item.slug)).size, items.length);
  }
});

test("published observations satisfy the three-layer model", () => {
  for (const observation of observations) {
    assert.deepEqual(validateObservation(observation, { expectedStatus: "published" }), []);
    assert.ok(observation.evidenceUnits.length);
    assert.ok(observation.sources.length);
    assert.ok(observation.evidenceBoundary);
    assert.ok(observation.rangeAndFacts);
    assert.ok(observation.operatingImpact);
  }
});

test("sourceRefs, controlled enums, and duplicate slugs fail validation", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("./fixtures/observation-candidate.valid.json", import.meta.url), "utf8"),
  );
  const dangling = structuredClone(fixture);
  dangling.evidenceUnits[0].sourceRefs = ["source-missing"];
  assert.ok(validateObservation(dangling).some((error) => error.includes("references missing")));

  const invalidEnum = structuredClone(fixture);
  invalidEnum.level = "instant";
  assert.ok(validateObservation(invalidEnum).some((error) => error.includes("level has invalid")));

  const items = [...observations, { ...observations[0], id: "observation-duplicate-id" }];
  const slugs = new Set();
  assert.throws(() => {
    for (const item of items) {
      if (slugs.has(item.slug)) throw new Error(`duplicate observation slug: ${item.slug}`);
      slugs.add(item.slug);
    }
  }, /duplicate observation slug/);
});

test("migration preserves the existing observation facts and boundaries", () => {
  const framework = observations.find((item) => item.slug === "four-planes-of-enterprise-digitalization");
  const robotaxi = observations.find((item) => item.slug === "robotaxi-simulation-boundary");
  assert.match(framework.rangeAndFacts.paragraphs.join(""), /页面是否完整、流程是否跑通/);
  assert.match(framework.sections[0].paragraphs.join(""), /目标是什么，哪些对象被改变/);
  assert.match(robotaxi.rangeAndFacts.paragraphs.join(""), /业务架构、B 端产品、数据对象和可运行工程/);
  assert.match(robotaxi.evidenceBoundary, /不能证明真实城市运营|不扩大为真实城市运营/);
});

test("home query enforces count, brief quota, substantive retention, and promotion flag", () => {
  const items = [
    ...Array.from({ length: 5 }, (_, index) => ({
      id: `brief-${index}`,
      slug: `brief-${index}`,
      status: "published",
      level: "brief",
      promoteToHome: true,
      publishedAt: `2026-07-${String(27 - index).padStart(2, "0")}`,
    })),
    {
      id: "deep-item",
      slug: "deep-item",
      status: "published",
      level: "deep",
      promoteToHome: true,
      publishedAt: "2026-07-20",
    },
    {
      id: "index-only",
      slug: "index-only",
      status: "published",
      level: "standard",
      promoteToHome: false,
      publishedAt: "2026-07-28",
    },
  ];
  const selected = selectHomeObservations(items);
  assert.ok(selected.length <= 4);
  assert.ok(selected.filter((item) => item.level === "brief").length <= 2);
  assert.ok(selected.some((item) => item.level === "deep"));
  assert.equal(selected.some((item) => item.id === "index-only"), false);
});

test("observation metadata shows scope and primary dimension without duplicate semantics", () => {
  const noNamedScope = {
    companies: [],
    regions: [],
    primaryDimension: "产品与能力",
  };
  assert.deepEqual(observationDimensionMetadata(noNamedScope), ["产品与能力"]);

  const namedScope = {
    companies: ["示例企业"],
    regions: ["示例区域"],
    primaryDimension: "运营与市场",
  };
  assert.deepEqual(
    observationDimensionMetadata(namedScope),
    ["示例企业 · 示例区域", "运营与市场"],
  );
});

test("source urls accept only absolute https or constrained internal paths", () => {
  const external = classifySourceUrl({
    url: "https://example.com/report?id=1",
    sourceTier: "primary",
    sourceType: "report",
  });
  assert.deepEqual(
    { valid: external.valid, kind: external.kind },
    { valid: true, kind: "external" },
  );

  const internal = classifySourceUrl({
    url: "/works/enterprise-operating-framework",
    sourceTier: "internal_snapshot",
    sourceType: "internal_snapshot",
  });
  assert.deepEqual(
    { valid: internal.valid, kind: internal.kind, href: internal.href },
    {
      valid: true,
      kind: "internal",
      href: "/works/enterprise-operating-framework",
    },
  );

  for (const url of [
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "file:///tmp/source",
    "blob:https://example.com/id",
    "http://example.com/report",
    "//example.com/report",
    "reports/source.html",
    "https://example.com/\u0000unsafe",
  ]) {
    assert.equal(
      classifySourceUrl({ url, sourceTier: "primary", sourceType: "report" }).valid,
      false,
      `${url} must be rejected`,
    );
  }

  assert.equal(
    classifySourceUrl({
      url: "/internal/source",
      sourceTier: "primary",
      sourceType: "report",
    }).valid,
    false,
  );
});

test("works and profile preserve their existing boundaries", () => {
  for (const work of works) {
    assert.ok(work.status);
    assert.ok(work.upstream);
    assert.ok(work.boundary);
    assert.ok(work.problemSummary);
  }
  assert.match(works.find((work) => work.id === "robotaxi").boundary, /不代表真实城市运营/);
  assert.match(profile.positioning, /供应链与企业运作/);
  assert.ok(profile.experience.note);
});

test("reading briefs are explicit projections and do not infer from published observations", () => {
  const withoutBrief = { ...observations[0] };
  delete withoutBrief.brief;
  assert.equal(projectObservationBrief(withoutBrief), null);

  const publication = {
    ...withoutBrief,
    presentation: "brief",
    eventAt: "2026-07-20",
    brief: {
      subject: "示例企业",
      statement: "示例企业发布一项可核验的经营事件。",
      sourceRefs: [withoutBrief.sources[0].id],
      isOpinion: false,
    },
  };
  assert.deepEqual(validateObservation(publication, { expectedStatus: "published" }), []);
  assert.deepEqual(projectObservationBrief(publication), {
    id: `brief-${publication.slug}`,
    eventAt: publication.eventAt,
    publishedAt: publication.publishedAt,
    subject: publication.brief.subject,
    primaryDimension: publication.primaryDimension,
    statement: publication.brief.statement,
    sourceRefs: publication.brief.sourceRefs,
    sources: publication.sources,
    isOpinion: false,
    relatedWorks: publication.relatedWorks,
  });
  assert.equal(projectObservationBrief({ ...publication, status: "draft" }), null);
  assert.ok(validateBriefDefinition({ ...publication, eventAt: undefined }).length);
  assert.ok(validateBriefDefinition({ ...publication, brief: { ...publication.brief, publishedAt: "2026-07-28" } }).length);
  assert.ok(validateBriefDefinition({ ...publication, brief: { ...publication.brief, sourceRefs: ["source-missing"] } }).length);
});

test("scheduled brief publications have no article route and preserve an explicit source line", () => {
  const scheduled = observations.filter((item) => item.eventAt?.startsWith("2026-07-") && item.presentation === "brief");
  assert.equal(scheduled.length, 8);
  for (const item of scheduled) {
    assert.equal(item.brief.articleHref, undefined);
    assert.ok(item.brief.sourceRefs.length);
    assert.deepEqual(validateBriefDefinition(item), []);
    assert.ok(projectObservationBrief(item)?.sources.length);
  }
});
