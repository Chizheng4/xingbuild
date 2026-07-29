#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, validateObservation } from "./lib/observation-content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function validateContentScope(files) {
  const normalized = files.filter(Boolean).map((file) => file.replaceAll("\\", "/"));
  const entries = normalized.filter((file) => /^(?:content\/(?:products|business-observations|observations|articles|profile)\/[a-z0-9-]+\.json)$/.test(file));
  const manifests = normalized.filter((file) => /^content\/media\/[a-z0-9-]+\/manifest\.json$/.test(file));
  const media = normalized.filter((file) => /^(?:content\/media\/[a-z0-9-]+\/archive\/[a-z0-9._-]+|public\/media\/[a-z0-9-]+\/[a-z0-9._-]+)$/.test(file));
  const contentObjects = [...entries, ...manifests];
  const allowed = [...contentObjects, ...media];
  const rejected = normalized.filter((file) => !allowed.includes(file));
  const errors = [];
  if (contentObjects.length !== 1) errors.push(`content-only change must contain exactly one content object JSON or media manifest; found ${contentObjects.length}`);
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

  const entry = files.find((file) => /^(?:content\/(?:products|business-observations|observations|articles|profile)\/[a-z0-9-]+\.json|content\/media\/[a-z0-9-]+\/manifest\.json)$/.test(file));
  if (!errors.length && entry?.startsWith("content/observations/")) {
    const observation = await readJson(path.join(root, entry));
    errors.push(...validateObservation(observation, { expectedStatus: "published" }));
  }

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Content-only scope check passed: ${entry}`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  await main();
}
