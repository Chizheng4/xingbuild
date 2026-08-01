import { execFileSync, spawn } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const previewPort = 4317;
export const previewRecordPath = `/tmp/xingbuild-preview-${previewPort}.json`;

function projectRoot() {
  return path.resolve(fileURLToPath(new URL("..", import.meta.url)));
}

function currentIdentity(root = projectRoot()) {
  const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  return {
    cwd: root,
    commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    version: `v${packageJson}`,
  };
}

export function isPreviewRecordFor(record, identity) {
  return Boolean(record)
    && record.port === previewPort
    && record.cwd === identity.cwd
    && record.commit === identity.commit
    && record.version === identity.version;
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readRecord() {
  if (!existsSync(previewRecordPath)) return null;
  try {
    return JSON.parse(await readFile(previewRecordPath, "utf8"));
  } catch {
    return null;
  }
}

async function releaseRecord(pid) {
  const record = await readRecord();
  if (record?.pid === pid) await unlink(previewRecordPath).catch(() => {});
}

async function checkExisting(url, identity) {
  try {
    const response = await fetch(new URL("/__xingbuild/preview-meta", url), { cache: "no-store" });
    if (!response.ok) return false;
    const served = await response.json();
    const matches = isPreviewRecordFor(served, identity);
    if (!matches) {
      console.error(`Preview identity mismatch: served=${JSON.stringify(served)} expected=${JSON.stringify(identity)}`);
    }
    return matches;
  } catch {
    return false;
  }
}

async function reserve(identity) {
  const existing = await readRecord();
  if (existing && isProcessAlive(existing.pid)) {
    throw new Error(`Preview lease is owned by PID ${existing.pid} (${existing.cwd}, ${existing.commit})`);
  }
  if (existing) await unlink(previewRecordPath).catch(() => {});
  const record = {
    ...identity,
    pid: process.pid,
    port: previewPort,
    taskId: process.env.XBUILD_TASK_ID || "local",
    startedAt: new Date().toISOString(),
  };
  await writeFile(previewRecordPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return record;
}

async function runPreview() {
  const root = projectRoot();
  const identity = currentIdentity(root);
  await reserve(identity);
  const env = {
    ...process.env,
    XINGBUILD_PREVIEW_CWD: identity.cwd,
    XINGBUILD_PREVIEW_COMMIT: identity.commit,
    XINGBUILD_PREVIEW_VERSION: identity.version,
    XINGBUILD_PREVIEW_TASK_ID: process.env.XBUILD_TASK_ID || "local",
  };
  const child = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(previewPort), "--strictPort", "--open", "/"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  let stopping = false;
  const stop = (signal) => {
    if (stopping) return;
    stopping = true;
    if (!child.killed) child.kill(signal);
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGHUP", () => stop("SIGHUP"));
  const exitCode = await new Promise((resolve) => {
    child.once("error", (error) => {
      console.error(error.message);
      resolve(1);
    });
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  await releaseRecord(process.pid);
  process.exitCode = exitCode;
}

async function main() {
  const [command, url] = process.argv.slice(2);
  const identity = currentIdentity();
  if (command === "check") {
    process.exitCode = await checkExisting(url || `http://127.0.0.1:${previewPort}/`, identity) ? 0 : 1;
    return;
  }
  await runPreview();
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) await main();
