#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { articleSlugPattern, root, validateEvergreenArticle } from "./lib/evergreen-article.mjs";
import { evaluateUnifiedReleaseReadiness, unifiedReleaseRecordFiles } from "./lib/unified-release.mjs";

function git(args, cwd = root) { return execFileSync("git", args, { cwd, encoding: "utf8" }).trim(); }

export async function checkArticleCommit({ slug, commit = "HEAD", gitImpl = git, rootDirectory = root } = {}) {
  if (!articleSlugPattern.test(slug) || !slug) throw new Error("article release requires a valid explicit slug");
  const files = gitImpl(["diff-tree", "--no-commit-id", "--name-only", "-r", `${commit}^`, commit]).split("\n").filter(Boolean);
  const expectedArticle = `content/articles/${slug}.json`;
  const article = JSON.parse(await readFile(path.join(rootDirectory, expectedArticle), "utf8"));
  const figures = article.blocks.filter((block) => block.type === "figure");
  const allowedFiles = new Set([
    expectedArticle,
    ...figures.flatMap((figure) => [figure.sourcePath, figure.src, figure.mobileSrc]
      .filter(Boolean).map((file) => file.startsWith("/") ? `public${file}` : file)),
    ...unifiedReleaseRecordFiles(JSON.parse(gitImpl(["show", `${commit}:package.json`])).version),
  ]);
  const errors = files.filter((file) => !allowedFiles.has(file)).map((file) => `article release contains forbidden files: ${file}`);
  const currentVersion = JSON.parse(gitImpl(["show", `${commit}:package.json`])).version;
  const parentVersion = JSON.parse(gitImpl(["show", `${commit}^:package.json`])).version;
  const originMain = gitImpl(["rev-parse", "origin/main"]);
  let originMainIsAncestor = true;
  try {
    gitImpl(["merge-base", "--is-ancestor", originMain, gitImpl(["rev-parse", `${commit}^`])]);
  } catch {
    originMainIsAncestor = false;
  }
  errors.push(...evaluateUnifiedReleaseReadiness({
    files,
    targetFile: expectedArticle,
    currentVersion,
    parentVersion,
    head: gitImpl(["rev-parse", commit]),
    parent: gitImpl(["rev-parse", `${commit}^`]),
    originMain,
    originMainIsAncestor,
    headTags: gitImpl(["tag", "--points-at", commit]).split("\n").filter(Boolean),
    kind: "article",
    extraAllowedFiles: [...allowedFiles],
  }).errors);
  errors.push(...await validateEvergreenArticle(article, { expectedSlug: slug }));
  return { errors, expectedArticle };
}

async function main() {
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf("--slug");
  const commitIndex = args.indexOf("--commit");
  const slug = slugIndex >= 0 ? args[slugIndex + 1] : "";
  const commit = commitIndex >= 0 ? args[commitIndex + 1] : "HEAD";
  if (!articleSlugPattern.test(slug) || args.filter((value) => value === "--slug").length !== 1) {
    throw new Error("Usage: npm run article:scope-check -- --slug <slug> [--commit HEAD]");
  }
  const result = await checkArticleCommit({ slug, commit });
  if (result.errors.length) throw new Error(result.errors.map((error) => `- ${error}`).join("\n"));
  console.log(`Slug-scoped evergreen article check passed: ${result.expectedArticle}`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) await main();
