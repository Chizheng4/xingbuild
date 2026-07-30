#!/usr/bin/env node
import { approveAndPromoteDraft } from "./lib/content-approval.mjs";
import { assertValidSlug } from "./lib/observation-content.mjs";

const usage = "Usage: npm run content:approve -- --slug <slug> --authority <authority>";

function parseArguments(args) {
  if (args.length !== 4) throw new Error(usage);
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!["--slug", "--authority"].includes(name) || values.has(name) || !value?.trim()) {
      throw new Error(usage);
    }
    values.set(name, value);
  }
  if (values.size !== 2) throw new Error(usage);
  return {
    slug: values.get("--slug"),
    authority: values.get("--authority"),
  };
}

let parameters;
try {
  parameters = parseArguments(process.argv.slice(2));
  assertValidSlug(parameters.slug);
} catch {
  console.error(usage);
  process.exit(1);
}

const result = await approveAndPromoteDraft(parameters.slug, parameters.authority);
console.log(`Approved review recorded: ${result.review.slug} @ ${result.review.contentHash}`);
console.log(`Promoted draft to published content: content/observations/${result.review.slug}.json`);
console.log(`Draft and recovery preserved for controlled publication and retry.`);
