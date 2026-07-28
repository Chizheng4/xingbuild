#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { evaluateProductReleaseReadiness } from "./lib/release-readiness.mjs";

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
  statusEntries: git("status", "--porcelain").split("\n"),
  packageVersion: packageJson.version,
  versionRecord: versionRecord.match(/^##\s+(v\d+\.\d+\.\d+)\b/m)?.[1],
  currentVersion: currentIteration.match(/## 当前目标版本\s*\n\s*`(v\d+\.\d+\.\d+)`/)?.[1],
  headTag: git("describe", "--tags", "--exact-match", "HEAD"),
  origin: git("remote", "get-url", "origin"),
});

if (!result.ready) {
  console.error(`发布未就绪：${result.version}`);
  for (const blocker of result.blockers) console.error(`- ${blocker}`);
  process.exit(1);
}

console.log(`发布就绪：${result.version}，main、版本记录、标签与工作区状态一致。`);
