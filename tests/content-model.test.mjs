import assert from "node:assert/strict";
import test from "node:test";
import { readPublishedObservations, validateObservation } from "../scripts/lib/observation-content.mjs";
import { products, businessObservations } from "../src/content/showcaseRepository.js";
import { profile } from "../src/content/profileRepository.js";
import { projectObservationBrief, validateBriefDefinition } from "../src/content/briefProjection.js";
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
  candidate.brief = { ...candidate.brief, body: "这是人工核验后写入的简讯正文，不从标题、摘要、来源或证据对象自动截断生成。", statement: undefined };
  assert.deepEqual(validateBriefDefinition(candidate), []);
});
