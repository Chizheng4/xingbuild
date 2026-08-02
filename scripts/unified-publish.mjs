#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  acquireContentReleaseLease,
  releaseContentReleaseLease,
} from "./lib/content-release-lease.mjs";
import {
  formatVersion,
  incrementPatch,
  updateUnifiedVersionFiles,
} from "./lib/unified-release.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedOrigin = "https://github.com/Chizheng4/xingbuild.git";
const edgeoneProject = process.env.XINGBUILD_EDGEONE_PROJECT || "xingbuild-nochina";
const publicUrl = process.env.XINGBUILD_PUBLIC_URL || "https://xingbuild.top/";
const edgeone = path.join(root, "node_modules", ".bin", "edgeone");

function git(args, cwd = root) {
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

function targetConfig(kind, target) {
  if (kind === "product") return {
    verify: ["node", ["scripts/verify-public-release.mjs", publicUrl, null, null]],
  };
  if (kind === "content") return {
    scope: ["npm", ["run", "content:scope-check", "--", "--slug", target, "--commit", "HEAD"]],
    verify: ["node", ["scripts/verify-content-release.mjs", publicUrl, null, null, `/observations/${target}`, "--finalize"]],
    targetFile: `content/observations/${target}.json`,
  };
  if (kind === "article") return {
    scope: ["npm", ["run", "article:scope-check", "--", "--slug", target, "--commit", "HEAD"]],
    verify: ["node", ["scripts/verify-article-release.mjs", publicUrl, null, null, target]],
    targetFile: `content/articles/${target}.json`,
  };
  if (kind === "practice") return {
    scope: ["npm", ["run", "practice:scope-check", "--", "--id", target, "--commit", "HEAD"]],
    verify: ["node", ["scripts/verify-practice-release.mjs", publicUrl, null, null, "--id", target]],
    targetFile: `content/products/${target}.json`,
  };
  throw new Error(`unknown unified publish kind: ${kind}`);
}

async function createReleaseWorktree(base) {
  const worktree = await mkdtemp(path.join(os.tmpdir(), "xingbuild-unified-release-"));
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

async function writeHistory(worktree, version, kind, target) {
  const file = path.join(worktree, "docs", "iterations", "history", `${version}.md`);
  await writeFile(file, `# ${version} 统一版本发布\n\n## 结果\n\n- 状态：Engineering 统一版本发布进行中。\n- 范围：${kind} 正式公开表达 ${target} 与统一版本合同。\n- 产品版本、内容、Git、annotated tag、EdgeOne 与公网 manifest 使用同一版本身份。\n\n## 验收\n\n- 本地 release:check、scope/readiness、build、Sites 与公网验证由 Engineering 记录。\n`);
}

async function publish({ kind, target }) {
  if (git(["remote", "get-url", "origin"]) !== expectedOrigin) throw new Error("origin is not the expected xingbuild repository");
  if (!(await exists(edgeone))) throw new Error("EdgeOne CLI is not installed in the project");
  configureNetwork();
  run(edgeone, ["whoami"], root);

  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const parentVersion = formatVersion(packageJson.version);
  const targetVersion = kind === "product" ? formatVersion("v0.24.0") : incrementPatch(parentVersion);
  const config = targetConfig(kind, target);
  const sourceHead = git(["rev-parse", "HEAD"]);
  const sourceStatus = git(["status", "--porcelain"]);
  if (sourceStatus) throw new Error("release source worktree must be clean before unified publish");
  run("git", ["fetch", "origin", "main"], root);
  const originMain = git(["rev-parse", "origin/main"]);
  const worktree = await createReleaseWorktree(sourceHead);
  let lease;
  try {
    lease = await acquireContentReleaseLease({ slug: `${kind}:${target}`, worktree, head: sourceHead });
    await updateUnifiedVersionFiles(worktree, targetVersion);
    await writeHistory(worktree, targetVersion, kind, target || "product");

    const historyFile = `docs/iterations/history/${targetVersion}.md`;
    const changedFiles = ["package.json", "package-lock.json", "VERSION.md", "docs/iterations/current.md", historyFile];
    if (kind !== "product") changedFiles.push(config.targetFile);
    if (kind === "practice") changedFiles.push("content/media/robotaxi/manifest.json");
    run("git", ["add", ...changedFiles], worktree);
    run("npm", ["run", "release:closeout-check"], worktree, { env: { ...process.env, XINGBUILD_RELEASE_WORKTREE: "1" } });
    run("git", ["commit", "-m", `release: ${targetVersion} unified ${kind}${target ? ` ${target}` : ""}`], worktree);
    const commit = git(["rev-parse", "HEAD"], worktree);
    if (kind !== "product") run(config.scope[0], config.scope[1], worktree);
    run("git", ["tag", "-a", targetVersion, "-m", `${targetVersion} unified release`], worktree);

    const env = { ...process.env, XINGBUILD_RELEASE_WORKTREE: "1" };
    run("npm", ["run", "release:check"], worktree, { env });
    run("npm", ["run", "release:preflight"], worktree, { env });
    run("npm", ["run", "build"], worktree, { env });
    run("npm", ["run", "test:sites"], worktree, { env });

    run("git", ["push", "origin", `HEAD:main`], worktree);
    run("git", ["push", "origin", targetVersion], worktree);
    const remote = git(["ls-remote", "origin", "refs/heads/main"], worktree).split(/\s+/)[0];
    if (remote !== commit) throw new Error(`remote main is ${remote}; expected ${commit}`);
    run(edgeone, ["makers", "deploy", path.join(worktree, "dist", "client"), "--name", edgeoneProject, "--env", "production"], root);

    const finalArgs = config.verify[1].map((value, index) => value === null
      ? (index === 1 ? targetVersion : commit)
      : value);
    run(config.verify[0], finalArgs, worktree, { env });
    return { version: targetVersion, commit, tag: targetVersion, kind, target };
  } finally {
    if (lease) await releaseContentReleaseLease({});
    await cleanup(worktree);
  }
}

const args = process.argv.slice(2);
const kind = args[args.indexOf("--kind") + 1];
const target = args[args.indexOf("--slug") + 1] || args[args.indexOf("--id") + 1] || "";
if (!["product", "content", "article", "practice"].includes(kind)) throw new Error("Usage: node scripts/unified-publish.mjs --kind <product|content|article|practice> --slug <slug>|--id <id>");
if (kind !== "product" && !target) throw new Error("Unified publish requires one explicit target");

try {
  const result = await publish({ kind, target });
  console.log(`Unified release completed: ${result.version} ${result.commit} ${result.kind}${result.target ? ` ${result.target}` : ""}`);
} catch (error) {
  console.error(`统一版本发布已停止：${error.message}`);
  process.exitCode = 1;
}
