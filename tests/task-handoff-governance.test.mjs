import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL(file, root), "utf8");

test("交接明确区分 source、target 与 return task", async () => {
  const [agents, rules] = await Promise.all([
    read("AGENTS.md"),
    read("docs/rules/collaboration-workflow.md"),
  ]);
  assert.match(agents, /`sourceThreadId`、`targetThreadId`、`returnThreadId`/);
  assert.match(agents, /source 只作溯源/);
  assert.match(agents, /精确 return 地址一次回传/);
  assert.match(rules, /`sourceThreadId`/);
  assert.match(rules, /`targetThreadId`/);
  assert.match(rules, /`returnThreadId`/);
  assert.match(rules, /回传工具不可调用时，当前动作立即报告阻断/);
});

test("交接保持一次回传、禁止轮询等待", async () => {
  const rules = await read("docs/rules/collaboration-workflow.md");
  assert.match(rules, /主动回传一次不超过 20 行的检查点/);
  assert.match(rules, /源 task 发送一次交接后结束当前回合/);
  assert.match(rules, /不得创建、fork、猜测、@mention、替代、轮询或后台等待/);
});
