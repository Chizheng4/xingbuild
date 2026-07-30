#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateContentCommitReadiness } from "./lib/content-release-readiness.mjs";
import {
  assertPromotedTargetReady,
  assertValidSlug,
  hashFile,
  readJson,
  readPublishedObservations,
  validateObservation,
} from "./lib/observation-content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function validateContentScope(files, { slug } = {}) {
  if (!slug) {
    const normalized = files.filter(Boolean).map((file) => file.replaceAll("\\", "/"));
    const entries = normalized.filter((file) => /^content\/observations\/[a-z0-9-]+\.json$/.test(file));
    const rejected = normalized.filter((file) => !entries.includes(file));
    const errors = [];
    if (entries.length !== 1) errors.push(`content-only change must contain exactly one Observation; found ${entries.length}`);
    if (rejected.length) errors.push(`content-only change contains forbidden files: ${rejected.join(", ")}`);
    return errors;
  }
  return evaluateContentCommitReadiness({ slug, files }).errors;
}

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

export async function validateApprovedMedia(manifestPath, { files, slug, rootDirectory = root }) {
  if (!manifestPath) return [];
  const manifest = await readJson(path.join(rootDirectory, manifestPath));
  const errors = [];
  if (manifest.reviewStatus !== "approved") errors.push("target media manifest reviewStatus must be approved");
  if (manifest.publicStatus !== "public") errors.push("target media manifest publicStatus must be public");
  if (!Array.isArray(manifest.assets) || !manifest.assets.length) {
    errors.push("target media manifest must contain approved assets");
    return errors;
  }
  for (const asset of manifest.assets) {
    const label = asset?.id || "(unknown)";
    if (asset?.reviewStatus !== "approved") errors.push(`media asset ${label} reviewStatus must be approved`);
    if (asset?.publicStatus !== "public") errors.push(`media asset ${label} publicStatus must be public`);
    if (asset?.provenance?.approvalStatus !== "approved") {
      errors.push(`media asset ${label} provenance approvalStatus must be approved`);
    }
    if (!/^[a-f0-9]{64}$/.test(asset?.assetSha256 || "")) {
      errors.push(`media asset ${label} assetSha256 must be SHA-256`);
      continue;
    }
    if (typeof asset.src !== "string" || !asset.src.startsWith(`/media/${slug}/`)) {
      errors.push(`media asset ${label} src must belong to /media/${slug}/`);
      continue;
    }
    const publicFile = `public${asset.src}`;
    if (!files.includes(publicFile)) {
      errors.push(`media asset ${label} file must be committed: ${publicFile}`);
      continue;
    }
    try {
      if (await hashFile(path.join(rootDirectory, publicFile)) !== asset.assetSha256) {
        errors.push(`media asset ${label} SHA-256 mismatch`);
      }
    } catch {
      errors.push(`media asset ${label} file is missing: ${publicFile}`);
    }
  }
  return errors;
}

async function main() {
  const directArgs = process.argv.slice(2);
  const slugIndex = directArgs.indexOf("--slug");
  const slug = slugIndex >= 0 ? directArgs[slugIndex + 1] : undefined;
  try {
    assertValidSlug(slug);
  } catch {
    console.error("Usage: npm run content:scope-check -- --slug <slug> [--commit HEAD]");
    process.exitCode = 1;
    return;
  }

  const commitIndex = directArgs.indexOf("--commit");
  const commit = commitIndex >= 0 ? directArgs[commitIndex + 1] : "HEAD";
  const parent = git(["rev-parse", `${commit}^`]);
  const head = git(["rev-parse", commit]);
  const files = git(["diff-tree", "--no-commit-id", "--name-only", "-r", `${commit}^`, commit])
    .split("\n")
    .filter(Boolean);
  const currentVersion = JSON.parse(git(["show", `${commit}:package.json`])).version;
  const parentVersion = JSON.parse(git(["show", `${commit}^:package.json`])).version;
  const originMain = git(["rev-parse", "origin/main"]);
  const headTags = git(["tag", "--points-at", commit]).split("\n").filter(Boolean);
  const result = evaluateContentCommitReadiness({
    slug,
    files,
    currentVersion,
    parentVersion,
    head,
    parent,
    originMain,
    headTags,
  });
  const errors = [...result.errors];

  try {
    await assertPromotedTargetReady(slug);
  } catch (error) {
    errors.push(error.message);
  }

  const entry = path.join(root, result.contentFile);
  try {
    const observation = await readJson(entry);
    errors.push(...validateObservation(observation, { expectedStatus: "published" }));
    if (observation.slug !== slug) errors.push(`published Observation slug must be ${slug}`);
    await readPublishedObservations();
  } catch (error) {
    errors.push(error.message);
  }
  errors.push(...await validateApprovedMedia(result.mediaManifest, { files, slug }));

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Slug-scoped content check passed: ${result.contentFile} (${result.phase})`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  await main();
}
