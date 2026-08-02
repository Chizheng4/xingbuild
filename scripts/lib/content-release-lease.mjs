import { existsSync } from "node:fs";
import { mkdir, open, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

export const defaultContentReleaseLeasePath = path.join(
  os.tmpdir(),
  "xingbuild-content-release-lease.json",
);

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function readLease(leasePath) {
  if (!existsSync(leasePath)) return null;
  try { return JSON.parse(await readFile(leasePath, "utf8")); } catch { return null; }
}

export async function acquireContentReleaseLease({
  slug,
  worktree,
  head,
  leasePath = defaultContentReleaseLeasePath,
  pid = process.pid,
  now = new Date().toISOString(),
} = {}) {
  if (!slug || !worktree || !head) throw new Error("content release lease requires slug, worktree and head");
  await mkdir(path.dirname(leasePath), { recursive: true });
  const existing = await readLease(leasePath);
  if (existing && processIsAlive(existing.pid)) {
    throw new Error(`content release lease is held by PID ${existing.pid} for ${existing.slug || "unknown slug"}`);
  }
  if (existing) await rm(leasePath, { force: true });
  const record = { pid, slug, worktree, head, acquiredAt: now };
  const handle = await open(leasePath, "wx");
  try {
    await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`, "utf8");
  } finally {
    await handle.close();
  }
  return record;
}

export async function releaseContentReleaseLease({
  leasePath = defaultContentReleaseLeasePath,
  pid = process.pid,
} = {}) {
  const existing = await readLease(leasePath);
  if (existing?.pid === pid) await rm(leasePath, { force: true });
}

export function chooseContentReleaseBase({
  sourceHead,
  sourceParent,
  originMain,
  sourceContainsOrigin = false,
} = {}) {
  if (!sourceHead || !sourceParent || !originMain) {
    throw new Error("content release base requires sourceHead, sourceParent and originMain");
  }
  if (originMain === sourceHead) return { mode: "post-push-retry", base: sourceHead, cherryPick: null };
  if (originMain === sourceParent) return { mode: "first-push", base: sourceHead, cherryPick: null };
  if (sourceContainsOrigin) return { mode: "source-already-includes-main", base: sourceHead, cherryPick: null };
  return { mode: "rebuild-on-latest-main", base: originMain, cherryPick: sourceHead };
}

export function assertRemoteHeadForDeployment({ remoteHead, expectedHead } = {}) {
  if (!remoteHead || !expectedHead || remoteHead !== expectedHead) {
    throw new Error(`deployment requires remote main ${expectedHead || "target HEAD"}; found ${remoteHead || "missing"}`);
  }
  return true;
}
