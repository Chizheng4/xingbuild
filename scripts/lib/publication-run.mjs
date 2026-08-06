import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSiteSnapshotIdentity } from "./site-snapshot.mjs";

export const PUBLICATION_RUN_SCHEMA_VERSION = "publication-run-v1";
export const PUBLICATION_RUN_STATES = Object.freeze([
  "assembled",
  "deploying",
  "verifying",
  "released",
  "recoverable",
  "failed",
  "rolled_back",
]);

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`PublicationRun ${field} is required`);
  return value;
}
function runDirectory(sourceRoot, publicationRunId) {
  return path.join(sourceRoot, ".content-workspace", "publication-runs", publicationRunId);
}

export function publicationRunPath(sourceRoot, publicationRunId) {
  return path.join(runDirectory(sourceRoot, publicationRunId), "publication-run.json");
}

async function atomicWrite(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
}

export function publicationRunIdForSnapshot(siteSnapshotId) {
  return `publication-run-${text(siteSnapshotId, "siteSnapshotId")}`;
}

export function createPublicationRun({ siteSnapshot, previousRunId = null, createdAt = new Date().toISOString() } = {}) {
  assertSiteSnapshotIdentity(siteSnapshot);
  const publicationRunId = publicationRunIdForSnapshot(siteSnapshot.siteSnapshotId);
  return {
    schemaVersion: PUBLICATION_RUN_SCHEMA_VERSION,
    publicationRunId,
    siteSnapshotId: siteSnapshot.siteSnapshotId,
    snapshotHash: siteSnapshot.snapshotHash,
    productArtifactId: siteSnapshot.productArtifact.productArtifactId,
    contentSetId: siteSnapshot.contentSetId,
    contentSetHash: siteSnapshot.contentSetHash,
    previousRunId: previousRunId || null,
    state: "assembled",
    deploymentId: null,
    deployment: null,
    deploymentCount: 0,
    publicVerify: null,
    recovery: null,
    rollback: null,
    createdAt,
    updatedAt: createdAt,
  };
}

export function validatePublicationRun(run = {}) {
  if (run.schemaVersion !== PUBLICATION_RUN_SCHEMA_VERSION) throw new Error("PublicationRun schemaVersion is invalid");
  text(run.publicationRunId, "publicationRunId");
  text(run.siteSnapshotId, "siteSnapshotId");
  text(run.snapshotHash, "snapshotHash");
  text(run.productArtifactId, "productArtifactId");
  text(run.contentSetId, "contentSetId");
  text(run.contentSetHash, "contentSetHash");
  if (!PUBLICATION_RUN_STATES.includes(run.state)) throw new Error(`PublicationRun state is invalid: ${run.state}`);
  if (!Number.isInteger(run.deploymentCount) || run.deploymentCount < 0 || run.deploymentCount > 1) throw new Error("PublicationRun deploymentCount must be 0 or 1");
  if (run.deploymentCount === 1 && !run.deploymentId) throw new Error("PublicationRun deploymentId is required after deployment");
  if (run.deploymentCount === 0 && run.deploymentId) throw new Error("PublicationRun cannot carry deploymentId before deployment");
  if (run.state === "released" && (!run.deploymentId || !run.publicVerify)) throw new Error("released PublicationRun requires deployment and publicVerify");
  return run;
}

export async function readPublicationRun({ sourceRoot, publicationRunId } = {}) {
  const file = publicationRunPath(sourceRoot || process.cwd(), publicationRunId);
  return validatePublicationRun(JSON.parse(await readFile(file, "utf8")));
}

export async function writePublicationRun({ sourceRoot, run } = {}) {
  validatePublicationRun(run);
  const file = publicationRunPath(sourceRoot || process.cwd(), run.publicationRunId);
  return atomicWrite(file, run).then(() => ({ file, run }));
}

export function attachPublicationDeployment(run, { deploymentId, deployment } = {}) {
  validatePublicationRun(run);
  text(deploymentId, "deploymentId");
  if (run.deploymentId && run.deploymentId !== deploymentId) throw new Error("PublicationRun refuses a second deployment for one SiteSnapshot");
  if (run.deploymentId === deploymentId) return { ...run, state: run.state === "assembled" ? "deploying" : run.state, deploymentCount: 1 };
  return { ...run, state: "deploying", deploymentId, deployment: deployment || null, deploymentCount: 1, updatedAt: new Date().toISOString() };
}

export function markPublicationVerifying(run, publicVerify) {
  validatePublicationRun(run);
  if (!run.deploymentId) throw new Error("PublicationRun verifying requires deploymentId");
  return { ...run, state: "verifying", publicVerify, updatedAt: new Date().toISOString() };
}

export function markPublicationReleased(run, publicVerify = run.publicVerify) {
  const verifying = markPublicationVerifying(run, publicVerify);
  return { ...verifying, state: "released", recovery: null, updatedAt: new Date().toISOString() };
}

export function markPublicationRecoverable(run, recovery) {
  validatePublicationRun(run);
  return { ...run, state: "recoverable", recovery: recovery || { reason: "unknown" }, updatedAt: new Date().toISOString() };
}

export function markPublicationFailed(run, failure) {
  validatePublicationRun(run);
  return { ...run, state: "failed", recovery: failure || { reason: "unknown" }, updatedAt: new Date().toISOString() };
}

export function markPublicationRolledBack(run, rollback) {
  validatePublicationRun(run);
  if (run.state !== "released") throw new Error("PublicationRun rollback requires a released run");
  return { ...run, state: "rolled_back", rollback: rollback || { reason: "explicit rollback" }, updatedAt: new Date().toISOString() };
}
