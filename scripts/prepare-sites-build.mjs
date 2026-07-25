#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");
const edgeOneConfig = path.join(root, "edgeone.json");

for (const file of [index, worker, hosting, edgeOneConfig]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
copyFileSync(edgeOneConfig, path.join(dist, "client", "edgeone.json"));

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();

writeFileSync(
  path.join(dist, "client", "release.json"),
  `${JSON.stringify(
    {
      version: `v${packageJson.version}`,
      commit,
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
);

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
