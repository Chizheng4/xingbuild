import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./observation-content.mjs";

export const practiceDirectory = path.join(projectRoot, "content", "practices");
export const robotaxiPracticeFile = path.join(practiceDirectory, "robotaxi.json");
export const robotaxiMediaManifestFile = path.join(projectRoot, "content", "media", "robotaxi", "manifest.json");
export const robotaxiPublicMediaDirectory = path.join(projectRoot, "public", "media", "robotaxi");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const absoluteHttpsPattern = /^https:\/\/[^\s]+$/;

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateModuleHref(errors, href, field) {
  if (href === undefined) return;
  if (!absoluteHttpsPattern.test(href)) {
    errors.push(`${field} must be an absolute https module URL`);
    return;
  }
  try {
    const parsed = new URL(href);
    if (parsed.pathname === "/" || parsed.username || parsed.password) {
      errors.push(`${field} must identify a concrete credential-free module path`);
    }
  } catch {
    errors.push(`${field} must be a valid module URL`);
  }
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
  if (practice.route !== "/robotaxi") errors.push("practice.route must be /robotaxi");
  if (!Array.isArray(practice.modules)) errors.push("practice.modules must be an array");

  const manifestAllowed = new Set(["id", "version", "directory", "assets"]);
  for (const key of Object.keys(manifest)) if (!manifestAllowed.has(key)) errors.push(`mediaManifest.${key} is not allowed`);
  for (const field of ["id", "version", "directory"]) {
    if (!hasText(manifest[field])) errors.push(`mediaManifest.${field} must be a non-empty string`);
  }
  if (manifest.directory !== "/media/robotaxi") errors.push("mediaManifest.directory must be /media/robotaxi");
  if (!Array.isArray(manifest.assets)) errors.push("mediaManifest.assets must be an array");

  const assets = new Map();
  for (const [index, asset] of (manifest.assets || []).entries()) {
    const field = `mediaManifest.assets[${index}]`;
    if (!isObject(asset)) {
      errors.push(`${field} must be an object`);
      continue;
    }
    const allowed = new Set(["id", "src", "alt", "sourceVersion", "sourceUrl", "ratio", "availability"]);
    for (const key of Object.keys(asset)) if (!allowed.has(key)) errors.push(`${field}.${key} is not allowed`);
    for (const key of ["id", "src", "alt", "sourceVersion", "sourceUrl", "ratio", "availability"]) {
      if (!hasText(asset[key])) errors.push(`${field}.${key} must be a non-empty string`);
    }
    if (!slugPattern.test(asset.id || "")) errors.push(`${field}.id must be kebab-case`);
    if (assets.has(asset.id)) errors.push(`duplicate media asset id: ${asset.id}`);
    if (!asset.src?.startsWith(`${manifest.directory}/`)) errors.push(`${field}.src must stay under ${manifest.directory}`);
    if (asset.ratio !== "16:10") errors.push(`${field}.ratio must be 16:10`);
    if (asset.availability !== "public") errors.push(`${field}.availability must be public`);
    if (!absoluteHttpsPattern.test(asset.sourceUrl || "")) errors.push(`${field}.sourceUrl must be an absolute https URL`);
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
    const allowed = new Set(["id", "label", "shortDescription", "loopRelation", "mediaId", "href"]);
    for (const key of Object.keys(module)) if (!allowed.has(key)) errors.push(`${field}.${key} is not allowed`);
    for (const key of ["id", "label", "shortDescription", "loopRelation", "mediaId"]) {
      if (!hasText(module[key])) errors.push(`${field}.${key} must be a non-empty string`);
    }
    if (!slugPattern.test(module.id || "")) errors.push(`${field}.id must be kebab-case`);
    if (moduleIds.has(module.id)) errors.push(`duplicate practice module id: ${module.id}`);
    moduleIds.add(module.id);
    if (!assets.has(module.mediaId)) errors.push(`${field}.mediaId references missing public media`);
    else referencedAssets.add(module.mediaId);
    validateModuleHref(errors, module.href, `${field}.href`);
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
