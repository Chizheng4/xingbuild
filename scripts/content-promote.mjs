#!/usr/bin/env node
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertValidObservation,
  draftsDirectory,
  isFile,
  publishedDirectory,
  readJson,
} from "./lib/observation-content.mjs";

const args = process.argv.slice(2);
const slugIndex = args.indexOf("--slug");
const slug = slugIndex >= 0 ? args[slugIndex + 1] : undefined;
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run content:promote -- --slug <slug>");
  process.exit(1);
}

const draftFile = path.join(draftsDirectory, `${slug}.json`);
const publishedFile = path.join(publishedDirectory, `${slug}.json`);
if (!(await isFile(draftFile))) throw new Error(`Draft not found: ${slug}`);
if (await isFile(publishedFile)) throw new Error(`Published observation already exists: ${slug}`);

const draft = await readJson(draftFile);
const publication = { ...draft, status: "published" };
assertValidObservation(publication, { expectedStatus: "published" });

await mkdir(publishedDirectory, { recursive: true });
await writeFile(draftFile, `${JSON.stringify(publication, null, 2)}\n`);
await rename(draftFile, publishedFile);
console.log(`Promoted draft to published content: content/observations/${slug}.json`);
