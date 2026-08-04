import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const CONTENT_RELEASE_STATES = Object.freeze([
  "prepared",
  "built",
  "transported",
  "verifying",
  "finalized",
  "released",
  "failed",
  "recoverable",
  "rolled-back",
]);

const ordered = new Map(["prepared", "built", "transported", "verifying", "finalized", "released"].map((state, index) => [state, index]));

export function contentReleaseIdempotencyKey({ contentReleaseId, contentHash, baseSiteArtifactId } = {}) {
  if (![contentReleaseId, contentHash, baseSiteArtifactId].every((value) => typeof value === "string" && value.length > 0)) {
    throw new Error("content release idempotency key requires contentReleaseId, contentHash and baseSiteArtifactId");
  }
  return createHash("sha256").update(`${contentReleaseId}:${contentHash}:${baseSiteArtifactId}`).digest("hex");
}

export async function readContentReleaseState(packageDirectory) {
  try { return JSON.parse(await readFile(path.join(packageDirectory, "content-release.json"), "utf8")); } catch { return null; }
}

export async function writeJsonAtomically(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
}

export async function acquireContentReleasePackageLease({ packageDirectory, idempotencyKey, contentReleaseId = idempotencyKey, now = Date.now(), ttlMs = 120000 } = {}) {
  const leasePath = path.join(packageDirectory, "lease.json");
  await mkdir(packageDirectory, { recursive: true });
  try {
    const existing = JSON.parse(await readFile(leasePath, "utf8"));
    if (existing.idempotencyKey === idempotencyKey && Number(existing.expiresAt) > now && existing.pid !== process.pid) {
      throw new Error(`content release package lease is held for ${existing.contentReleaseId}`);
    }
    if (Number(existing.expiresAt) <= now) await rm(leasePath, { force: true });
  } catch (error) {
    if (error.code !== "ENOENT" && !/Unexpected token|JSON/.test(error.message)) throw error;
  }
  const lease = { idempotencyKey, contentReleaseId, pid: process.pid, acquiredAt: new Date(now).toISOString(), expiresAt: now + ttlMs };
  await writeJsonAtomically(leasePath, lease);
  return { leasePath, lease };
}

export async function releaseContentReleasePackageLease({ leasePath, idempotencyKey } = {}) {
  if (!leasePath) return;
  try {
    const lease = JSON.parse(await readFile(leasePath, "utf8"));
    if (!idempotencyKey || lease.idempotencyKey === idempotencyKey) await rm(leasePath, { force: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function canResumeState(state, minimum) {
  return ordered.has(state) && ordered.has(minimum) && ordered.get(state) >= ordered.get(minimum);
}

export function assertContentReleaseTransition(from, to) {
  if (!CONTENT_RELEASE_STATES.includes(to)) throw new Error(`unknown content release state: ${to}`);
  if (["failed", "recoverable", "rolled-back"].includes(from)) return true;
  if (from === to) return true;
  if (!ordered.has(from) || !ordered.has(to) || ordered.get(to) < ordered.get(from)) throw new Error(`invalid content release transition: ${from} -> ${to}`);
  return true;
}
