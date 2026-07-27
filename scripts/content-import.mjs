#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertValidObservation,
  draftsDirectory,
  isFile,
  projectRoot,
  publishedDirectory,
  readJson,
} from "./lib/observation-content.mjs";

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
const input = inputIndex >= 0 ? args[inputIndex + 1] : undefined;
if (!input) {
  console.error("Usage: npm run content:import -- --input <candidate.json>");
  process.exit(1);
}

const inputFile = path.resolve(process.cwd(), input);
const candidate = await readJson(inputFile);
if (candidate.status && candidate.status !== "draft") {
  throw new Error("Candidate status must be draft or omitted");
}
const draft = { ...candidate, status: "draft" };
assertValidObservation(draft, { expectedStatus: "draft" });

const publishedFile = path.join(publishedDirectory, `${draft.slug}.json`);
const draftFile = path.join(draftsDirectory, `${draft.slug}.json`);
if (await isFile(publishedFile)) throw new Error(`Published observation already exists: ${draft.slug}`);
if (await isFile(draftFile)) throw new Error(`Draft observation already exists: ${draft.slug}`);

await mkdir(draftsDirectory, { recursive: true });
await writeFile(draftFile, `${JSON.stringify(draft, null, 2)}\n`, { flag: "wx" });
console.log(`Imported candidate as isolated draft: ${path.relative(projectRoot, draftFile)}`);
