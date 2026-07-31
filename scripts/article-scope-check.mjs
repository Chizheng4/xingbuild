#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { articleSlugPattern, root, validateEvergreenArticle } from "./lib/evergreen-article.mjs";

function git(args) { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
const args = process.argv.slice(2);
const slugIndex = args.indexOf("--slug");
const slug = slugIndex >= 0 ? args[slugIndex + 1] : "";
const commit = args[args.indexOf("--commit") + 1] || "HEAD";
if (!articleSlugPattern.test(slug) || args.filter((value) => value === "--slug").length !== 1) {
  throw new Error("Usage: npm run article:scope-check -- --slug <slug> [--commit HEAD]");
}
const files = git(["diff-tree", "--no-commit-id", "--name-only", "-r", `${commit}^`, commit]).split("\n").filter(Boolean);
const expectedArticle = `content/articles/${slug}.json`;
const article = JSON.parse(await readFile(path.join(root, expectedArticle), "utf8"));
const figures = article.blocks.filter((block) => block.type === "figure");
const allowedFiles = new Set([
  expectedArticle,
  ...figures.flatMap((figure) => [figure.sourcePath, figure.src, figure.mobileSrc].filter(Boolean).map((file) => file.startsWith("/") ? `public${file}` : file)),
]);
const allowed = (file) => allowedFiles.has(file);
const errors = [];
if (!files.includes(expectedArticle)) errors.push(`article commit must contain ${expectedArticle}`);
const rejected = files.filter((file) => !allowed(file));
if (rejected.length) errors.push(`article commit contains forbidden files: ${rejected.join(", ")}`);
const currentVersion = JSON.parse(git(["show", `${commit}:package.json`])).version;
const parentVersion = JSON.parse(git(["show", `${commit}^:package.json`])).version;
if (currentVersion !== parentVersion) errors.push("article publication must not change product version");
if (git(["tag", "--points-at", commit])) errors.push("article publication must not create a product tag");
if (git(["rev-parse", "origin/main"]) !== git(["rev-parse", `${commit}^`]) && git(["rev-parse", "origin/main"]) !== git(["rev-parse", commit])) errors.push("origin/main must equal HEAD^ before push or HEAD for a deployment retry");
errors.push(...await validateEvergreenArticle(article, { expectedSlug: slug }));
if (errors.length) throw new Error(errors.map((error) => `- ${error}`).join("\n"));
console.log(`Slug-scoped evergreen article check passed: ${expectedArticle}`);
