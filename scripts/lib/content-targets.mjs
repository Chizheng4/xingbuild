import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./observation-content.mjs";

export const contentTargetsPath = "content/registry/content-targets.json";
export const changesDirectory = ".content-workspace/changes";
const targetIdPattern = /^products\.robotaxi\.(title|intro|boundary|module\.[a-z0-9-]+\.(label|shortDescription|loopRelation|action\.href))$/;

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function canonical(value) {
  return JSON.stringify(value);
}

export function hashValue(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

export function changeFileName(changeId) {
  return `${String(changeId).replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export async function readContentTargetRegistry({ rootDirectory = projectRoot } = {}) {
  const file = path.join(rootDirectory, contentTargetsPath);
  return JSON.parse(await readFile(file, "utf8"));
}

function targetAllowed(target) {
  return target?.editable === true && target?.kind === "product-content" && targetIdPattern.test(target.targetId || "");
}

export async function resolveContentTarget(targetId, { rootDirectory = projectRoot } = {}) {
  if (!hasText(targetId)) throw new Error("content targetId is required");
  const registry = await readContentTargetRegistry({ rootDirectory });
  const target = (registry.targets || []).find((entry) => entry.targetId === targetId);
  if (!target) throw new Error(`content target is not registered: ${targetId}`);
  if (!targetAllowed(target)) throw new Error(`content target is outside the approved Robotaxi field scope: ${targetId}`);
  if (target.sourcePath.startsWith("src/") || target.fieldPath.includes("[") && !target.fieldPath.includes("[id=")) {
    throw new Error(`content target has an unsafe source or field path: ${targetId}`);
  }
  return target;
}

export function parseFieldPath(fieldPath) {
  if (!hasText(fieldPath) || fieldPath.includes("..") || fieldPath.includes("[") && !fieldPath.includes("[id=")) {
    throw new Error(`unsupported fieldPath: ${fieldPath || "missing"}`);
  }
  const segments = fieldPath.split(".");
  const first = /^([a-zA-Z][a-zA-Z0-9_]*)(?:\[id=([a-z0-9-]+)\])?$/.exec(segments.shift() || "");
  if (!first || segments.some((segment) => !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(segment))) {
    throw new Error(`fieldPath must use explicit fields and stable id selectors: ${fieldPath}`);
  }
  const parts = [first[1]];
  if (first[2]) parts.push({ id: first[2] });
  parts.push(...segments);
  return parts;
}

export function readFieldValue(document, fieldPath) {
  let cursor = document;
  for (const part of parseFieldPath(fieldPath)) {
    if (part && typeof part === "object" && "id" in part) {
      if (!Array.isArray(cursor)) throw new Error(`fieldPath selector is not applied to an array: ${fieldPath}`);
      cursor = cursor.find((entry) => entry?.id === part.id);
    } else {
      cursor = cursor?.[part];
    }
    if (cursor === undefined) throw new Error(`fieldPath does not resolve: ${fieldPath}`);
  }
  return cursor;
}

export function writeFieldValue(document, fieldPath, value) {
  const parts = parseFieldPath(fieldPath);
  const result = structuredClone(document);
  let cursor = result;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (part && typeof part === "object" && "id" in part) {
      if (!Array.isArray(cursor)) throw new Error(`fieldPath selector is not applied to an array: ${fieldPath}`);
      const next = cursor.find((entry) => entry?.id === part.id);
      if (!next) throw new Error(`fieldPath selector does not resolve: ${fieldPath}`);
      cursor = next;
    } else {
      cursor = cursor?.[part];
    }
    if (cursor === undefined || cursor === null) throw new Error(`fieldPath does not resolve: ${fieldPath}`);
  }
  const last = parts.at(-1);
  if (last && typeof last === "object") throw new Error(`fieldPath must end in a field: ${fieldPath}`);
  if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) throw new Error(`fieldPath parent is not an object: ${fieldPath}`);
  cursor[last] = value;
  return result;
}

function validateAfter(target, after) {
  if (typeof after !== "string") throw new Error("ChangeSet after must be a string field value");
  const constraints = target.constraints || {};
  if (constraints.nonEmpty && !hasText(after)) throw new Error(`${target.targetId} after must be non-empty`);
  if (constraints.maxLength && after.length > constraints.maxLength) throw new Error(`${target.targetId} after exceeds maxLength`);
  if (constraints.httpsOnly) {
    let url;
    try { url = new URL(after); } catch { throw new Error(`${target.targetId} after must be a valid HTTPS URL`); }
    if (url.protocol !== "https:") throw new Error(`${target.targetId} after must use HTTPS`);
  }
}

export async function createContentChangeSet({
  targetId,
  after,
  beforeHash,
  sourceRefs,
  boundary,
  authority,
  rootDirectory = projectRoot,
  changeId,
} = {}) {
  const target = await resolveContentTarget(targetId, { rootDirectory });
  if (!Array.isArray(sourceRefs) || sourceRefs.length === 0 || sourceRefs.some((source) => !hasText(source))) {
    throw new Error("ChangeSet sourceRefs must contain at least one non-empty source");
  }
  if (!hasText(boundary)) throw new Error("ChangeSet boundary is required");
  if (!hasText(authority)) throw new Error("ChangeSet authority is required");
  validateAfter(target, after);
  const sourceFile = path.join(rootDirectory, target.sourcePath);
  const document = JSON.parse(await readFile(sourceFile, "utf8"));
  const before = readFieldValue(document, target.fieldPath);
  if (typeof before !== "string") throw new Error(`registered target is not a string field: ${targetId}`);
  const actualBeforeHash = hashValue(before);
  if (beforeHash && beforeHash !== actualBeforeHash) throw new Error(`ChangeSet beforeHash conflict for ${targetId}`);
  const nextChangeId = changeId || `change-${targetId.replace(/[^a-zA-Z0-9-]/g, "-")}-${hashValue(after).slice(0, 16)}`;
  const changeSet = {
    changeId: nextChangeId,
    targetId: target.targetId,
    scope: "field",
    sourcePath: target.sourcePath,
    fieldPath: target.fieldPath,
    beforeHash: actualBeforeHash,
    before,
    after,
    affectedRoutes: [...target.projectionRoutes],
    sourceRefs: [...sourceRefs],
    boundary,
    authority,
    baseProductVersion: null,
    rollbackReleaseId: null,
  };
  return { ...changeSet, target };
}

export function validateContentChangeSet(changeSet, { target } = {}) {
  if (!changeSet || changeSet.scope !== "field") throw new Error("ChangeSet scope must be field");
  if (!hasText(changeSet.changeId) || !hasText(changeSet.targetId)) throw new Error("ChangeSet identity is required");
  if (!target) throw new Error("ChangeSet target registry entry is required");
  if (changeSet.targetId !== target.targetId || changeSet.sourcePath !== target.sourcePath || changeSet.fieldPath !== target.fieldPath) {
    throw new Error("ChangeSet target or field path does not match the registry");
  }
  if (JSON.stringify(changeSet.affectedRoutes) !== JSON.stringify(target.projectionRoutes)) throw new Error("ChangeSet affectedRoutes do not match the registry");
  if (!/^[a-f0-9]{64}$/.test(changeSet.beforeHash || "")) throw new Error("ChangeSet beforeHash must be sha256");
  if (!Array.isArray(changeSet.sourceRefs) || changeSet.sourceRefs.length === 0 || changeSet.sourceRefs.some((source) => !hasText(source))) throw new Error("ChangeSet sourceRefs are required");
  if (!hasText(changeSet.boundary) || !hasText(changeSet.authority)) throw new Error("ChangeSet boundary and authority are required");
  if (Array.isArray(changeSet.after) || (changeSet.after && typeof changeSet.after === "object")) throw new Error("ChangeSet cannot replace an array or object");
  validateAfter(target, changeSet.after);
  return changeSet;
}

export async function writeContentChangeSet(changeSet, { rootDirectory = projectRoot } = {}) {
  const target = await resolveContentTarget(changeSet?.targetId, { rootDirectory });
  validateContentChangeSet(changeSet, { target });
  const { target: _target, file: _file, ...persisted } = changeSet;
  const directory = path.join(rootDirectory, changesDirectory);
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, changeFileName(changeSet.changeId));
  if (await exists(file)) {
    const existing = JSON.parse(await readFile(file, "utf8"));
    if (JSON.stringify(existing) !== JSON.stringify(persisted)) throw new Error(`ChangeSet identity conflict: ${changeSet.changeId}`);
  } else {
    await writeFile(file, `${JSON.stringify(persisted, null, 2)}\n`);
  }
  return { ...changeSet, file };
}

export async function readContentChangeSet(changeSetPath, { rootDirectory = projectRoot } = {}) {
  if (!hasText(changeSetPath)) throw new Error("ChangeSet path is required");
  const resolved = path.resolve(rootDirectory, changeSetPath);
  const allowedRoot = path.resolve(rootDirectory, changesDirectory);
  if (resolved !== allowedRoot && !resolved.startsWith(`${allowedRoot}${path.sep}`)) throw new Error("ChangeSet must be inside .content-workspace/changes");
  const changeSet = JSON.parse(await readFile(resolved, "utf8"));
  const target = await resolveContentTarget(changeSet.targetId, { rootDirectory });
  validateContentChangeSet(changeSet, { target });
  return { ...changeSet, target, file: resolved };
}

export function applyContentChangeSet(document, changeSet) {
  const target = changeSet.target || changeSet;
  const before = readFieldValue(document, target.fieldPath);
  if (hashValue(before) !== changeSet.beforeHash) throw new Error(`ChangeSet beforeHash conflict for ${changeSet.targetId}`);
  return writeFieldValue(document, target.fieldPath, changeSet.after);
}
