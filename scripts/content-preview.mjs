#!/usr/bin/env node
import path from "node:path";
import {
  assertValidObservation,
  draftsDirectory,
  isFile,
  readJson,
} from "./lib/observation-content.mjs";

const args = process.argv.slice(2);
const slugIndex = args.indexOf("--slug");
const slug = slugIndex >= 0 ? args[slugIndex + 1] : undefined;
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run content:preview -- --slug <slug>");
  process.exit(1);
}

const draftFile = path.join(draftsDirectory, `${slug}.json`);
if (!(await isFile(draftFile))) throw new Error(`Draft not found: ${slug}`);
assertValidObservation(await readJson(draftFile), { expectedStatus: "draft" });

console.log(`Draft direct preview: http://127.0.0.1:4317/observations/${slug}?draft=1`);
console.log("Run ./start-xingbuild.command first if the local site is not already open.");
