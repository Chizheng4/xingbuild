import assert from "node:assert/strict";
import test from "node:test";
import { readPublishedObservations, validateObservation } from "../scripts/lib/observation-content.mjs";
import { products, businessObservations } from "../src/content/showcaseRepository.js";
import { profile } from "../src/content/profileRepository.js";
import { LEGACY_BRIEF_MIGRATION_SLUGS, chineseEquivalentLength, projectObservationBrief, validateBriefDefinition } from "../src/content/briefProjection.js";
import { selectObservationBriefs } from "../src/content/observationQueries.js";

const observations = await readPublishedObservations();

test("content ids stay singular across product, business observation, profile and publications", () => {
  assert.equal(products.length, 1);
  assert.equal(businessObservations.length, 1);
  assert.equal(profile.id, "about");
  assert.equal(new Set(observations.map((item) => item.slug)).size, observations.length);
  assert.match(products[0].boundary, /不代表真实城市运营/);
  assert.equal(businessObservations[0].title, "企业经营体系");
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

test("brief migration exemption is explicit, narrow, and cannot bypass future reader grammar", () => {
  const legacy = observations.find((item) => item.presentation === "brief");
  assert.ok(LEGACY_BRIEF_MIGRATION_SLUGS.has(legacy.slug));
  assert.deepEqual(validateBriefDefinition(legacy), []);

  const future = structuredClone(legacy);
  future.slug = "future-short-brief";
  assert.match(validateBriefDefinition(future).join("\n"), /brief\.body/);

  const tooLongSubject = structuredClone(future);
  tooLongSubject.brief = {
    ...tooLongSubject.brief,
    body: "这是一条人工编辑的合格观察正文。它围绕经过核验的事件事实说明主体、经营维度和必要背景，并保留来源链接供读者追溯，不从其他字段自动拼接生成。内容长度满足新的阅读合同。",
    subject: "超过十六个全角等价字符的主体名称必须在内容校验阶段被拒绝",
  };
  assert.match(validateBriefDefinition(tooLongSubject).join("\n"), /brief\.subject/);
});
