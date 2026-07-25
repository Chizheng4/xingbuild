#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const requiredFiles = [
  "AGENTS.md",
  "VERSION.md",
  "docs/iterations/current.md",
  "docs/rules/iteration-and-release.md",
  "src/App.jsx",
  "src/content/siteContent.js",
  "src/styles.css",
  "publish-xingbuild.command",
  "scripts/verify-public-release.mjs",
  "edgeone.json",
  ".openai/hosting.json",
  "worker/index.js",
];

for (const file of requiredFiles) {
  const info = await stat(new URL(`../${file}`, import.meta.url));
  assert(info.isFile(), `${file} must be a file`);
}

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const version = await readFile(new URL("../VERSION.md", import.meta.url), "utf8");
const current = await readFile(
  new URL("../docs/iterations/current.md", import.meta.url),
  "utf8",
);
const content = await readFile(
  new URL("../src/content/siteContent.js", import.meta.url),
  "utf8",
);
const edgeOneConfig = JSON.parse(
  await readFile(new URL("../edgeone.json", import.meta.url), "utf8"),
);

assert.match(packageJson.version, /^\d+\.\d+\.\d+$/, "package version must use x.y.z");
assert(
  version.includes(`v${packageJson.version}`),
  "VERSION.md must contain the package version",
);
assert(
  current.includes(`v${packageJson.version}`),
  "current iteration must contain the package version",
);
assert(content.includes("Robotaxi"), "site content must include the Robotaxi work");
assert(content.includes("企业经营"), "site content must include the cognition work");
assert.deepEqual(edgeOneConfig.redirects, [
  {
    source: "$wwwhost",
    destination: "$host",
    statusCode: 301,
  },
]);

console.log(`xingbuild project check passed for v${packageJson.version}`);
