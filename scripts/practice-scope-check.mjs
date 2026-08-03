#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSupportedPracticeId,
  evaluatePracticeCommitReadiness,
  practiceContentPaths,
  validatePracticeMediaFiles,
  validatePublishablePracticeBundle,
} from "./lib/practice-content.mjs";

const root = process.env.XINGBUILD_PRACTICE_ROOT
  ? path.resolve(process.env.XINGBUILD_PRACTICE_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const usage = "Usage: npm run practice:scope-check -- --id <practiceId> [--commit HEAD]";
const args = process.argv.slice(2);
const valueFor = (name) => args[args.indexOf(name) + 1];
const practiceId = valueFor("--id");
const commit = valueFor("--commit") || "HEAD";

function git(args, options = {}) {
  return execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: root, encoding: "utf8", ...options }).trim();
}

export async function checkPracticeCommit({ practiceId, commit = "HEAD", gitImpl = git, readBytes } = {}) {
  assertSupportedPracticeId(practiceId);
  const paths = practiceContentPaths(practiceId, { rootDirectory: root });
  const parent = gitImpl(["rev-parse", `${commit}^`]);
  const head = gitImpl(["rev-parse", commit]);
  const files = gitImpl(["diff-tree", "--no-commit-id", "--name-only", "-r", `${commit}^`, commit]).split("\n").filter(Boolean);
  const showJson = (file) => JSON.parse(gitImpl(["show", `${commit}:${file}`]));
  const practice = showJson(paths.practicePath);
  const manifest = showJson(paths.manifestPath);
  const result = evaluatePracticeCommitReadiness({
    practiceId,
    files,
    practice,
    manifest,
  });
  const errors = [...result.errors, ...validatePublishablePracticeBundle(practice, manifest, { expectedId: practiceId })];
  errors.push(...await validatePracticeMediaFiles(manifest, {
    practice,
    readBytes: readBytes || ((location) => execFileSync("git", ["show", `${commit}:${location}`], { cwd: root, maxBuffer: 20 * 1024 * 1024 })),
  }));
  return { ...result, errors, ready: errors.length === 0, practicePath: paths.practicePath, practice, manifest };
}

function validArguments() {
  const allowed = new Set(["--id", "--commit"]);
  if (args.some((value) => value.startsWith("--") && !allowed.has(value))) return false;
  if (args.filter((value) => value === "--id").length !== 1 || args.filter((value) => value === "--commit").length > 1) return false;
  return args.length === (args.includes("--commit") ? 4 : 2) && Boolean(practiceId) && Boolean(commit);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  if (!validArguments()) throw new Error(usage);
  try {
    const result = await checkPracticeCommit({ practiceId, commit });
    if (result.errors.length) throw new Error(result.errors.map((error) => `- ${error}`).join("\n"));
    console.log(`Practice-scoped content check passed: ${result.practicePath} (${result.phase})`);
  } catch (error) {
    if (error.message === usage) throw error;
    throw new Error(`${usage}\n${error.message}`);
  }
}
