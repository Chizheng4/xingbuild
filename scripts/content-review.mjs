#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertValidObservation,
  assertValidSlug,
  draftsDirectory,
  hashFile,
  isFile,
  readJson,
  reviewsDirectory,
} from "./lib/observation-content.mjs";

const args = process.argv.slice(2);
const valueFor = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const slug = valueFor("--slug");
const authority = valueFor("--authority");

try {
  assertValidSlug(slug);
} catch {
  console.error("Usage: npm run content:review -- --slug <slug> --authority <authority>");
  process.exit(1);
}
if (!authority?.trim()) {
  console.error("Usage: npm run content:review -- --slug <slug> --authority <authority>");
  process.exit(1);
}

const draftFile = path.join(draftsDirectory, `${slug}.json`);
const reviewFile = path.join(reviewsDirectory, `${slug}.json`);
if (!(await isFile(draftFile))) throw new Error(`Draft not found: ${slug}`);
if (await isFile(reviewFile)) throw new Error(`Review already exists: ${slug}`);
const draft = assertValidObservation(await readJson(draftFile), { expectedStatus: "draft" });
if (draft.slug !== slug) throw new Error(`Draft slug must be ${slug}`);

const review = {
  slug,
  status: "approved",
  reviewedAt: new Date().toISOString(),
  authority: authority.trim(),
  contentHash: await hashFile(draftFile),
};
await mkdir(reviewsDirectory, { recursive: true });
await writeFile(reviewFile, `${JSON.stringify(review, null, 2)}\n`, { flag: "wx" });
console.log(`Approved content review recorded: ${slug} @ ${review.contentHash}`);
