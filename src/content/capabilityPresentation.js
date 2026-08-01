const CAPABILITY_KINDS = Object.freeze([
  "media",
  "architecture",
  "flow",
  "state",
  "lifecycle",
  "interactive-system",
]);

const CAPABILITY_STATES = Object.freeze([
  "idle",
  "active",
  "selected",
  "result",
  "error",
  "fallback",
]);

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export { CAPABILITY_KINDS, CAPABILITY_STATES };

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasSource(entry) {
  return typeof entry.sourcePath === "string"
    || typeof entry.mediaId === "string"
    || typeof entry.route === "string";
}

export function validateCapabilityPresentation(entry, { allowFixture = false } = {}) {
  const errors = [];
  if (!isPlainObject(entry)) return ["capability must be an object"];
  if (typeof entry.id !== "string" || !ID_PATTERN.test(entry.id)) errors.push("capability.id must be a stable kebab-case identifier");
  if (!CAPABILITY_KINDS.includes(entry.kind)) errors.push(`capability.kind is not supported: ${String(entry.kind)}`);
  if (!hasSource(entry)) errors.push("capability requires sourcePath, mediaId, or route");
  if (typeof entry.alt !== "string" || !entry.alt.trim()) errors.push("capability.alt must be a non-empty string");
  if (entry.title !== undefined && (typeof entry.title !== "string" || !entry.title.trim())) errors.push("capability.title must be a non-empty string when present");
  if (entry.summary !== undefined && typeof entry.summary !== "string") errors.push("capability.summary must be a string when present");
  if (entry.caption !== undefined && typeof entry.caption !== "string") errors.push("capability.caption must be a string when present");
  if (entry.renderer !== undefined && typeof entry.renderer !== "string") errors.push("capability.renderer must be a string when present");
  if (entry.initialState !== undefined && !CAPABILITY_STATES.includes(entry.initialState)) errors.push(`capability.initialState is not supported: ${String(entry.initialState)}`);
  if (entry.fallback !== undefined && (!isPlainObject(entry.fallback) || typeof entry.fallback.text !== "string" || !entry.fallback.text.trim())) errors.push("capability.fallback.text must be a non-empty string");
  if (!allowFixture && entry.fixture === true) errors.push("fixture capabilities are not publishable content");
  const forbidden = ["x", "y", "width", "height", "desktopSrc", "mobileSrc", "path", "viewport", "className", "styles"];
  for (const property of forbidden) if (property in entry) errors.push(`capability has forbidden geometry/presentation field: ${property}`);
  return errors;
}

export function assertCapabilityPresentation(entry, options) {
  const errors = validateCapabilityPresentation(entry, options);
  if (errors.length) throw new Error(`Invalid capability presentation:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return Object.freeze({ ...entry });
}

/** Non-public fixtures prove composition without changing published content objects. */
export const capabilityFixtures = Object.freeze([
  Object.freeze({
    id: "enterprise-architecture-fixture",
    kind: "architecture",
    renderer: "static-figure",
    sourcePath: "src/architecture/digital-implementation/model.c4",
    title: "企业经营体系架构图",
    summary: "同一图源由能力展示空间按可用容器自适应投影。",
    alt: "企业经营体系数字化实现架构图",
    caption: "fixture：复用已批准的静态图形产物。",
    initialState: "idle",
    fallback: { text: "架构图暂不可用，已保留同源文本说明。" },
    fixture: true,
  }),
  Object.freeze({
    id: "interactive-system-fixture",
    kind: "interactive-system",
    route: "/products",
    title: "受控系统入口",
    summary: "能力主机统一处理入口、状态和失败降级。",
    alt: "受控系统入口",
    caption: "fixture：使用既有 Showcase/SystemStage 组合。",
    initialState: "idle",
    action: { label: "打开受控系统" },
    fallback: { text: "系统入口暂不可用，请稍后重试。" },
    fixture: true,
  }),
]);

capabilityFixtures.forEach((fixture) => assertCapabilityPresentation(fixture, { allowFixture: true }));
