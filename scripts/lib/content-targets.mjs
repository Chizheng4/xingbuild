import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./observation-content.mjs";
import { contentRootDirectory } from "./content-root.mjs";

export const contentTargetsPath = "content/registry/content-targets.json";
export const changesDirectory = ".content-workspace/changes";
const targetIdPattern = /^products\.robotaxi\.(title|intro|boundary|module\.[a-z0-9-]+\.(label|shortDescription|loopRelation|action\.href))$/;
const mediaTargetIdPattern = /^media\.robotaxi\.(asset\.[a-z0-9-]+\.(type|src|ratio)|module\.[a-z0-9-]+\.mediaId)$/;

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function canonical(value) {
  return JSON.stringify(value);
}

export function hashValue(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function safeRelativePath(value, { allowSrc = true } = {}) {
  if (!hasText(value) || path.isAbsolute(value) || value.includes("\\")) return false;
  const normalized = path.posix.normalize(value);
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) return false;
  return allowSrc || !normalized.startsWith("src/");
}

export function validateContentTargetRegistry(registry) {
  if (!registry || registry.registryId !== "xingbuild-content-targets" || registry.schemaVersion !== 1) {
    throw new Error("content target registry identity or schemaVersion is invalid");
  }
  if (!Array.isArray(registry.targets) || !Array.isArray(registry.templates) || !Array.isArray(registry.excluded)) {
    throw new Error("content target registry must contain targets, templates and excluded arrays");
  }
  const ids = new Set();
  for (const target of registry.targets) {
    if (!hasText(target?.targetId) || ids.has(target.targetId)) throw new Error(`content target registry has duplicate targetId: ${target?.targetId || "missing"}`);
    ids.add(target.targetId);
    if (target.scope !== "field" || !safeRelativePath(target.sourcePath, { allowSrc: false })) throw new Error(`content target registry has unsafe target source: ${target.targetId}`);
    if (target.kind === "product-content" && target.targetId.startsWith("products.robotaxi.")) {
      if (target.editable !== true || target.scope !== "field" || target.valueType !== "string" || target.sourcePath !== "content/products/robotaxi.json" || JSON.stringify(target.projectionRoutes) !== JSON.stringify(["/products"]) || !targetIdPattern.test(target.targetId || "")) {
        throw new Error(`Robotaxi product target contract is invalid: ${target.targetId}`);
      }
    }
    parseFieldPath(target.fieldPath);
    if (!Array.isArray(target.projectionRoutes) || target.projectionRoutes.length === 0 || target.projectionRoutes.some((route) => !hasText(route) || !route.startsWith("/"))) {
      throw new Error(`content target registry has invalid projection routes: ${target.targetId}`);
    }
  }
  for (const template of registry.templates) {
    if (!safeRelativePath(template?.sourcePathTemplate, { allowSrc: false })) throw new Error("content target registry has unsafe template source");
    if (!hasText(template.targetIdPattern) || !hasText(template.fieldPathTemplate || template.fieldPath) || template.scope !== "field" || template.editable !== true || template.valueType !== "string") throw new Error("content target registry template contract is invalid");
    if (template.kind === "product-content" && !template.targetIdPattern.startsWith("products.robotaxi.module.")) throw new Error("Robotaxi product template contract is invalid");
    if (template.kind === "media-content" && (!template.targetIdPattern.startsWith("media.robotaxi.") || !["content/media/robotaxi/manifest.json", "content/products/robotaxi.json"].includes(template.sourcePathTemplate))) throw new Error("Robotaxi media template contract is invalid");
    parseFieldPath(String(template.fieldPathTemplate || template.fieldPath).replace(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g, "sample-id"));
  }
  for (const excluded of registry.excluded) {
    if (excluded.sourcePath && !safeRelativePath(excluded.sourcePath)) throw new Error("content target registry has unsafe excluded source");
  }
  return registry;
}

export function changeFileName(changeId) {
  return `${String(changeId).replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export function resolveContentSourceFile(sourcePath, { rootDirectory = projectRoot } = {}) {
  if (typeof sourcePath !== "string") throw new Error("content sourcePath is required");
  const normalized = path.posix.normalize(sourcePath);
  if (normalized.startsWith("content/") && !normalized.startsWith("content/registry/")) {
    return path.join(contentRootDirectory({ sourceRoot: rootDirectory }), normalized.slice("content/".length));
  }
  return path.join(rootDirectory, normalized);
}

export async function readContentTargetRegistry({ rootDirectory = projectRoot } = {}) {
  const file = path.join(rootDirectory, contentTargetsPath);
  return validateContentTargetRegistry(JSON.parse(await readFile(file, "utf8")));
}

function targetAllowed(target) {
  return target?.editable === true
    && ((target?.kind === "product-content" && targetIdPattern.test(target.targetId || ""))
      || (target?.kind === "media-content" && mediaTargetIdPattern.test(target.targetId || "")));
}

function instantiateTemplate(template, targetId) {
  const names = [...String(template.targetIdPattern).matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map((match) => match[1]);
  const pattern = new RegExp(`^${String(template.targetIdPattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{[a-zA-Z][a-zA-Z0-9_]*\\\}/g, "([a-z0-9-]+)")}$`);
  const match = pattern.exec(targetId);
  if (!match) return null;
  const values = Object.fromEntries(names.map((name, index) => [name, match[index + 1]]));
  const replace = (value) => String(value).replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_, name) => values[name]);
  return { ...template, targetId, sourcePath: replace(template.sourcePathTemplate), fieldPath: replace(template.fieldPathTemplate || template.fieldPath), projectionRoutes: (template.projectionRoutes || []).map(replace) };
}

export async function resolveContentTarget(targetId, { rootDirectory = projectRoot } = {}) {
  if (!hasText(targetId)) throw new Error("content targetId is required");
  const registry = await readContentTargetRegistry({ rootDirectory });
  const target = (registry.targets || []).find((entry) => entry.targetId === targetId)
    || (registry.templates || []).map((entry) => instantiateTemplate(entry, targetId)).find(Boolean);
  if (!target) throw new Error(`content target is not registered: ${targetId}`);
  if (!target.editable || target.scope !== "field" || !["product-content", "media-content", "observation", "article", "profile"].includes(target.kind)) throw new Error(`content target is outside the approved field scope: ${targetId}`);
  if (target.sourcePath.startsWith("src/") || target.fieldPath.includes("[") && !target.fieldPath.includes("[id=")) {
    throw new Error(`content target has an unsafe source or field path: ${targetId}`);
  }
  return target;
}

export async function createContentTargetCard(targetId, { rootDirectory = projectRoot } = {}) {
  const target = await resolveContentTarget(targetId, { rootDirectory });
  const document = JSON.parse(await readFile(resolveContentSourceFile(target.sourcePath, { rootDirectory }), "utf8"));
  let current;
  try { current = readFieldValue(document, target.fieldPath); } catch (error) {
    if (target.kind === "media-content" && target.fieldPath.startsWith("assets[id=")) current = null;
    else throw error;
  }
  if (current !== null && typeof current !== "string") throw new Error(`registered target is not a string field: ${targetId}`);
  return {
    targetId: target.targetId,
    scope: target.scope,
    kind: target.kind,
    sourcePath: target.sourcePath,
    fieldPath: target.fieldPath,
    current,
    beforeHash: hashValue(current),
    affectedRoutes: [...target.projectionRoutes],
    constraints: { ...(target.constraints || {}) },
    requires: [...(target.requires || [])],
    boundary: "仅允许该注册字段的字段级内容变更。",
  };
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
      let next = cursor.find((entry) => entry?.id === part.id);
      if (!next) {
        if (!String(fieldPath).startsWith("assets[id=")) throw new Error(`fieldPath selector does not resolve: ${fieldPath}`);
        next = { id: part.id };
        cursor.push(next);
      }
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
  if (after === null && target.kind === "media-content" && target.fieldPath.startsWith("assets[id=")) return;
  if (typeof after !== "string") throw new Error("ChangeSet after must be a string field value");
  const constraints = target.constraints || {};
  if (constraints.nonEmpty && !hasText(after)) throw new Error(`${target.targetId} after must be non-empty`);
  if (constraints.maxLength && after.length > constraints.maxLength) throw new Error(`${target.targetId} after exceeds maxLength`);
  if (constraints.httpsOnly) {
    let url;
    try { url = new URL(after); } catch { throw new Error(`${target.targetId} after must be a valid HTTPS URL`); }
    if (url.protocol !== "https:") throw new Error(`${target.targetId} after must use HTTPS`);
  }
  if (Array.isArray(constraints.enum) && !constraints.enum.includes(after)) throw new Error(`${target.targetId} after is outside the registered enum`);
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
  const sourceFile = resolveContentSourceFile(target.sourcePath, { rootDirectory });
  const document = JSON.parse(await readFile(sourceFile, "utf8"));
  let before;
  try { before = readFieldValue(document, target.fieldPath); } catch (error) {
    if (target.kind === "media-content" && target.fieldPath.startsWith("assets[id=")) before = null;
    else throw error;
  }
  if (before !== null && typeof before !== "string") throw new Error(`registered target is not a string field: ${targetId}`);
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
    recovery: {
      type: "field-reverse",
      rollbackChangeId: `${nextChangeId}-rollback`,
      originalBefore: before,
      originalAfter: after,
    },
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
  if (changeSet.recovery) {
    if (changeSet.recovery.type !== "field-reverse" || !hasText(changeSet.recovery.rollbackChangeId) || changeSet.recovery.originalBefore !== changeSet.before || changeSet.recovery.originalAfter !== changeSet.after) {
      throw new Error("ChangeSet recovery descriptor is invalid");
    }
  }
  if (changeSet.contentReleaseId !== undefined && !hasText(changeSet.contentReleaseId)) throw new Error("ChangeSet contentReleaseId is invalid");
  if (changeSet.releasePackage !== undefined && (!hasText(changeSet.releasePackage) || !changeSet.releasePackage.startsWith(`${path.posix.normalize(".content-workspace/releases")}/`))) {
    throw new Error("ChangeSet releasePackage must stay inside .content-workspace/releases");
  }
  if (changeSet.rollbackOf) {
    if (!hasText(changeSet.rollbackOf.changeId) || !hasText(changeSet.rollbackOf.contentReleaseId) || !hasText(changeSet.rollbackOf.releasePackage) || changeSet.rollbackOf.originalBefore !== changeSet.after || changeSet.rollbackOf.originalAfter !== changeSet.before) {
      throw new Error("rollback ChangeSet must link its source content release and preimage");
    }
  }
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

export async function linkContentChangeSetRelease(changeSetPath, { contentReleaseId, releasePackage, rootDirectory = projectRoot } = {}) {
  const changeSet = await readContentChangeSet(changeSetPath, { rootDirectory });
  if (!hasText(contentReleaseId) || !hasText(releasePackage)) throw new Error("content release association requires contentReleaseId and releasePackage");
  const relativePackage = path.posix.normalize(releasePackage.split(path.sep).join("/"));
  if (!relativePackage.startsWith(".content-workspace/releases/")) throw new Error("content release package must stay inside .content-workspace/releases");
  const persisted = {
    ...changeSet,
    target: undefined,
    file: undefined,
    contentReleaseId,
    releasePackage: relativePackage,
    recovery: {
      ...changeSet.recovery,
      contentReleaseId,
      releasePackage: relativePackage,
    },
  };
  const { target: _target, file: _file, ...json } = persisted;
  await writeFile(changeSet.file, `${JSON.stringify(json, null, 2)}\n`);
  return { ...changeSet, ...json, target: changeSet.target, file: changeSet.file };
}

export async function createRollbackChangeSet(changeSetPath, { rootDirectory = projectRoot, changeId } = {}) {
  const original = await readContentChangeSet(changeSetPath, { rootDirectory });
  if (!hasText(original.contentReleaseId) || !hasText(original.releasePackage)) {
    throw new Error("rollback requires a prepared contentReleaseId and releasePackage association");
  }
  const rollback = {
    changeId: changeId || original.recovery?.rollbackChangeId || `${original.changeId}-rollback`,
    targetId: original.targetId,
    scope: "field",
    sourcePath: original.sourcePath,
    fieldPath: original.fieldPath,
    beforeHash: hashValue(original.after),
    before: original.after,
    after: original.before,
    affectedRoutes: [...original.affectedRoutes],
    sourceRefs: [...original.sourceRefs, `rollback:${original.changeId}`],
    boundary: original.boundary,
    authority: original.authority,
    rollbackOf: {
      changeId: original.changeId,
      contentReleaseId: original.contentReleaseId,
      releasePackage: original.releasePackage,
      originalBefore: original.before,
      originalAfter: original.after,
    },
    recovery: {
      type: "field-reverse",
      rollbackChangeId: `${original.changeId}-rollback-rollback`,
      originalBefore: original.after,
      originalAfter: original.before,
    },
  };
  return writeContentChangeSet(rollback, { rootDirectory });
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
  let before;
  try { before = readFieldValue(document, target.fieldPath); } catch (error) {
    if (target.kind === "media-content" && target.fieldPath.startsWith("assets[id=")) before = null;
    else throw error;
  }
  if (hashValue(before) !== changeSet.beforeHash) throw new Error(`ChangeSet beforeHash conflict for ${changeSet.targetId}`);
  if (changeSet.after === null && target.fieldPath.startsWith("assets[id=")) return removeFieldValue(document, target.fieldPath);
  return writeFieldValue(document, target.fieldPath, changeSet.after);
}

export function removeFieldValue(document, fieldPath) {
  const parts = parseFieldPath(fieldPath);
  const result = structuredClone(document);
  let cursor = result;
  let selectedArray = null;
  let selectedIndex = -1;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (part && typeof part === "object" && "id" in part) {
      if (!Array.isArray(cursor)) throw new Error(`fieldPath selector is not applied to an array: ${fieldPath}`);
      selectedArray = cursor;
      selectedIndex = cursor.findIndex((entry) => entry?.id === part.id);
      if (selectedIndex < 0) return result;
      cursor = cursor[selectedIndex];
    } else cursor = cursor?.[part];
  }
  const last = parts.at(-1);
  if (cursor && typeof cursor === "object" && !Array.isArray(cursor)) delete cursor[last];
  if (selectedArray && selectedIndex >= 0 && Object.keys(selectedArray[selectedIndex]).length === 1 && Object.prototype.hasOwnProperty.call(selectedArray[selectedIndex], "id")) selectedArray.splice(selectedIndex, 1);
  return result;
}
