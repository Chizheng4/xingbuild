const COMPOSITIONS = Object.freeze([
  "HomeComposition",
  "ShowcaseComposition",
  "CollectionComposition",
  "ReadingComposition",
]);

const REGIONS = Object.freeze([
  "TopBand",
  "left",
  "right",
  "body",
  "rail",
  "RichDocument",
  "ClosingSection",
]);

const CONTENT_REFERENCE_TYPES = Object.freeze([
  "home",
  "site",
  "practice",
  "businessObservation",
  "observationBriefs",
  "evergreenArticle",
  "profile",
]);

const COMPOSITION_REGIONS = Object.freeze({
  HomeComposition: Object.freeze(["TopBand", "body", "rail", "ClosingSection"]),
  ShowcaseComposition: Object.freeze(["TopBand", "left", "right", "body", "rail", "ClosingSection"]),
  CollectionComposition: Object.freeze(["TopBand", "body", "rail", "ClosingSection"]),
  ReadingComposition: Object.freeze(["TopBand", "body", "RichDocument", "ClosingSection", "rail"]),
});

const ROUTE_PATTERN = /^\/(?:[^?#\\]|\/)*$/;
const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

const pageDefinition = (definition) => Object.freeze({
  ...definition,
  regions: Object.freeze([...definition.regions]),
  contentRefs: Object.freeze(Object.fromEntries(
    Object.entries(definition.contentRefs).map(([key, value]) => [key, Object.freeze({ ...value })]),
  )),
  navigationContext: Object.freeze({ ...definition.navigationContext }),
  acceptance: Object.freeze([...definition.acceptance]),
});

/**
 * The product-facing page contract. Content references identify an approved
 * repository object; they never inline business facts or rendering details.
 */
export const pageDefinitions = Object.freeze([
  pageDefinition({
    id: "home",
    route: "/",
    intent: "定位语与最新作品、经营观察的统一投影",
    composition: "HomeComposition",
    regions: ["TopBand", "body", "ClosingSection"],
    contentRefs: {
      home: { type: "home", id: "home" },
      practice: { type: "practice", id: "robotaxi" },
      businessObservation: { type: "businessObservation", id: "enterprise-operating-framework" },
      briefs: { type: "observationBriefs", scope: "all" },
    },
    navigationContext: { origin: "/", returnTo: "/" },
    responsivePolicy: "shared",
    acceptance: ["single-positioning-h1", "shared-content-projection", "no-empty-rail"],
  }),
  pageDefinition({
    id: "products",
    route: "/products",
    intent: "展示 Robotaxi 作品及其状态边界",
    composition: "ShowcaseComposition",
    regions: ["TopBand", "body", "ClosingSection"],
    contentRefs: {
      practice: { type: "practice", id: "robotaxi" },
    },
    navigationContext: { origin: "/products", returnTo: "/products" },
    responsivePolicy: "shared",
    acceptance: ["showcase-boundary", "approved-media-only", "no-empty-rail"],
  }),
  pageDefinition({
    id: "business-observations",
    route: "/business-observations",
    intent: "阅读企业经营体系常青长文与最新经营观察",
    composition: "ReadingComposition",
    regions: ["RichDocument", "rail"],
    contentRefs: {
      article: { type: "evergreenArticle", id: "enterprise-operating-system" },
      briefs: { type: "observationBriefs", scope: "all" },
    },
    navigationContext: { origin: "/business-observations", returnTo: "/business-observations" },
    responsivePolicy: "shared",
    acceptance: ["reading-toc", "article-source-boundary", "no-empty-rail"],
  }),
  pageDefinition({
    id: "observations",
    route: "/observations",
    intent: "阅读已核验的观察集合",
    composition: "CollectionComposition",
    regions: ["TopBand", "body"],
    contentRefs: {
      home: { type: "home", id: "home" },
      briefs: { type: "observationBriefs", scope: "all" },
    },
    navigationContext: { origin: "/observations", returnTo: "/observations" },
    responsivePolicy: "shared",
    acceptance: ["brief-reader-block", "safe-return-context", "no-empty-rail-placeholder"],
  }),
  pageDefinition({
    id: "about",
    route: "/about",
    intent: "阅读作者定位、能力、经历和简历制品",
    composition: "ReadingComposition",
    regions: ["TopBand", "RichDocument"],
    contentRefs: { profile: { type: "profile", id: "about" } },
    navigationContext: { origin: "/about", returnTo: "/about" },
    responsivePolicy: "shared",
    acceptance: ["controlled-rich-document", "reading-width", "source-fact-boundary"],
  }),
]);

/**
 * A fixture is intentionally not part of the public registry. It proves that
 * an additional ReadingComposition page can be represented by this contract
 * and an existing content reference without a page component or CSS branch.
 */
export const pageDefinitionFixtures = Object.freeze([
  pageDefinition({
    id: "about-reading-fixture",
    route: "/__fixtures__/about-reading",
    intent: "验证同一 ReadingComposition 可以复用 About 内容",
    composition: "ReadingComposition",
    regions: ["TopBand", "RichDocument"],
    contentRefs: { profile: { type: "profile", id: "about" } },
    navigationContext: { origin: "/about", returnTo: "/about" },
    responsivePolicy: "shared",
    acceptance: ["fixture-only", "same-composition", "no-page-jsx-or-css"],
  }),
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSafePath(value) {
  return typeof value === "string"
    && value.startsWith("/")
    && !value.startsWith("//")
    && !value.includes("\\")
    && ROUTE_PATTERN.test(value);
}

function validateContentReference(ref, key, errors, index) {
  if (!isPlainObject(ref)) {
    errors.push(`definitions[${index}].contentRefs.${key} must be an object`);
    return;
  }
  if (!CONTENT_REFERENCE_TYPES.includes(ref.type)) {
    errors.push(`definitions[${index}].contentRefs.${key}.type is not registered: ${String(ref.type)}`);
  }
  if (ref.type !== "observationBriefs" && (typeof ref.id !== "string" || !ref.id.length)) {
    errors.push(`definitions[${index}].contentRefs.${key}.id must be a non-empty string`);
  }
  if (ref.type === "observationBriefs" && ref.scope !== "all" && ref.scope !== "robotaxi") {
    errors.push(`definitions[${index}].contentRefs.${key}.scope must be all or robotaxi`);
  }
  const allowedKeys = ref.type === "observationBriefs" ? ["type", "scope"] : ["type", "id"];
  for (const property of Object.keys(ref)) {
    if (!allowedKeys.includes(property)) {
      errors.push(`definitions[${index}].contentRefs.${key} has unsupported field: ${property}`);
    }
  }
}

/**
 * Return all schema errors. Keeping this separate from the throwing assertion
 * makes the failure contract easy to exercise in unit tests and tooling.
 */
export function validatePageDefinitions(definitions, { reservedRoutes = [] } = {}) {
  const errors = [];
  if (!Array.isArray(definitions) || definitions.length === 0) return ["definitions must be a non-empty array"];
  const ids = new Set();
  const routes = new Set(reservedRoutes);

  definitions.forEach((definition, index) => {
    const prefix = `definitions[${index}]`;
    if (!isPlainObject(definition)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    if (typeof definition.id !== "string" || !ID_PATTERN.test(definition.id)) errors.push(`${prefix}.id must be a stable kebab-case identifier`);
    else if (ids.has(definition.id)) errors.push(`${prefix}.id duplicates ${definition.id}`);
    else ids.add(definition.id);
    if (!isSafePath(definition.route)) errors.push(`${prefix}.route must be a safe absolute path`);
    else if (routes.has(definition.route)) errors.push(`${prefix}.route conflicts with ${definition.route}`);
    else routes.add(definition.route);
    if (!COMPOSITIONS.includes(definition.composition)) errors.push(`${prefix}.composition is not registered: ${String(definition.composition)}`);
    if (!Array.isArray(definition.regions) || definition.regions.length === 0) errors.push(`${prefix}.regions must be a non-empty array`);
    else {
      const regionSet = new Set();
      for (const region of definition.regions) {
        if (!REGIONS.includes(region)) errors.push(`${prefix}.regions contains unknown region: ${String(region)}`);
        if (regionSet.has(region)) errors.push(`${prefix}.regions duplicates ${region}`);
        regionSet.add(region);
        if (COMPOSITIONS.includes(definition.composition) && !COMPOSITION_REGIONS[definition.composition].includes(region)) {
          errors.push(`${prefix}.regions.${region} is not allowed for ${definition.composition}`);
        }
      }
    }
    if (!isPlainObject(definition.contentRefs) || Object.keys(definition.contentRefs).length === 0) errors.push(`${prefix}.contentRefs must be a non-empty object`);
    else Object.entries(definition.contentRefs).forEach(([key, ref]) => validateContentReference(ref, key, errors, index));
    if (!isPlainObject(definition.navigationContext)) errors.push(`${prefix}.navigationContext must be an object`);
    else {
      for (const key of ["origin", "returnTo"]) {
        if (!isSafePath(definition.navigationContext[key])) errors.push(`${prefix}.navigationContext.${key} must be a safe absolute path`);
      }
    }
    if (definition.responsivePolicy !== "shared") errors.push(`${prefix}.responsivePolicy must use the shared strategy`);
    if (!Array.isArray(definition.acceptance) || definition.acceptance.length === 0 || definition.acceptance.some((item) => typeof item !== "string" || !item)) errors.push(`${prefix}.acceptance must be a non-empty string array`);
  });
  return errors;
}

export function assertValidPageDefinitions(definitions, options) {
  const errors = validatePageDefinitions(definitions, options);
  if (errors.length) throw new Error(`Invalid PageDefinition registry:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return definitions;
}

assertValidPageDefinitions(pageDefinitions);
assertValidPageDefinitions(pageDefinitionFixtures);

export const pageDefinitionRegistry = Object.freeze(Object.fromEntries(pageDefinitions.map((definition) => [definition.id, definition])));

export function getPageDefinition(id) {
  return pageDefinitionRegistry[id] ?? null;
}

export function findPageDefinitionByRoute(route) {
  return pageDefinitions.find((definition) => definition.route === route) ?? null;
}

export { COMPOSITIONS, REGIONS, CONTENT_REFERENCE_TYPES, COMPOSITION_REGIONS };
