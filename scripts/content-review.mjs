#!/usr/bin/env node
import { recordApprovedReview } from "./lib/content-approval.mjs";
import { assertValidSlug } from "./lib/observation-content.mjs";

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

const { review } = await recordApprovedReview(slug, authority);
console.log(`Approved content review recorded: ${slug} @ ${review.contentHash}`);
