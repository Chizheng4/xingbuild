import assert from "node:assert/strict";
import test from "node:test";
import {
  architectures,
  architectureById,
  validateFrameworkModel,
} from "../src/content/frameworkModel.js";

const edgeKey = (item) => `${item.from}>${item.label}>${item.to}`;

test("four architectures share one valid node and edge model", () => {
  assert.deepEqual(
    architectures.map((item) => item.id),
    ["enterprise-operation", "business-design", "concept-grammar", "digital-implementation"],
  );
  assert.deepEqual(validateFrameworkModel(), []);
  for (const architecture of architectures) {
    assert.ok(architecture.nodes.length > 0);
    assert.ok(architecture.edges.length > 0);
    assert.equal(new Set(architecture.edges.map((item) => item.id)).size, architecture.edges.length);
    for (const item of architecture.nodes) {
      assert.ok(item.definition);
      assert.ok(item.role);
      if (architecture.id !== "digital-implementation") assert.ok(item.caption);
      if (architecture.id !== "digital-implementation") {
        assert.ok(item.projection.desktop);
        assert.ok(item.projection.mobile);
      }
    }
    for (const item of architecture.edges) {
      assert.ok(item.label);
      if (architecture.id !== "digital-implementation") {
        assert.ok(item.projection.desktop.path);
        assert.ok(item.projection.mobile.path);
        assert.ok(item.projection.desktop.label);
        assert.ok(item.projection.mobile.label);
      }
    }
  }
});

test("enterprise operation preserves the external boundary and feedback loop", () => {
  const architecture = architectureById.get("enterprise-operation");
  assert.ok(architecture.boundary);
  assert.deepEqual(
    architecture.edges.map(edgeKey),
    [
      "external-context>影响>operation-design",
      "external-context>构成现实条件>enterprise-reality",
      "operation-design>建设和调整>enterprise-reality",
      "operation-design>提出数字化需求>digital-implementation",
      "digital-implementation>形成系统并进入>enterprise-reality",
      "enterprise-reality>进行>enterprise-operation",
      "enterprise-operation>产生>operating-facts-results",
      "operating-facts-results>支持>operating-decision",
      "operating-decision>调整选择与设计>operation-design",
      "operating-decision>影响后续运作>enterprise-operation",
    ],
  );
});

test("business design keeps the value spine, side constraints, and three feedback targets", () => {
  const architecture = architectureById.get("business-design");
  const edges = new Set(architecture.edges.map(edgeKey));
  for (const expected of [
    "business-trigger>触发>value-stream",
    "value-stream>需要>capability-resource",
    "capability-resource>通过流程落实>business-process",
    "business-process>改变>business-object-state",
    "business-object-state>产生>business-facts-results",
    "business-rule>约束行为与判断>business-process",
    "business-rule>约束关系与状态变化>business-object-state",
    "business-facts-results>提供计算依据>business-metric",
    "business-metric>衡量并比较>target-gap",
    "target-gap>调整能力与资源>capability-resource",
    "target-gap>调整流程>business-process",
    "target-gap>调整规则>business-rule",
  ]) assert.ok(edges.has(expected), `${expected} must exist`);
  assert.equal(architecture.tracks.length, 1);
});

test("digital implementation keeps parallel product/data design and the operating feedback loop", () => {
  const architecture = architectureById.get("digital-implementation");
  const edges = new Set(architecture.edges.map(edgeKey));
  for (const expected of [
    "enterprise-business-architecture>提出数字化需求>b2b-product-architecture",
    "enterprise-business-architecture>提出数字化需求>data-architecture",
    "b2b-product-architecture>协同设计>data-architecture",
    "data-architecture>相互约束>b2b-product-architecture",
    "b2b-product-architecture>共同驱动>technical-architecture",
    "data-architecture>共同驱动>technical-architecture",
    "technical-architecture>指导实现>engineering",
    "engineering>形成>enterprise-digital-system",
    "enterprise-digital-system>进入并支持或执行>enterprise-reality-operation",
    "enterprise-reality-operation>产生>digital-facts-results",
    "enterprise-digital-system>记录>digital-facts-results",
    "digital-facts-results>支持>digital-decision",
    "digital-decision>调整业务架构>enterprise-business-architecture",
  ]) assert.ok(edges.has(expected), `${expected} must exist`);
});

test("concept grammar preserves the fixed edge set without result-to-fact", () => {
  const architecture = architectureById.get("concept-grammar");
  const edges = new Set(architecture.edges.map(edgeKey));
  const expected = [
    "subject>参与>activity-process",
    "activity-process>作用于>object",
    "subject>建立关系>relation",
    "object>建立关系>relation",
    "subject>具有状态>state",
    "object>具有状态>state",
    "relation>具有状态>state",
    "event>改变状态>state",
    "event>改变关系>relation",
    "rule>约束状态和关系变化>event",
    "rule>约束活动>activity-process",
    "activity-process>形成>result",
    "event>形成>result",
    "state>状态由事实记录或验证>fact",
    "activity-process>活动由事实记录或验证>fact",
    "event>事件由事实记录或验证>fact",
    "fact>提供计算依据>metric",
    "metric>衡量状态>state",
    "metric>衡量过程>activity-process",
    "metric>衡量结果>result",
  ];
  assert.deepEqual([...edges], expected);
  assert.equal(architecture.edges.some((item) => item.from === "result" && item.to === "fact"), false);
});
