#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSupportedPracticeId,
  evaluatePracticeCommitReadiness,
  mediaPathsForPractice,
  practiceContentPaths,
  validatePracticeMediaFiles,
  validatePublishablePracticeBundle,
} from "./lib/practice-content.mjs";
import { readFile } from "node:fs/promises";
import { contentRootDirectory } from "./lib/content-root.mjs";

const root = process.env.XINGBUILD_PRACTICE_ROOT
  ? path.resolve(process.env.XINGBUILD_PRACTICE_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const usage = "Usage: npm run practice:scope-check -- --id <practiceId> [--commit HEAD]";
const args = process.argv.slice(2);
const valueFor = (name) => args[args.indexOf(name) + 1];
const practiceId = valueFor("--id");
const commit = valueFor("--commit") || "HEAD";

export async function checkPracticeCommit({ practiceId, commit = "independent-content", readBytes } = {}) {
  assertSupportedPracticeId(practiceId);
  const paths = practiceContentPaths(practiceId, { rootDirectory: root });
  const practice = JSON.parse(await readFile(paths.practiceFile, "utf8"));
  const manifest = JSON.parse(await readFile(paths.manifestFile, "utf8"));
  const files = [paths.practicePath, paths.manifestPath, ...mediaPathsForPractice(practice, manifest)];
  const result = evaluatePracticeCommitReadiness({
    practiceId,
    files,
    practice,
    manifest,
  });
  const errors = [...result.errors, ...validatePublishablePracticeBundle(practice, manifest, { expectedId: practiceId })];
  errors.push(...await validatePracticeMediaFiles(manifest, {
    practice,
    readBytes: readBytes || ((location) => readFile(location.startsWith("public/media/")
      ? path.join(contentRootDirectory({ sourceRoot: root }), location.slice("public/".length))
      : path.join(root, location))),
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
