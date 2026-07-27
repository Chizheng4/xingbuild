#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, validateObservation } from "./lib/observation-content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function validateContentScope(files) {
  const normalized = files.filter(Boolean).map((file) => file.replaceAll("\\", "/"));
  const allowed = normalized.filter((file) => /^content\/observations\/[a-z0-9-]+\.json$/.test(file));
  const rejected = normalized.filter((file) => !allowed.includes(file));
  const errors = [];
  if (allowed.length !== 1) errors.push(`content-only change must contain exactly one observation JSON; found ${allowed.length}`);
  if (rejected.length) errors.push(`content-only change contains forbidden files: ${rejected.join(", ")}`);
  return errors;
}

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

async function main() {
  const directArgs = process.argv.slice(2);
  const filesIndex = directArgs.indexOf("--files");
  let files;
  let commit;
  if (filesIndex >= 0) {
    files = directArgs.slice(filesIndex + 1);
  } else {
    const commitIndex = directArgs.indexOf("--commit");
    commit = commitIndex >= 0 ? directArgs[commitIndex + 1] : "HEAD";
    files = git(["diff-tree", "--no-commit-id", "--name-only", "-r", `${commit}^`, commit])
      .split("\n")
      .filter(Boolean);
  }

  const errors = validateContentScope(files);
  if (commit) {
    const currentVersion = JSON.parse(git(["show", `${commit}:package.json`])).version;
    const parentVersion = JSON.parse(git(["show", `${commit}^:package.json`])).version;
    if (currentVersion !== parentVersion) errors.push("content-only publication must not change package version");
  }

  if (!errors.length && files.length === 1) {
    const file = path.join(root, files[0]);
    const observation = await readJson(file);
    errors.push(...validateObservation(observation, { expectedStatus: "published" }));
  }

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Content-only scope check passed: ${files[0]}`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  await main();
}
