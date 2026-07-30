#!/usr/bin/env node
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertValidSlug,
  candidatesDirectory,
  draftsDirectory,
  hashFile,
  importsDirectory,
  isFile,
  publishedDirectory,
  reviewsDirectory,
  supersededDirectory,
} from "./lib/observation-content.mjs";

const args = process.argv.slice(2);
const valueFor = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const oldSlug = valueFor("--old-slug");
const canonicalSlug = valueFor("--canonical-slug");
const reason = valueFor("--reason");
const decidedAt = valueFor("--decided-at");

try {
  assertValidSlug(oldSlug);
  assertValidSlug(canonicalSlug);
} catch {
  console.error("Usage: npm run content:supersede -- --old-slug <slug> --canonical-slug <slug> --reason <text> --decided-at <YYYY-MM-DD>");
  process.exit(1);
}
if (oldSlug === canonicalSlug) throw new Error("Old and canonical slug must differ");
if (!reason?.trim()) throw new Error("Supersede reason is required");
if (!/^\d{4}-\d{2}-\d{2}$/.test(decidedAt || "")) throw new Error("Supersede decidedAt must use YYYY-MM-DD");

const oldDraft = path.join(draftsDirectory, `${oldSlug}.json`);
const oldPublished = path.join(publishedDirectory, `${oldSlug}.json`);
if (await isFile(oldPublished)) throw new Error(`Published observations cannot be superseded by this workflow: ${oldSlug}`);
if (!(await isFile(oldDraft))) throw new Error(`Unpublished draft not found: ${oldSlug}`);
for (const [kind, directory] of [["candidate", candidatesDirectory], ["import", importsDirectory]]) {
  if (await isFile(path.join(directory, `${oldSlug}.json`))) {
    throw new Error(`Old slug has conflicting ${kind}: ${oldSlug}`);
  }
}

const canonicalExists =
  await isFile(path.join(draftsDirectory, `${canonicalSlug}.json`)) ||
  await isFile(path.join(publishedDirectory, `${canonicalSlug}.json`));
if (!canonicalExists) throw new Error(`Canonical slug not found: ${canonicalSlug}`);

const archivedDraft = path.join(supersededDirectory, `${oldSlug}.json`);
const sidecar = path.join(supersededDirectory, `${oldSlug}.supersession.json`);
if (await isFile(archivedDraft) || await isFile(sidecar)) {
  throw new Error(`Superseded archive already exists: ${oldSlug}`);
}

const contentHash = await hashFile(oldDraft);
await mkdir(supersededDirectory, { recursive: true });
await rename(oldDraft, archivedDraft);
const oldReview = path.join(reviewsDirectory, `${oldSlug}.json`);
if (await isFile(oldReview)) {
  await rename(oldReview, path.join(supersededDirectory, `${oldSlug}.review.json`));
}
await writeFile(sidecar, `${JSON.stringify({
  supersededBy: canonicalSlug,
  reason: reason.trim(),
  decidedAt,
  contentHash,
}, null, 2)}\n`, { flag: "wx" });

console.log(`Superseded unpublished draft: ${oldSlug} -> ${canonicalSlug}`);
