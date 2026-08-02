#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { acquireContentReleaseLease, releaseContentReleaseLease } from "./lib/content-release-lease.mjs";
import { formatVersion, parseCurrentVersion } from "./lib/unified-release.mjs";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const expectedOrigin = "https://github.com/Chizheng4/xingbuild.git";
export const edgeoneProject = process.env.XINGBUILD_EDGEONE_PROJECT || "xingbuild-nochina";
export const publicUrl = process.env.XINGBUILD_PUBLIC_URL || "https://xingbuild.top/";
const edgeone = path.join(root, "node_modules", ".bin", "edgeone");

export function git(args, cwd = root) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function run(command, args, cwd, { env = process.env } = {}) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? "unknown"}`);
}

function capture(command, args, cwd, input) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", input });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || "unknown error"}`);
  return result.stdout;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export function trackedDirtyPaths(statusText = "") {
  return statusText.split("\n").filter(Boolean).map((line) => line.slice(3).trim()).filter(Boolean);
}

export function isPublishAuthorized({ argv = process.argv.slice(2), env = process.env } = {}) {
  return argv.includes("--authorize-publish") || env.XINGBUILD_PUBLISH_AUTHORIZATION === "confirmed";
}

export function assertPublishAuthorization(options = {}) {
  if (!isPublishAuthorized(options)) {
    throw new Error("publish authorization is required (--authorize-publish or XINGBUILD_PUBLISH_AUTHORIZATION=confirmed)");
  }
}

export function assertAcceptedCurrent(currentText) {
  if (!/(?:产品\/视觉验收通过|产品\/视觉已验收|产品\/视觉验收：通过)/.test(currentText)) {
    throw new Error("current.md does not record completed product/visual acceptance");
  }
}

export async function readAcceptedVersion(sourceCwd = root) {
  const packageJson = JSON.parse(await readFile(path.join(sourceCwd, "package.json"), "utf8"));
  const packageLock = JSON.parse(await readFile(path.join(sourceCwd, "package-lock.json"), "utf8"));
  const versionText = await readFile(path.join(sourceCwd, "VERSION.md"), "utf8");
  const currentText = await readFile(path.join(sourceCwd, "docs/iterations/current.md"), "utf8");
  const version = formatVersion(packageJson.version);
  const expectedNumber = version.slice(1);
  if (packageLock.version !== expectedNumber || packageLock.packages?.[""]?.version !== expectedNumber) {
    throw new Error("package.json and package-lock.json versions are not aligned");
  }
  if (!versionText.includes(`## ${version}`)) throw new Error(`VERSION.md does not record ${version}`);
  if (parseCurrentVersion(currentText) !== version) throw new Error(`current.md does not record ${version}`);
  assertAcceptedCurrent(currentText);
  const historyFile = path.join(sourceCwd, "docs/iterations/history", `${version}.md`);
  if (!(await exists(historyFile))) throw new Error(`missing history record for ${version}`);
  return { version, packageJson, packageLock, versionText, currentText, historyFile };
}

export async function collectPublishContext(sourceCwd = root) {
  const resolved = path.resolve(sourceCwd);
  if (resolved !== root) throw new Error(`publish source cwd must be canonical direct-local: ${root}`);
  if (git(["symbolic-ref", "--short", "HEAD"], resolved) !== "main") throw new Error("publish source must be on main");
  const status = git(["status", "--porcelain"], resolved);
  if (status) throw new Error(`publish source worktree is dirty: ${trackedDirtyPaths(status).join(", ")}`);
  const identity = await readAcceptedVersion(resolved);
  const head = git(["rev-parse", "HEAD"], resolved);
  const tag = identity.version;
  if (git(["cat-file", "-t", tag], resolved) !== "tag") throw new Error(`${tag} is not an annotated tag`);
  const taggedCommit = git(["rev-parse", `${tag}^{commit}`], resolved);
  if (taggedCommit !== head) throw new Error(`${tag} points to ${taggedCommit}; expected HEAD ${head}`);
  return { sourceCwd: resolved, head, tag, version: identity.version, historyFile: identity.historyFile, dirtyPaths: [] };
}

function configureNetwork() {
  const proxy = process.env.XINGBUILD_GITHUB_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy || "http://127.0.0.1:7897";
  const probe = spawnSync("curl", ["-fsSI", "--http1.1", "--proxy", proxy, "--connect-timeout", "3", "--max-time", "8", "https://github.com"]);
  if (probe.status === 0) {
    for (const name of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) process.env[name] = proxy;
    process.env.NODE_USE_ENV_PROXY = "1";
    return;
  }
  for (const name of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) delete process.env[name];
  run("curl", ["-fsSI", "--http1.1", "--noproxy", "*", "--connect-timeout", "10", "--max-time", "15", "https://github.com"], root);
}

async function cleanup(worktree) {
  if (!worktree) return;
  try { run("git", ["worktree", "remove", "--force", worktree], root); } catch {}
  await rm(worktree, { recursive: true, force: true });
}

function targetConfig(kind, target, version, commit) {
  if (kind === "product") return { verify: ["node", ["scripts/verify-public-release.mjs", publicUrl, version, commit]] };
  if (kind === "content") return {
    scope: ["npm", ["run", "content:scope-check", "--", "--slug", target, "--commit", "HEAD"]],
    verify: ["node", ["scripts/verify-content-release.mjs", publicUrl, version, commit, `/observations/${target}`, "--finalize"]],
    targetFile: `content/observations/${target}.json`,
  };
  if (kind === "article") return {
    scope: ["npm", ["run", "article:scope-check", "--", "--slug", target, "--commit", "HEAD"]],
    verify: ["node", ["scripts/verify-article-release.mjs", publicUrl, version, commit, target]],
    targetFile: `content/articles/${target}.json`,
  };
  if (kind === "practice") return {
    scope: ["npm", ["run", "practice:scope-check", "--", "--id", target, "--commit", "HEAD"]],
    verify: ["node", ["scripts/verify-practice-release.mjs", publicUrl, version, commit, "--id", target]],
    targetFile: `content/products/${target}.json`,
  };
  throw new Error(`unknown unified publish kind: ${kind}`);
}

async function createBuildSandbox(base) {
  const worktree = await mkdtemp(path.join(os.tmpdir(), "xingbuild-unified-build-"));
  try {
    run("git", ["worktree", "add", "--detach", worktree, base], root);
    if (await exists(path.join(root, "node_modules"))) {
      await symlink(path.join(root, "node_modules"), path.join(worktree, "node_modules"), "dir");
      const excludePath = capture("git", ["rev-parse", "--git-path", "info/exclude"], worktree).trim();
      const exclude = await readFile(excludePath, "utf8");
      if (!exclude.split("\n").includes("/node_modules")) await writeFile(excludePath, `${exclude.trimEnd()}\n/node_modules\n`);
    }
    return worktree;
  } catch (error) {
    await cleanup(worktree);
    throw error;
  }
}

async function runValidatedBuild({ buildWorktree, kind, target }) {
  const env = { ...process.env, XINGBUILD_RELEASE_WORKTREE: "1" };
  const config = targetConfig(kind, target, "VERSION_FROM_SOURCE", "HEAD");
  if (config.scope) run(config.scope[0], config.scope[1], buildWorktree, { env });
  run("npm", ["run", "release:check"], buildWorktree, { env });
  const dirtyPaths = trackedDirtyPaths(git(["status", "--porcelain"], buildWorktree));
  if (dirtyPaths.length) throw new Error(`build polluted tracked paths: ${dirtyPaths.join(", ")}`);
  return { dirtyPaths };
}

export async function publish({ kind, target, argv = process.argv.slice(2), env = process.env } = {}) {
  if (git(["remote", "get-url", "origin"]) !== expectedOrigin) throw new Error("origin is not the expected xingbuild repository");
  if (!(await exists(edgeone))) throw new Error("EdgeOne CLI is not installed in the project");
  const source = await collectPublishContext(root);
  const worktree = await createBuildSandbox(source.head);
  let lease;
  let buildContext = { sourceCwd: source.sourceCwd, buildWorktree: worktree, head: source.head, tag: source.tag, dirtyPaths: [] };
  try {
    const config = targetConfig(kind, target, source.version, source.head);
    lease = kind === "product" ? null : await acquireContentReleaseLease({ slug: `${kind}:${target}`, worktree, head: source.head });
    await runValidatedBuild({ buildWorktree: worktree, kind, target });
    const sourceDirtyPaths = trackedDirtyPaths(git(["status", "--porcelain"], root));
    const buildDirtyPaths = trackedDirtyPaths(git(["status", "--porcelain"], worktree));
    if (sourceDirtyPaths.length) throw new Error(`source changed during build: ${sourceDirtyPaths.join(", ")}`);
    if (buildDirtyPaths.length) throw new Error(`build polluted tracked paths: ${buildDirtyPaths.join(", ")}`);
    buildContext = { ...buildContext, dirtyPaths: buildDirtyPaths };
    run("npm", ["run", "release:preflight"], root, { env: { ...env, XINGBUILD_RELEASE_WORKTREE: "1" } });
    assertPublishAuthorization({ argv, env });
    configureNetwork();
    run(edgeone, ["whoami"], root);
    run("git", ["push", "origin", "HEAD:main"], root);
    run("git", ["push", "origin", source.tag], root);
    const remote = git(["ls-remote", "origin", "refs/heads/main"], root).split(/\s+/)[0];
    if (remote !== source.head) throw new Error(`remote main is ${remote}; expected ${source.head}`);
    run(edgeone, ["makers", "deploy", path.join(worktree, "dist", "client"), "--name", edgeoneProject, "--env", "production"], root);
    run(config.verify[0], config.verify[1], worktree, { env: { ...env, XINGBUILD_RELEASE_WORKTREE: "1" } });
    return { ...source, ...buildContext, kind, target, online: true };
  } catch (error) {
    error.publishContext = buildContext;
    throw error;
  } finally {
    if (lease) await releaseContentReleaseLease({});
    await cleanup(worktree);
  }
}

export async function main(argv = process.argv.slice(2)) {
  const kind = argv[argv.indexOf("--kind") + 1];
  const target = argv[argv.indexOf("--slug") + 1] || argv[argv.indexOf("--id") + 1] || "";
  if (!['product', 'content', 'article', 'practice'].includes(kind)) throw new Error("Usage: node scripts/unified-publish.mjs --kind <product|content|article|practice> [--slug <slug>|--id <id>] [--authorize-publish]");
  if (kind !== "product" && !target) throw new Error("Unified publish requires one explicit target");
  const result = await publish({ kind, target, argv });
  console.log(`Unified release completed: ${result.version} ${result.head} ${result.kind}${result.target ? ` ${result.target}` : ""}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try {
    await main();
  } catch (error) {
    const context = error.publishContext ? ` context=${JSON.stringify(error.publishContext)}` : "";
    console.error(`统一版本发布已停止：${error.message}${context}`);
    process.exitCode = 1;
  }
}
