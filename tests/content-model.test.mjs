import assert from "node:assert/strict";
import test from "node:test";
import { readPublishedObservations, validateObservation } from "../scripts/lib/observation-content.mjs";
import { products, businessObservations } from "../src/content/showcaseRepository.js";
import { profile } from "../src/content/profileRepository.js";
import { chineseEquivalentLength, projectObservationBrief, validateBriefDefinition } from "../src/content/briefProjection.js";
import { selectObservationBriefs } from "../src/content/observationQueries.js";

const observations = await readPublishedObservations();

test("content ids stay singular across product, business observation, profile and publications", () => {
  assert.deepEqual(products, [], "product-mode repository must not read independent content");
  assert.deepEqual(businessObservations, [], "product-mode repository must not read independent content");
  assert.equal(profile, null, "product-mode repository must not read independent content");
  assert.equal(new Set(observations.map((item) => item.slug)).size, observations.length);
});

test("published observations retain the three-layer evidence contract", () => {
  for (const observation of observations) assert.deepEqual(validateObservation(observation, { expectedStatus: "published" }), []);
});

test("brief projection is explicit and preserves event-time sorting", () => {
  const existing = observations.find((item) => item.presentation === "brief");
  assert.ok(existing);
  assert.deepEqual(validateBriefDefinition(existing), []);
  const projected = projectObservationBrief(existing);
  assert.equal(projected.subject, existing.brief.subject);
  assert.equal(projected.body, existing.brief.body || existing.brief.statement);
  assert.equal(projectObservationBrief({ ...existing, presentation: undefined }), null);
  const ordered = selectObservationBriefs([
    { id: "z", eventAt: "2026-07-08", publishedAt: "2026-07-28", relatedWorks: [] },
    { id: "a", eventAt: "2026-07-10", publishedAt: "2026-07-28", relatedWorks: [] },
  ]);
  assert.deepEqual(ordered.map((item) => item.id), ["a", "z"]);
});

test("future brief grammar accepts explicit body without deriving content", () => {
  const base = observations.find((item) => item.presentation === "brief");
  const candidate = structuredClone(base);
  candidate.slug = "future-editorial-brief";
  candidate.brief = { ...candidate.brief, body: "这是人工核验后写入的简讯正文。它只陈述已经明确来源支持的事实，不从标题、摘要、来源或证据对象自动截断生成，也不把判断伪装成事件本身。后续读者可以通过末行来源追溯原始信息，并在需要时阅读独立文章。", statement: undefined };
  assert.deepEqual(validateBriefDefinition(candidate), []);
  assert.ok(chineseEquivalentLength(candidate.brief.body) >= 80);
  assert.ok(chineseEquivalentLength(candidate.brief.body) <= 160);
});

test("every published brief follows the reader-body contract without slug exemptions", () => {
  const publishedBriefs = observations.filter((item) => item.presentation === "brief");
  assert.ok(publishedBriefs.length > 0);
  for (const briefObservation of publishedBriefs) {
    const readerBody = briefObservation.brief.body || briefObservation.brief.statement;
    assert.deepEqual(validateBriefDefinition(briefObservation), []);
    assert.ok(chineseEquivalentLength(readerBody) >= 80);
    assert.ok(chineseEquivalentLength(readerBody) <= 160);
  }

  const short = structuredClone(publishedBriefs[0]);
  short.slug = "future-short-brief";
  short.brief = { ...short.brief, body: undefined, statement: "这是一条过短的简讯。" };
  assert.match(validateBriefDefinition(short).join("\n"), /80–160/);

  const tooLongSubject = structuredClone(short);
  tooLongSubject.brief = {
    ...tooLongSubject.brief,
    statement: "这是一条人工编辑的合格观察正文。它围绕经过核验的事件事实说明主体、经营维度和必要背景，并保留来源链接供读者追溯，不从其他字段自动拼接生成。内容长度满足新的阅读合同。",
    subject: "超过十六个全角等价字符的主体名称必须在内容校验阶段被拒绝",
  };
  assert.match(validateBriefDefinition(tooLongSubject).join("\n"), /brief\.subject/);
});
