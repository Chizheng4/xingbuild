import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { projectRoot } from "./observation-content.mjs";
import { isPublicPracticeMedia } from "../../src/content/practiceMediaLifecycle.js";

export const practiceDirectory = path.join(projectRoot, "content", "products");
export const robotaxiPracticeFile = path.join(practiceDirectory, "robotaxi.json");
export const robotaxiMediaManifestFile = path.join(projectRoot, "content", "media", "robotaxi", "manifest.json");
export const robotaxiPublicMediaDirectory = path.join(projectRoot, "public", "media", "robotaxi");
export const robotaxiArchivedMediaDirectory = path.join(projectRoot, "content", "media", "robotaxi", "archive");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const absoluteHttpsPattern = /^https:\/\/[^\s]+$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const approvedMediaRoles = new Set(["current_system_evidence", "in_progress_context"]);
const manifestReviewStatuses = new Set(["approved", "superseded"]);
const manifestPublicStatuses = new Set(["public", "internal"]);
const publicationStatuses = new Set(["active", "suspended"]);
const assetReviewStatuses = new Set(["approved", "pending_review", "revoked"]);
const assetApprovalStatuses = new Set(["approved", "paused", "revoked"]);

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

function validateCurrentPublication(errors, currentPublication, field) {
  if (!isObject(currentPublication)) {
    errors.push(`${field} must be an object`);
    return;
  }
  for (const key of ["status", "effectiveAt", "authority", "reason"]) {
    if (!hasText(currentPublication[key])) errors.push(`${field}.${key} must be a non-empty string`);
  }
  if (!publicationStatuses.has(currentPublication.status)) errors.push(`${field}.status is invalid`);
}

function validateReviewRecord(errors, reviewRecord, field) {
  if (reviewRecord === undefined) return;
  if (!isObject(reviewRecord)) {
    errors.push(`${field} must be an object`);
    return;
  }
  for (const key of ["reviewId", "status", "effectiveAt", "authority", "reason"]) {
    if (!hasText(reviewRecord[key])) errors.push(`${field}.${key} must be a non-empty string`);
  }
  if (!assetApprovalStatuses.has(reviewRecord.status)) errors.push(`${field}.status is invalid`);
}

export function isPublicMediaAsset(manifest, asset) {
  return isPublicPracticeMedia(manifest, asset);
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
    "id", "version", "directory", "reviewStatus", "publicStatus", "approvalRecord", "currentPublication", "provenance", "assets",
  ]);
  for (const key of Object.keys(manifest)) if (!manifestAllowed.has(key)) errors.push(`mediaManifest.${key} is not allowed`);
  for (const field of ["id", "version", "directory", "reviewStatus", "publicStatus"]) {
    if (!hasText(manifest[field])) errors.push(`mediaManifest.${field} must be a non-empty string`);
  }
  if (manifest.directory !== "/media/robotaxi") errors.push("mediaManifest.directory must be /media/robotaxi");
  if (!manifestReviewStatuses.has(manifest.reviewStatus)) errors.push("mediaManifest.reviewStatus is invalid");
  if (!manifestPublicStatuses.has(manifest.publicStatus)) errors.push("mediaManifest.publicStatus is invalid");
  validateApprovalRecord(errors, manifest.approvalRecord, "mediaManifest.approvalRecord");
  validateCurrentPublication(errors, manifest.currentPublication, "mediaManifest.currentPublication");
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
    const allowed = new Set(["id", "type", "src", "archivePath", "altZh", "ratio", "assetSha256", "reviewStatus", "publicStatus", "provenance", "reviewRecord"]);
    for (const key of Object.keys(asset)) if (!allowed.has(key)) errors.push(`${field}.${key} is not allowed`);
    for (const key of ["id", "type", "altZh", "ratio", "assetSha256", "reviewStatus", "publicStatus"]) {
      if (!hasText(asset[key])) errors.push(`${field}.${key} must be a non-empty string`);
    }
    if (!slugPattern.test(asset.id || "")) errors.push(`${field}.id must be kebab-case`);
    if (assets.has(asset.id)) errors.push(`duplicate media asset id: ${asset.id}`);
    if (asset.src !== undefined && (!hasText(asset.src) || !asset.src.startsWith(`${manifest.directory}/`))) errors.push(`${field}.src must stay under ${manifest.directory}`);
    if (asset.archivePath !== undefined && (!hasText(asset.archivePath) || !asset.archivePath.startsWith("content/media/robotaxi/archive/"))) errors.push(`${field}.archivePath must stay under content/media/robotaxi/archive`);
    if (isPublicMediaAsset(manifest, asset) && asset.archivePath !== undefined) errors.push(`${field}.archivePath is only for non-public media`);
    if (!isPublicMediaAsset(manifest, asset) && !hasText(asset.archivePath)) errors.push(`${field}.archivePath must preserve non-public media`);
    if (asset.type !== "image") errors.push(`${field}.type must be image`);
    if (asset.ratio !== "16:10") errors.push(`${field}.ratio must be 16:10`);
    if (!sha256Pattern.test(asset.assetSha256 || "")) errors.push(`${field}.assetSha256 must be a SHA-256 hash`);
    if (!assetReviewStatuses.has(asset.reviewStatus)) errors.push(`${field}.reviewStatus is invalid`);
    if (!manifestPublicStatuses.has(asset.publicStatus)) errors.push(`${field}.publicStatus is invalid`);
    if (!isObject(asset.provenance)) {
      errors.push(`${field}.provenance must be an object`);
    } else {
      const provenanceAllowed = new Set(["mediaRole", "stateBoundary", "robotaxiVersion", "commit", "approvalStatus"]);
      for (const key of Object.keys(asset.provenance)) if (!provenanceAllowed.has(key)) errors.push(`${field}.provenance.${key} is not allowed`);
      for (const key of provenanceAllowed) if (!hasText(asset.provenance[key])) errors.push(`${field}.provenance.${key} must be a non-empty string`);
      if (!approvedMediaRoles.has(asset.provenance.mediaRole)) errors.push(`${field}.provenance.mediaRole is not approved`);
      if (!assetApprovalStatuses.has(asset.provenance.approvalStatus)) errors.push(`${field}.provenance.approvalStatus is invalid`);
    }
    validateReviewRecord(errors, asset.reviewRecord, `${field}.reviewRecord`);
    assets.set(asset.id, asset);
  }

  const moduleIds = new Set();
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
    if (!assets.has(module.mediaId)) errors.push(`${field}.mediaId references missing media record`);
    validateAction(errors, module.action, `${field}.action`);
  }
  return errors;
}

export async function assertCurrentPracticeContent() {
  const [practice, manifest] = await Promise.all([
    readJson(robotaxiPracticeFile),
    readJson(robotaxiMediaManifestFile),
  ]);
  const errors = validatePracticeBundle(practice, manifest);
  for (const asset of manifest.assets) {
    const isPublic = hasText(asset.src);
    const file = isPublic
      ? path.join(robotaxiPublicMediaDirectory, path.basename(asset.src))
      : path.join(robotaxiArchivedMediaDirectory, path.basename(asset.archivePath));
    const location = isPublic ? asset.src : asset.archivePath;
    try {
      await access(file);
      const bytes = await readFile(file);
      const actualHash = createHash("sha256").update(bytes).digest("hex");
      if (actualHash !== asset.assetSha256) errors.push(`media asset hash mismatch: ${location}`);
    } catch {
      errors.push(`media asset file is missing: ${location}`);
    }
  }
  if (errors.length) throw new Error(errors.map((error) => `- ${error}`).join("\n"));
  return { practice, manifest };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}
