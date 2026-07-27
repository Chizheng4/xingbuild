import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedRelationTypes,
  frameworkApplications,
  frameworkConceptById,
  frameworkConcepts,
  frameworkRelations,
  frameworkViews,
  mainFrameworkPath,
  validateFrameworkModel,
} from "../src/content/frameworkModel.js";

const authoritativeViews = [
  "业务领域", "企业能力", "价值流", "企业职能", "组织责任",
  "业务流程", "业务对象与事件", "业务规则", "业务指标",
];

test("framework concepts have unique ids, one definition, and traceable sources", () => {
  assert.equal(new Set(frameworkConcepts.map((item) => item.id)).size, frameworkConcepts.length);
  for (const item of frameworkConcepts) {
    assert.ok(item.definition);
    assert.equal(item.source.version, "v5.1");
  }
  assert.deepEqual(validateFrameworkModel(), []);
});

test("relations are typed and resolve both endpoints", () => {
  const applicationIds = new Set(frameworkApplications.map((item) => item.id));
  for (const item of frameworkRelations) {
    assert.ok(frameworkConceptById.has(item.from));
    assert.ok(frameworkConceptById.has(item.to) || applicationIds.has(item.to));
    assert.ok(allowedRelationTypes.has(item.type));
    assert.ok(item.label);
  }
});

test("all nine authoritative enterprise business architecture views are present", () => {
  const view = frameworkViews.find((item) => item.id === "business-architecture");
  const names = view.nodes.map((id) => frameworkConceptById.get(id)?.name);
  for (const name of authoritativeViews) assert.ok(names.includes(name), `${name} must be present`);
  assert.deepEqual(
    view.primaryNodes.map((id) => frameworkConceptById.get(id).name),
    ["企业能力", "价值流", "业务流程", "业务对象与事件", "业务规则", "业务指标"],
  );
});

test("six-step primary path is continuous and preserves the Robotaxi boundary", () => {
  assert.deepEqual(
    mainFrameworkPath.map((item) => item.label),
    ["企业经营体系总览", "数字化实现", "企业业务架构", "业务对象", "对象", "Robotaxi 应用"],
  );
  const pairs = [
    ["digital-implementation", "enterprise-business-architecture"],
    ["enterprise-business-architecture", "business-objects-events"],
    ["business-objects-events", "business-object"],
    ["business-object", "object"],
    ["object", "robotaxi-object"],
  ];
  for (const [from, to] of pairs) {
    assert.ok(frameworkRelations.some((item) => item.from === from && item.to === to));
  }
  assert.match(frameworkApplications[0].evidenceBoundary, /不代表真实城市 Robotaxi 经营结果/);
});
