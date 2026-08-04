import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL(file, root), "utf8");

test("五层基线有唯一入口和按任务类型读取路径", async () => {
  const [agents, index] = await Promise.all([
    read("AGENTS.md"),
    read("docs/rules/00-baseline-index.md"),
  ]);
  for (const file of [
    "docs/rules/00-baseline-index.md",
    "docs/rules/responsibility-and-workflows.md",
    "docs/rules/collaboration-workflow.md",
    "docs/rules/iteration-and-release.md",
    "docs/rules/engineering-architecture-and-principles.md",
    "docs/product/xingbuild 网站产品架构与视觉系统总案.md",
  ]) {
    assert.match(agents, new RegExp(file.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
  }
  for (const label of ["2.1", "2.2", "2.3", "2.4", "2.5", "治理/协作", "产品/视觉", "Engineering", "内容发布", "Ops 采集"]) {
    assert.match(index, new RegExp(label));
  }
});

test("职责、协作、工程与产品规则不互相替代", async () => {
  const [responsibility, collaboration, iteration, engineering, coordinator] = await Promise.all([
    read("docs/rules/responsibility-and-workflows.md"),
    read("docs/rules/collaboration-workflow.md"),
    read("docs/rules/iteration-and-release.md"),
    read("docs/rules/engineering-architecture-and-principles.md"),
    read("scripts/lib/site-publication-coordinator.mjs"),
  ]);
  assert.match(responsibility, /产品与视觉/);
  assert.match(responsibility, /内容和 Ops 使用各自合同/);
  assert.match(collaboration, /sourceThreadId/);
  assert.match(collaboration, /targetThreadId/);
  assert.match(collaboration, /returnThreadId/);
  assert.match(collaboration, /一次回传/);
  assert.match(collaboration, /不得创建、fork、猜测、@mention、替代、轮询或后台等待/);
  assert.match(iteration, /release:prepare/);
  assert.match(iteration, /Publish Incident/);
  assert.match(engineering, /ProductRelease intent[\s\S]*Coordinator/);
  assert.match(responsibility, /SitePublication Coordinator/);
  assert.match(iteration, /SitePublication/);
  assert.match(coordinator, /\["makers", "deploy"/);
  assert.doesNotMatch(engineering, /makers[\s\S]*deploy/);
  assert.doesNotMatch(iteration, /### 2\.1 跨 task 工作边界/);
  assert.doesNotMatch(iteration, /### 2\.4 事件驱动的跨 task 调度/);
});

test("运营身份不进入产品版本闭环", async () => {
  const [responsibility, content, iteration] = await Promise.all([
    read("docs/rules/responsibility-and-workflows.md"),
    read("docs/operations/内容运营与发布规则.md"),
    read("docs/rules/iteration-and-release.md"),
  ]);
  assert.match(responsibility, /不进入产品 `v0\.x`/);
  assert.match(content, /内容运营不创建或递增产品 `v0\.x`/);
  assert.match(iteration, /内容.*不进入产品版本/);
});
