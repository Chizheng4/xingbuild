import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL(file, root), "utf8");

test("经营观察只有登记的 xingbuild scheduler 与固定 task 身份", async () => {
  const contract = await read("docs/operations/经营观察信息源与覆盖合同.md");
  assert.match(contract, /`collectionKey`\s*\|\s*`xingbuild-经营观察`/);
  assert.match(contract, /`automationId`\s*\|\s*`xingbuild`/);
  assert.match(contract, /019fb57b-e90e-75a3-8898-ce3803d6c1fa/);
  assert.match(contract, /019fa166-9645-7532-87f6-99ae4cf9508a/);
  assert.match(contract, /运行 task.*不是新的调度器/);
  assert.match(contract, /不能创建新的自动化、cron 或 scheduled task/);
});

test("内容 task 只能请求既有 Ops task，不得管理调度资源", async () => {
  const [contentRules, agents, releaseRules] = await Promise.all([
    read("docs/operations/内容运营与发布规则.md"),
    read("AGENTS.md"),
    read("docs/rules/iteration-and-release.md"),
  ]);
  assert.match(contentRules, /不得执行定时采集/);
  assert.match(contentRules, /不得创建、复制、更新或替代.*自动化、cron、scheduled task/);
  assert.match(contentRules, /只能把按需采集请求交给已登记的 Ops 长期责任 task/);
  assert.match(agents, /自动化、cron、scheduled task 与普通 task 一样属于受控资源/);
  assert.match(releaseRules, /内容 task 不得创建或管理经营观察调度/);
});

test("调度异常只进入人工阻断，不自动修复或替代", async () => {
  const contract = await read("docs/operations/经营观察信息源与覆盖合同.md");
  assert.match(contract, /调度器缺失、重复、owner 不明或目标 task 无法确认时，必须停止并报告用户/);
  assert.match(contract, /不得自行修复、删除、暂停或替代/);
});
