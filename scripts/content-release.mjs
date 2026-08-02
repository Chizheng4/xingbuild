#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--slug" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args[1])) {
  console.error("Usage: node scripts/content-release.mjs --slug <slug>");
  process.exit(1);
}

execFileSync(process.execPath, [path.join(root, "scripts", "unified-publish.mjs"), "--kind", "content", "--slug", args[1]], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
