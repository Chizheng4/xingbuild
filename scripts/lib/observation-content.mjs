import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifySourceUrl } from "../../src/content/sourceUrls.js";
import { validateBriefDefinition } from "../../src/content/briefProjection.js";

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const contentRoot = process.env.XINGBUILD_CONTENT_ROOT
  ? path.resolve(process.env.XINGBUILD_CONTENT_ROOT)
  : projectRoot;
export const publishedDirectory = path.join(contentRoot, "content", "observations");
export const workspaceDirectory = path.join(contentRoot, ".content-workspace");
export const draftsDirectory = path.join(workspaceDirectory, "drafts");

const schema = JSON.parse(
  await readFile(path.join(projectRoot, "content", "schema", "observation.schema.json"), "utf8"),
);

export const enumValues = {
  status: new Set(schema.properties.status.enum),
  level: new Set(schema.properties.level.enum),
  nature: new Set(schema.properties.nature.enum),
  dimension: new Set(schema.properties.primaryDimension.enum),
  claimKind: new Set(schema.$defs.evidenceUnit.properties.claimKind.enum),
  sourceTier: new Set(schema.$defs.source.properties.sourceTier.enum),
  sourceType: new Set(schema.$defs.source.properties.sourceType.enum),
  relatedWork: new Set(schema.properties.relatedWorks.items.enum),
};

const requiredFields = schema.required;
const allowedTopLevel = new Set(Object.keys(schema.properties));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const idPattern = /^observation-[a-z0-9-]+$/;
const evidenceIdPattern = /^evidence-[a-z0-9-]+$/;
const sourceIdPattern = /^source-[a-z0-9-]+$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateString(errors, value, field) {
  if (typeof value !== "string" || value.trim() === "") errors.push(`${field} must be a non-empty string`);
}

function validateDate(errors, value, field) {
  if (typeof value !== "string" || !datePattern.test(value)) errors.push(`${field} must use YYYY-MM-DD`);
}

function validateStringArray(errors, value, field, { min = 0 } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }
  if (value.length < min) errors.push(`${field} must contain at least ${min} item(s)`);
  if (value.some((item) => typeof item !== "string" || item.trim() === "")) {
    errors.push(`${field} must contain non-empty strings`);
  }
  if (new Set(value).size !== value.length) errors.push(`${field} must not contain duplicates`);
}

function validateSection(errors, section, field, evidenceIds) {
  if (!isObject(section)) {
    errors.push(`${field} must be an object`);
    return;
  }
  const allowed = new Set(["id", "heading", "paragraphs", "evidenceUnitIds"]);
  for (const key of Object.keys(section)) if (!allowed.has(key)) errors.push(`${field}.${key} is not allowed`);
  if (!slugPattern.test(section.id || "")) errors.push(`${field}.id must be a stable kebab-case id`);
  validateString(errors, section.heading, `${field}.heading`);
  validateStringArray(errors, section.paragraphs, `${field}.paragraphs`, { min: 1 });
  validateStringArray(errors, section.evidenceUnitIds, `${field}.evidenceUnitIds`);
  for (const id of section.evidenceUnitIds || []) {
    if (!evidenceIds.has(id)) errors.push(`${field}.evidenceUnitIds references missing ${id}`);
  }
}

export function validateObservation(observation, { expectedStatus } = {}) {
  const errors = [];
  if (!isObject(observation)) return ["observation must be an object"];

  for (const field of requiredFields) {
    if (!(field in observation)) errors.push(`${field} is required`);
  }
  for (const key of Object.keys(observation)) {
    if (!allowedTopLevel.has(key)) errors.push(`${key} is not allowed`);
  }

  if (!idPattern.test(observation.id || "")) errors.push("id must start with observation- and use kebab-case");
  if (!slugPattern.test(observation.slug || "")) errors.push("slug must use kebab-case");
  if (!enumValues.status.has(observation.status)) errors.push(`status has invalid value: ${observation.status}`);
  if (expectedStatus && observation.status !== expectedStatus) errors.push(`status must be ${expectedStatus}`);
  if (!enumValues.level.has(observation.level)) errors.push(`level has invalid value: ${observation.level}`);
  if (!enumValues.nature.has(observation.nature)) errors.push(`nature has invalid value: ${observation.nature}`);
  validateString(errors, observation.title, "title");
  validateString(errors, observation.summary, "summary");
  validateStringArray(errors, observation.companies, "companies");
  validateStringArray(errors, observation.regions, "regions");
  validateStringArray(errors, observation.dimensions, "dimensions", { min: 1 });
  for (const dimension of observation.dimensions || []) {
    if (!enumValues.dimension.has(dimension)) errors.push(`dimensions has invalid value: ${dimension}`);
  }
  if (!enumValues.dimension.has(observation.primaryDimension)) {
    errors.push(`primaryDimension has invalid value: ${observation.primaryDimension}`);
  } else if (!observation.dimensions?.includes(observation.primaryDimension)) {
    errors.push("primaryDimension must also appear in dimensions");
  }
  for (const field of ["eventAt", "periodStart", "periodEnd"]) {
    if (observation[field] !== undefined) validateDate(errors, observation[field], field);
  }
  validateDate(errors, observation.publishedAt, "publishedAt");
  validateDate(errors, observation.updatedAt, "updatedAt");
  if (observation.periodStart && observation.periodEnd && observation.periodStart > observation.periodEnd) {
    errors.push("periodStart must not be later than periodEnd");
  }

  if (!Array.isArray(observation.factOverview) || observation.factOverview.length === 0) {
    errors.push("factOverview must contain at least one item");
  } else {
    observation.factOverview.forEach((item, index) => {
      if (!isObject(item) || Object.keys(item).some((key) => !["label", "value"].includes(key))) {
        errors.push(`factOverview[${index}] must contain only label and value`);
      } else {
        validateString(errors, item.label, `factOverview[${index}].label`);
        validateString(errors, item.value, `factOverview[${index}].value`);
      }
    });
  }

  const evidenceIds = new Set();
  if (!Array.isArray(observation.evidenceUnits) || observation.evidenceUnits.length === 0) {
    errors.push("evidenceUnits must contain at least one item");
  } else {
    observation.evidenceUnits.forEach((unit, index) => {
      const field = `evidenceUnits[${index}]`;
      if (!isObject(unit)) {
        errors.push(`${field} must be an object`);
        return;
      }
      if (Object.keys(unit).some((key) => !["id", "claim", "claimKind", "sourceRefs"].includes(key))) {
        errors.push(`${field} contains unsupported fields`);
      }
      if (!evidenceIdPattern.test(unit.id || "")) errors.push(`${field}.id is invalid`);
      if (evidenceIds.has(unit.id)) errors.push(`duplicate evidence id: ${unit.id}`);
      evidenceIds.add(unit.id);
      validateString(errors, unit.claim, `${field}.claim`);
      if (!enumValues.claimKind.has(unit.claimKind)) errors.push(`${field}.claimKind has invalid value: ${unit.claimKind}`);
      validateStringArray(errors, unit.sourceRefs, `${field}.sourceRefs`, { min: 1 });
    });
  }

  const sourceIds = new Set();
  if (!Array.isArray(observation.sources) || observation.sources.length === 0) {
    errors.push("sources must contain at least one item");
  } else {
    observation.sources.forEach((source, index) => {
      const field = `sources[${index}]`;
      if (!isObject(source)) {
        errors.push(`${field} must be an object`);
        return;
      }
      const allowed = new Set(["id", "publisher", "title", "url", "publishedAt", "sourceTier", "sourceType", "accessedAt"]);
      if (Object.keys(source).some((key) => !allowed.has(key))) errors.push(`${field} contains unsupported fields`);
      if (!sourceIdPattern.test(source.id || "")) errors.push(`${field}.id is invalid`);
      if (sourceIds.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
      sourceIds.add(source.id);
      for (const name of ["publisher", "title", "url"]) validateString(errors, source[name], `${field}.${name}`);
      const safeUrl = classifySourceUrl(source);
      if (!safeUrl.valid) errors.push(`${field}.url ${safeUrl.reason}`);
      validateDate(errors, source.publishedAt, `${field}.publishedAt`);
      validateDate(errors, source.accessedAt, `${field}.accessedAt`);
      if (!enumValues.sourceTier.has(source.sourceTier)) errors.push(`${field}.sourceTier has invalid value: ${source.sourceTier}`);
      if (!enumValues.sourceType.has(source.sourceType)) errors.push(`${field}.sourceType has invalid value: ${source.sourceType}`);
    });
  }

  for (const unit of observation.evidenceUnits || []) {
    for (const ref of unit.sourceRefs || []) {
      if (!sourceIds.has(ref)) errors.push(`${unit.id}.sourceRefs references missing ${ref}`);
    }
  }

  validateSection(errors, observation.rangeAndFacts, "rangeAndFacts", evidenceIds);
  validateSection(errors, observation.operatingImpact, "operatingImpact", evidenceIds);
  if (!Array.isArray(observation.sections)) errors.push("sections must be an array");
  else observation.sections.forEach((section, index) => validateSection(errors, section, `sections[${index}]`, evidenceIds));

  validateString(errors, observation.evidenceBoundary, "evidenceBoundary");
  validateStringArray(errors, observation.relatedWorks, "relatedWorks");
  for (const work of observation.relatedWorks || []) {
    if (!enumValues.relatedWork.has(work)) errors.push(`relatedWorks has invalid value: ${work}`);
  }
  if (typeof observation.promoteToHome !== "boolean") errors.push("promoteToHome must be boolean");
  errors.push(...validateBriefDefinition(observation));
  return errors;
}

export function assertValidObservation(observation, options) {
  const errors = validateObservation(observation, options);
  if (errors.length) throw new Error(errors.map((error) => `- ${error}`).join("\n"));
  return observation;
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function listJsonFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(directory, entry.name))
      .sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function readPublishedObservations() {
  const files = await listJsonFiles(publishedDirectory);
  const items = [];
  for (const file of files) {
    const item = assertValidObservation(await readJson(file), { expectedStatus: "published" });
    if (`${item.slug}.json` !== path.basename(file)) {
      throw new Error(`${path.relative(projectRoot, file)} must be named ${item.slug}.json`);
    }
    items.push(item);
  }
  const ids = new Set();
  const slugs = new Set();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`duplicate observation id: ${item.id}`);
    if (slugs.has(item.slug)) throw new Error(`duplicate observation slug: ${item.slug}`);
    ids.add(item.id);
    slugs.add(item.slug);
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function hasWorkspaceContent() {
  for (const name of ["candidates", "imports", "drafts"]) {
    const directory = path.join(workspaceDirectory, name);
    const files = await listJsonFiles(directory);
    if (files.length) return true;
  }
  return false;
}

export async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}
