#!/usr/bin/env node
import { constants } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertTargetWorkspaceReady,
  assertUniqueProductionIdentity,
  assertValidSlug,
  isFile,
  publishedDirectory,
  recoveriesDirectory,
} from "./lib/observation-content.mjs";

const args = process.argv.slice(2);
const slugIndex = args.indexOf("--slug");
const slug = slugIndex >= 0 ? args[slugIndex + 1] : undefined;
try {
  assertValidSlug(slug);
} catch {
  console.error("Usage: npm run content:promote -- --slug <slug>");
  process.exit(1);
}

const publishedFile = path.join(publishedDirectory, `${slug}.json`);
if (await isFile(publishedFile)) throw new Error(`Published observation already exists: ${slug}`);

const { draft, draftFile } = await assertTargetWorkspaceReady(slug);
await assertUniqueProductionIdentity(draft);
const publication = { ...draft, status: "published" };

const recoveryFile = path.join(recoveriesDirectory, `${slug}.json`);
await mkdir(recoveriesDirectory, { recursive: true });
if (await isFile(recoveryFile)) {
  throw new Error(`Recovery already exists: ${slug}`);
}
await copyFile(draftFile, recoveryFile, constants.COPYFILE_EXCL);
await mkdir(publishedDirectory, { recursive: true });
try {
  await writeFile(publishedFile, `${JSON.stringify(publication, null, 2)}\n`, { flag: "wx" });
} catch (error) {
  throw new Error(`Promotion failed after recovery was preserved: ${error.message}`);
}
console.log(`Promoted draft to published content: content/observations/${slug}.json`);
console.log(`Reviewed draft preserved for exact recovery: .content-workspace/recoveries/${slug}.json`);
