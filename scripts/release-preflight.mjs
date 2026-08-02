#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { evaluateProductReleaseReadiness, parseCurrentIterationVersion } from "./lib/release-readiness.mjs";
import { evaluateVersionState } from "./lib/version-state.mjs";

function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const versionRecord = await readFile(new URL("../VERSION.md", import.meta.url), "utf8");
const currentIteration = await readFile(
  new URL("../docs/iterations/current.md", import.meta.url),
  "utf8",
);
const result = evaluateProductReleaseReadiness({
  branch: git("branch", "--show-current"),
  allowReleaseWorktree: process.env.XINGBUILD_RELEASE_WORKTREE === "1",
  statusEntries: git("status", "--porcelain").split("\n"),
  packageVersion: packageJson.version,
  versionRecord: versionRecord.match(/^##\s+(v\d+\.\d+\.\d+)\b/m)?.[1],
  currentVersion: parseCurrentIterationVersion(currentIteration),
  headTag: git("describe", "--tags", "--exact-match", "HEAD"),
  origin: git("remote", "get-url", "origin"),
});
const stateResult = evaluateVersionState({
  currentText: currentIteration,
  phase: "preflight",
  headTagged: Boolean(git("describe", "--tags", "--exact-match", "HEAD")),
  clean: git("status", "--porcelain") === "",
  expectedVersion: `v${packageJson.version}`,
});
result.blockers.push(...stateResult.blockers);
result.ready = result.ready && stateResult.ready;

if (!result.ready) {
  console.error(`发布未就绪：${result.version}`);
  for (const blocker of result.blockers) console.error(`- ${blocker}`);
  process.exit(1);
}

console.log(`发布就绪：${result.version}，main、版本记录、标签与工作区状态一致。`);
