import assert from "node:assert/strict";
import test from "node:test";
import {
  observations,
  profile,
  works,
} from "../src/content/siteContent.js";

test("content ids and slugs are unique", () => {
  for (const items of [observations, works]) {
    assert.equal(new Set(items.map((item) => item.id)).size, items.length);
    assert.equal(new Set(items.map((item) => item.slug)).size, items.length);
  }
});

test("published observations have required publication fields and valid work links", () => {
  const workIds = new Set(works.map((work) => work.id));
  for (const observation of observations.filter((item) => item.status === "published")) {
    assert.match(observation.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(observation.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(observation.sections.length > 0);
    assert.ok(observation.sourceNotes);
    for (const workId of observation.relatedWorks) assert.ok(workIds.has(workId));
  }
});

test("works preserve status, source, evidence boundary, and architecture", () => {
  for (const work of works) {
    assert.equal("index" in work, false);
    assert.ok(work.status);
    assert.ok(work.upstream);
    assert.ok(work.boundary);
    assert.ok(work.flow || work.planes);
  }
  assert.match(works.find((work) => work.id === "robotaxi").boundary, /不代表真实城市运营/);
});

test("profile keeps positioning and evidence boundaries explicit", () => {
  assert.match(profile.positioning, /供应链与企业运作/);
  assert.ok(profile.experience.note);
  assert.ok(profile.resume.status);
});
