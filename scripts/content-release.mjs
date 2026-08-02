#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  acquireContentReleaseLease,
  assertRemoteHeadForDeployment,
  chooseContentReleaseBase,
  releaseContentReleaseLease,
} from "./lib/content-release-lease.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedOrigin = "https://github.com/Chizheng4/xingbuild.git";
const edgeone = path.join(root, "node_modules", ".bin", "edgeone");
const publicUrl = process.env.XINGBUILD_PUBLIC_URL || "https://xingbuild.top/";
const edgeoneProject = process.env.XINGBUILD_EDGEONE_PROJECT || "xingbuild-nochina";

function git(args, cwd = root) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? "unknown"}`);
}

function configureGitNetwork() {
  const candidate = process.env.XINGBUILD_GITHUB_PROXY
    || process.env.HTTPS_PROXY
    || process.env.https_proxy
    || "http://127.0.0.1:7897";
  const proxyCheck = spawnSync("curl", ["-fsSI", "--http1.1", "--proxy", candidate, "--connect-timeout", "3", "--max-time", "8", "https://github.com"]);
  if (proxyCheck.status === 0) {
    for (const name of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) process.env[name] = candidate;
    process.env.NODE_USE_ENV_PROXY = "1";
    return;
  }
  for (const name of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) delete process.env[name];
  const directCheck = spawnSync("curl", ["-fsSI", "--http1.1", "--noproxy", "*", "--connect-timeout", "10", "--max-time", "15", "https://github.com"]);
  if (directCheck.status !== 0) throw new Error("cannot connect to GitHub through proxy or direct network");
}

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

function validSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || "");
}

function isAncestor(ancestor, descendant) {
  return spawnSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: root }).status === 0;
}

function fetchOrigin() {
  run("git", ["fetch", "origin", "main"], root);
  return git(["rev-parse", "origin/main"], root);
}

async function cleanupWorktree(worktree) {
  if (!worktree) return;
  try { run("git", ["worktree", "remove", "--force", worktree], root); } catch {}
  await rm(worktree, { recursive: true, force: true });
}

async function createWorktree(plan) {
  const worktree = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-release-"));
  try {
    run("git", ["worktree", "add", "--detach", worktree, plan.base], root);
    if (await exists(path.join(root, "node_modules"))) {
      await symlink(path.join(root, "node_modules"), path.join(worktree, "node_modules"), "dir");
    }
    if (plan.cherryPick) run("git", ["cherry-pick", plan.cherryPick], worktree);
    return worktree;
  } catch (error) {
    await cleanupWorktree(worktree);
    throw error;
  }
}

async function prepareWorktree(sourceHead, sourceParent, originMain) {
  const plan = chooseContentReleaseBase({
    sourceHead,
    sourceParent,
    originMain,
    sourceContainsOrigin: isAncestor(originMain, sourceHead),
  });
  const worktree = await createWorktree(plan);
  return { ...plan, worktree, head: git(["rev-parse", "HEAD"], worktree) };
}

async function main() {
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf("--slug");
  const slug = slugIndex >= 0 ? args[slugIndex + 1] : "";
  if (!validSlug(slug) || args.filter((arg) => arg === "--slug").length !== 1) {
    throw new Error("Usage: ./publish-content.command --slug <slug>");
  }
  if (git(["remote", "get-url", "origin"]) !== expectedOrigin) throw new Error("origin is not the expected xingbuild repository");
  if (!await exists(edgeone)) throw new Error("EdgeOne CLI is not installed in the project");
  configureGitNetwork();
  run(edgeone, ["whoami"], root);

  const sourceHead = git(["rev-parse", "HEAD"], root);
  const sourceParent = git(["rev-parse", "HEAD^"], root);
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const version = `v${packageJson.version}`;
  const leasePath = process.env.XINGBUILD_CONTENT_LEASE_PATH;
  let worktree;
  let lease;
  try {
    let originMain = fetchOrigin();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const prepared = await prepareWorktree(sourceHead, sourceParent, originMain);
      worktree = prepared.worktree;
      lease = await acquireContentReleaseLease({ slug, worktree, head: prepared.head, ...(leasePath ? { leasePath } : {}) });
      const releaseLease = () => releaseContentReleaseLease({ ...(leasePath ? { leasePath } : {}) });
      const remoteBeforeChecks = fetchOrigin();
      if (remoteBeforeChecks !== originMain) {
        originMain = remoteBeforeChecks;
        await releaseLease();
        lease = null;
        await cleanupWorktree(worktree);
        worktree = null;
        continue;
      }

      run("npm", ["run", "content:check"], worktree);
      run("npm", ["run", "content:scope-check", "--", "--slug", slug, "--commit", "HEAD"], worktree);
      run("npm", ["run", "build"], worktree);
      run("npm", ["run", "test:sites"], worktree);

      const parent = git(["rev-parse", "HEAD^"], worktree);
      const head = git(["rev-parse", "HEAD"], worktree);
      const remoteBeforePush = fetchOrigin();
      if (remoteBeforePush !== parent && remoteBeforePush !== head) {
        originMain = remoteBeforePush;
        await releaseLease();
        lease = null;
        await cleanupWorktree(worktree);
        worktree = null;
        continue;
      }
      if (remoteBeforePush === parent) run("git", ["push", "origin", "HEAD:main"], worktree);
      const remoteAfterPush = fetchOrigin();
      assertRemoteHeadForDeployment({ remoteHead: remoteAfterPush, expectedHead: head });
      assertRemoteHeadForDeployment({ remoteHead: fetchOrigin(), expectedHead: head });
      run(edgeone, ["makers", "deploy", path.join(worktree, "dist", "client"), "--name", edgeoneProject, "--env", "production"], root);
      run("node", ["scripts/verify-content-release.mjs", publicUrl, version, head, `/observations/${slug}`, "--finalize"], worktree);
      console.log(`Content release completed: ${slug} ${head}`);
      return;
    }
    throw new Error("main advanced repeatedly; no stable content release HEAD");
  } finally {
    if (lease) await releaseContentReleaseLease({ ...(leasePath ? { leasePath } : {}) });
    await cleanupWorktree(worktree);
  }
}

try {
  await main();
} catch (error) {
  if (error.message.startsWith("Usage:")) console.log(error.message);
  else console.error(`内容发布已停止：${error.message}`);
  process.exitCode = 1;
}
