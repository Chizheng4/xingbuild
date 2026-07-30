#!/usr/bin/env node
import { promoteApprovedDraft } from "./lib/content-approval.mjs";
import { assertValidSlug } from "./lib/observation-content.mjs";

const args = process.argv.slice(2);
const slugIndex = args.indexOf("--slug");
const slug = slugIndex >= 0 ? args[slugIndex + 1] : undefined;
try {
  assertValidSlug(slug);
} catch {
  console.error("Usage: npm run content:promote -- --slug <slug>");
  process.exit(1);
}

await promoteApprovedDraft(slug);
console.log(`Promoted draft to published content: content/observations/${slug}.json`);
console.log(`Reviewed draft preserved for exact recovery: .content-workspace/recoveries/${slug}.json`);
