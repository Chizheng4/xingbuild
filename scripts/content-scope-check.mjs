#!/usr/bin/env node
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
  const normalized = files.filter(Boolean).map((file) => file.replaceAll("\\", "/"));
  const entries = normalized.filter((file) => file === `content/observations/${slug}.json`);
  const rejected = normalized.filter((file) => !entries.includes(file) && file !== `content/media/${slug}/manifest.json` && !file.startsWith(`public/media/${slug}/`));
  const errors = [];
  if (!slug || entries.length !== 1) errors.push(`content release must contain exactly one explicit Observation target`);
  if (rejected.length) errors.push(`content release contains forbidden files: ${rejected.join(", ")}`);
  return errors;
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
    if (asset?.provenance?.approvalStatus !== "approved") errors.push(`media asset ${label} provenance approvalStatus must be approved`);
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
      errors.push(`media asset ${label} file must be present in the content package: ${publicFile}`);
      continue;
    }
    try {
      if (await hashFile(path.join(rootDirectory, publicFile)) !== asset.assetSha256) errors.push(`media asset ${label} SHA-256 mismatch`);
    } catch {
      errors.push(`media asset ${label} file is missing: ${publicFile}`);
    }
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf("--slug");
  const slug = slugIndex >= 0 ? args[slugIndex + 1] : undefined;
  try { assertValidSlug(slug); } catch {
    console.error("Usage: npm run content:scope-check -- --slug <slug>");
    process.exitCode = 1;
    return;
  }
  const result = evaluateContentCommitReadiness({ slug, files: [`content/observations/${slug}.json`] });
  const errors = [...result.errors];
  try { await assertPromotedTargetReady(slug); } catch (error) { errors.push(error.message); }
  const entry = path.join(root, result.contentFile);
  try {
    const observation = await readJson(entry);
    errors.push(...validateObservation(observation, { expectedStatus: "published" }));
    if (observation.slug !== slug) errors.push(`published Observation slug must be ${slug}`);
    await readPublishedObservations();
  } catch (error) { errors.push(error.message); }
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Content target check passed: ${result.contentFile} (${result.phase})`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) await main();
