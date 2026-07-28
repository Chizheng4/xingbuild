import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { projectRoot } from "./observation-content.mjs";

export const practiceDirectory = path.join(projectRoot, "content", "products");
export const robotaxiPracticeFile = path.join(practiceDirectory, "robotaxi.json");
export const robotaxiMediaManifestFile = path.join(projectRoot, "content", "media", "robotaxi", "manifest.json");
export const robotaxiPublicMediaDirectory = path.join(projectRoot, "public", "media", "robotaxi");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const absoluteHttpsPattern = /^https:\/\/[^\s]+$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const approvedMediaRoles = new Set(["current_system_evidence", "in_progress_context"]);

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateAction(errors, action, field) {
  if (action === undefined) return;
  if (!isObject(action)) {
    errors.push(`${field} must be an object`);
    return;
  }
  const allowed = new Set(["href"]);
  for (const key of Object.keys(action)) if (!allowed.has(key)) errors.push(`${field}.${key} is not allowed`);
  if (!hasText(action.href) || !absoluteHttpsPattern.test(action.href)) {
    errors.push(`${field}.href must be an absolute https URL`);
    return;
  }
  try {
    const parsed = new URL(action.href);
    if (parsed.username || parsed.password) {
      errors.push(`${field}.href must not include credentials`);
    }
  } catch {
    errors.push(`${field}.href must be a valid URL`);
  }
}

function validateApprovalRecord(errors, approvalRecord, field) {
  if (!isObject(approvalRecord)) {
    errors.push(`${field} must be an object`);
    return;
  }
  for (const key of ["approvalId", "approvalStatus", "authority", "approvedAt", "scope"]) {
    if (!hasText(approvalRecord[key])) errors.push(`${field}.${key} must be a non-empty string`);
  }
  if (approvalRecord.approvalStatus !== "approved") errors.push(`${field}.approvalStatus must be approved`);
}

export function validatePracticeBundle(practice, manifest) {
  const errors = [];
  if (!isObject(practice)) return ["practice must be an object"];
  if (!isObject(manifest)) return ["media manifest must be an object"];

  const practiceAllowed = new Set(["id", "route", "navLabel", "title", "intro", "boundary", "observationQuery", "modules"]);
  for (const key of Object.keys(practice)) if (!practiceAllowed.has(key)) errors.push(`practice.${key} is not allowed`);
  for (const field of ["id", "route", "navLabel", "title", "intro", "boundary"]) {
    if (!hasText(practice[field])) errors.push(`practice.${field} must be a non-empty string`);
  }
  if (!slugPattern.test(practice.id || "")) errors.push("practice.id must be kebab-case");
  if (practice.route !== "/products") errors.push("practice.route must be /products");
  if (!Array.isArray(practice.modules)) errors.push("practice.modules must be an array");

  const manifestAllowed = new Set([
    "id", "version", "directory", "reviewStatus", "publicStatus", "approvalRecord", "provenance", "assets",
  ]);
  for (const key of Object.keys(manifest)) if (!manifestAllowed.has(key)) errors.push(`mediaManifest.${key} is not allowed`);
  for (const field of ["id", "version", "directory", "reviewStatus", "publicStatus"]) {
    if (!hasText(manifest[field])) errors.push(`mediaManifest.${field} must be a non-empty string`);
  }
  if (manifest.directory !== "/media/robotaxi") errors.push("mediaManifest.directory must be /media/robotaxi");
  if (manifest.reviewStatus !== "approved") errors.push("mediaManifest.reviewStatus must be approved");
  if (manifest.publicStatus !== "public") errors.push("mediaManifest.publicStatus must be public");
  validateApprovalRecord(errors, manifest.approvalRecord, "mediaManifest.approvalRecord");
  if (!isObject(manifest.provenance)) {
    errors.push("mediaManifest.provenance must be an object");
  } else {
    const allowed = new Set(["repository", "manifestPath", "version", "commit", "sourceDraftManifestSha256"]);
    for (const key of Object.keys(manifest.provenance)) if (!allowed.has(key)) errors.push(`mediaManifest.provenance.${key} is not allowed`);
    for (const key of allowed) if (!hasText(manifest.provenance[key])) errors.push(`mediaManifest.provenance.${key} must be a non-empty string`);
    if (!sha256Pattern.test(manifest.provenance.sourceDraftManifestSha256 || "")) errors.push("mediaManifest.provenance.sourceDraftManifestSha256 must be a SHA-256 hash");
  }
  if (!Array.isArray(manifest.assets)) errors.push("mediaManifest.assets must be an array");

  const assets = new Map();
  for (const [index, asset] of (manifest.assets || []).entries()) {
    const field = `mediaManifest.assets[${index}]`;
    if (!isObject(asset)) {
      errors.push(`${field} must be an object`);
      continue;
    }
    const allowed = new Set(["id", "type", "src", "altZh", "ratio", "assetSha256", "provenance"]);
    for (const key of Object.keys(asset)) if (!allowed.has(key)) errors.push(`${field}.${key} is not allowed`);
    for (const key of ["id", "type", "src", "altZh", "ratio", "assetSha256"]) {
      if (!hasText(asset[key])) errors.push(`${field}.${key} must be a non-empty string`);
    }
    if (!slugPattern.test(asset.id || "")) errors.push(`${field}.id must be kebab-case`);
    if (assets.has(asset.id)) errors.push(`duplicate media asset id: ${asset.id}`);
    if (!asset.src?.startsWith(`${manifest.directory}/`)) errors.push(`${field}.src must stay under ${manifest.directory}`);
    if (asset.type !== "image") errors.push(`${field}.type must be image`);
    if (asset.ratio !== "16:10") errors.push(`${field}.ratio must be 16:10`);
    if (!sha256Pattern.test(asset.assetSha256 || "")) errors.push(`${field}.assetSha256 must be a SHA-256 hash`);
    if (!isObject(asset.provenance)) {
      errors.push(`${field}.provenance must be an object`);
    } else {
      const provenanceAllowed = new Set(["mediaRole", "stateBoundary", "robotaxiVersion", "commit", "approvalStatus"]);
      for (const key of Object.keys(asset.provenance)) if (!provenanceAllowed.has(key)) errors.push(`${field}.provenance.${key} is not allowed`);
      for (const key of provenanceAllowed) if (!hasText(asset.provenance[key])) errors.push(`${field}.provenance.${key} must be a non-empty string`);
      if (!approvedMediaRoles.has(asset.provenance.mediaRole)) errors.push(`${field}.provenance.mediaRole is not approved`);
      if (asset.provenance.approvalStatus !== "approved") errors.push(`${field}.provenance.approvalStatus must be approved`);
    }
    assets.set(asset.id, asset);
  }

  const moduleIds = new Set();
  const referencedAssets = new Set();
  for (const [index, module] of (practice.modules || []).entries()) {
    const field = `practice.modules[${index}]`;
    if (!isObject(module)) {
      errors.push(`${field} must be an object`);
      continue;
    }
    const allowed = new Set(["id", "group", "label", "shortDescription", "loopRelation", "mediaId", "action"]);
    for (const key of Object.keys(module)) if (!allowed.has(key)) errors.push(`${field}.${key} is not allowed`);
    for (const key of ["id", "group", "label", "shortDescription", "loopRelation", "mediaId"]) {
      if (!hasText(module[key])) errors.push(`${field}.${key} must be a non-empty string`);
    }
    if (!slugPattern.test(module.id || "")) errors.push(`${field}.id must be kebab-case`);
    if (moduleIds.has(module.id)) errors.push(`duplicate practice module id: ${module.id}`);
    moduleIds.add(module.id);
    if (!assets.has(module.mediaId)) errors.push(`${field}.mediaId references missing public media`);
    else referencedAssets.add(module.mediaId);
    validateAction(errors, module.action, `${field}.action`);
  }
  for (const id of assets.keys()) if (!referencedAssets.has(id)) errors.push(`media asset ${id} is not referenced by a practice module`);
  return errors;
}

export async function assertCurrentPracticeContent() {
  const [practice, manifest] = await Promise.all([
    readJson(robotaxiPracticeFile),
    readJson(robotaxiMediaManifestFile),
  ]);
  const errors = validatePracticeBundle(practice, manifest);
  for (const asset of manifest.assets) {
    const file = path.join(robotaxiPublicMediaDirectory, path.basename(asset.src));
    try {
      await access(file);
      const bytes = await readFile(file);
      const actualHash = createHash("sha256").update(bytes).digest("hex");
      if (actualHash !== asset.assetSha256) errors.push(`media asset hash mismatch: public${asset.src}`);
    } catch {
      errors.push(`media asset file is missing: public${asset.src}`);
    }
  }
  if (errors.length) throw new Error(errors.map((error) => `- ${error}`).join("\n"));
  return { practice, manifest };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}
