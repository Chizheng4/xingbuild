export const FRAMEWORK_BASE = "/works/enterprise-operating-framework";
export const FRAMEWORK_SOURCE =
  "《企业经营体系、数字化与职业定位认知框架 v5.1》";
export const FRAMEWORK_VERSION = "v5.1";

const source = {
  name: FRAMEWORK_SOURCE,
  version: FRAMEWORK_VERSION,
  synchronizedAt: "2026-07-27",
};

const concept = (value) => ({ status: "固定", source, ...value });

export const frameworkConcepts = [
  concept({
    id: "enterprise-operating-system",
    name: "企业经营体系",
    definition:
      "企业在外部环境中，围绕利益相关者需求作出战略和商业模式选择，组织产品与服务、业务、资源、企业能力、组织和数字化系统进行实际运作，持续创造、交付和获取价值，并根据事实与结果进行分析、决策和调整的企业现实整体。",
    nature: "核心现实对象",
    plane: "企业现实",
    answers: "一家企业如何作出选择、形成能力、持续产生价值与经营结果，并根据事实调整自身？",
    dependsOn: ["external-context", "enterprise-operation", "operating-results"],
    parentContexts: ["企业经营体系总览"],
    relatedTo: ["operation-design", "digital-implementation", "operating-feedback"],
    distinguishesFrom: ["企业经营架构是经营设计，不是企业现实整体。"],
    applications: [],
  }),
  concept({
    id: "external-context",
    name: "外部环境、利益相关者与需求",
    definition:
      "外部环境构成市场、竞争、技术、政策、社会和宏观经济条件；利益相关者与企业相互影响并提出需求、提供资源、参与合作或承担结果；需求表达其希望解决的问题、期望结果与条件。",
    nature: "现实条件、主体与主体状态",
    plane: "企业现实",
    answers: "企业在什么条件和约束下、为谁解决什么问题？",
    dependsOn: ["subject", "state"],
    parentContexts: ["企业经营体系总览"],
    relatedTo: ["operation-design"],
    distinguishesFrom: [],
    applications: [],
  }),
  concept({
    id: "operation-design",
    name: "经营与架构设计",
    definition:
      "战略、商业模式、企业经营架构和企业业务架构对企业现实作出选择与设计，并指导企业现实的建设和调整。",
    nature: "选择与设计平面",
    plane: "经营与架构设计",
    answers: "企业要如何把方向和经营目标转化为业务与现实建设？",
    dependsOn: ["enterprise-operating-system"],
    parentContexts: ["企业经营体系总览"],
    relatedTo: ["digital-implementation", "operating-feedback"],
    distinguishesFrom: ["它表达设计，不等同于企业运作。"],
    applications: [],
  }),
  concept({
    id: "digital-implementation",
    name: "数字化实现",
    definition:
      "企业业务架构提出数字化需求，B 端产品架构与数据架构协同设计并驱动技术架构，通过工程实现形成进入企业现实的企业数字化系统。",
    nature: "设计转化与工程实现平面",
    plane: "数字化实现",
    answers: "业务设计如何转化为可以进入企业现实运行的产品、数据和系统？",
    dependsOn: ["enterprise-business-architecture"],
    parentContexts: ["企业经营体系总览"],
    relatedTo: ["enterprise-operation", "operating-feedback"],
    distinguishesFrom: ["数字化实现不是系统功能清单。"],
    applications: [],
  }),
  concept({
    id: "operating-feedback",
    name: "运行反馈",
    definition:
      "企业运作产生事实与经营结果，指标根据事实计算并与经营目标比较，经营分析和决策据此调整选择、设计、资源、规则和后续运作。",
    nature: "分析与反馈平面",
    plane: "运行反馈",
    answers: "已经发生什么、结果如何，以及下一轮应如何调整？",
    dependsOn: ["fact", "metric", "result"],
    parentContexts: ["企业经营体系总览"],
    relatedTo: ["operation-design", "enterprise-operation"],
    distinguishesFrom: [],
    applications: [],
  }),
  concept({
    id: "enterprise-operation",
    name: "企业运作",
    definition: "企业中业务活动与支撑活动的实际执行。",
    nature: "活动与过程",
    plane: "企业现实",
    answers: "企业现实中的活动如何实际发生？",
    dependsOn: ["activity-process", "rule"],
    parentContexts: ["企业经营体系总览", "企业现实"],
    relatedTo: ["operating-results"],
    distinguishesFrom: ["企业运作是现实执行，经营与架构设计表达选择与设计。"],
    applications: [],
  }),
  concept({
    id: "operating-results",
    name: "事实与经营结果",
    definition:
      "事实记录企业运作中已经发生并可验证的状态、事件、活动、资源投入和数量；经营结果是企业运作在明确范围和期间内形成、可根据指标判断的用户、业务和经济结果。",
    nature: "证据与结果",
    plane: "运行反馈",
    answers: "企业运作实际发生了什么，并形成什么可验证后果？",
    dependsOn: ["fact", "result"],
    parentContexts: ["企业经营体系总览", "运行反馈"],
    relatedTo: ["operating-feedback"],
    distinguishesFrom: ["目标、计划和预测不是已经发生的事实。"],
    applications: [],
  }),
  concept({
    id: "enterprise-business-architecture",
    name: "企业业务架构",
    definition:
      "围绕企业经营目标，对业务领域、企业能力、价值流、企业职能、组织责任、业务流程、业务对象、业务事件、业务规则和指标进行整体设计，明确企业如何实际创造、交付和获取价值。",
    nature: "架构设计",
    plane: "经营与架构设计",
    answers: "需要哪些能力、如何形成价值、由谁负责、具体如何运作？",
    dependsOn: ["enterprise-operating-system"],
    parentContexts: ["经营与架构设计", "数字化实现"],
    relatedTo: [
      "business-domain", "enterprise-capability", "value-stream",
      "enterprise-function", "organizational-responsibility", "business-process",
      "business-objects-events", "business-rule", "business-metric",
    ],
    distinguishesFrom: ["企业经营架构回答经营什么、投入什么、追求什么结果以及如何分析决策。"],
    applications: [],
  }),
  ...[
    ["business-domain", "业务领域", "按照业务知识、问题和责任范围对企业业务进行的逻辑划分", "业务范围如何划分"],
    ["enterprise-capability", "企业能力", "企业为实现经营目标必须能够稳定完成的事情", "企业必须能够做什么"],
    ["value-stream", "价值流", "从利益相关者需求或业务触发开始，经过多个价值阶段形成用户价值和经营结果的端到端路径", "价值如何端到端形成"],
    ["enterprise-function", "企业职能", "根据专业分工对相关能力和管理责任进行的归类", "相关能力属于什么专业责任"],
    ["organizational-responsibility", "组织责任", "对部门、团队、角色、责任和权限的安排", "具体由谁负责和决策"],
    ["business-process", "业务流程", "在明确触发条件、角色分工和业务规则下为完成业务目标而执行的活动及顺序", "具体如何执行"],
    ["business-objects-events", "业务对象与事件", "企业运作中被改变和追踪的对象，以及改变其状态与关系的事件", "围绕什么运作，发生了什么"],
    ["business-rule", "业务规则", "对业务行为、对象关系、判断和状态变化的约束", "业务受到什么约束"],
    ["business-metric", "业务指标", "根据相关事实衡量目标、过程和结果的口径及数值", "如何衡量目标与结果"],
  ].map(([id, name, definition, answers]) => concept({
    id, name, definition, answers,
    nature: "企业业务架构固定视角",
    plane: "经营与架构设计",
    dependsOn: ["enterprise-business-architecture"],
    parentContexts: ["企业业务架构"],
    relatedTo: [],
    distinguishesFrom: [],
    applications: [],
  })),
  concept({
    id: "business-object",
    name: "业务对象",
    definition:
      "在企业运作中被创建、使用、改变和持续追踪的对象，如用户、产品、订单、合同、Robotaxi 和结算单。",
    nature: "对象在企业业务架构中的限定表达",
    plane: "经营与架构设计",
    answers: "企业运作围绕什么被创建、使用、改变和持续追踪？",
    dependsOn: ["object"],
    parentContexts: ["企业业务架构", "业务对象与事件"],
    relatedTo: ["business-objects-events"],
    distinguishesFrom: ["业务对象不是新增底层概念，而是“对象”的限定表达。"],
    applications: [],
  }),
  ...[
    ["subject", "主体", "能够提出需求、参与行动、作出决定或承担结果的现实参与者"],
    ["object", "对象", "在现实中被识别、使用、改变或持续追踪的事物"],
    ["relation", "关系", "主体或对象之间已建立的联系、权利或义务"],
    ["state", "状态", "主体、对象或关系在某一时点满足的明确条件"],
    ["event", "事件", "已经发生并引起对象状态或关系变化的动作"],
    ["activity-process", "活动与过程", "为形成某一结果而发生的动作及顺序"],
    ["rule", "规则", "对行为、关系、判断和状态变化的约束"],
    ["fact", "事实", "已经发生并可以由证据验证的状态、事件、活动或数量"],
    ["metric", "指标", "根据事实计算并用于衡量状态、过程和结果的口径及数值"],
    ["result", "结果", "活动与事件在明确范围和期间内形成的可验证后果"],
  ].map(([id, name, definition]) => concept({
    id, name, definition,
    nature: "底层基础概念性质",
    plane: "基础表达语法",
    answers: `判断“${name}”在现实表达中的固定性质。`,
    dependsOn: [],
    parentContexts: ["底层概念与基础表达语法"],
    relatedTo: [],
    distinguishesFrom: [],
    applications: id === "object" ? ["robotaxi-object"] : [],
  })),
];

const relation = (id, from, to, type, label, context) => ({
  id, from, to, type, label, direction: "forward", context,
});

export const allowedRelationTypes = new Set([
  "构成", "参与", "进行", "产生", "影响", "驱动", "指导", "提出需求",
  "形成", "进入", "记录", "计算", "衡量", "支持", "调整", "依赖",
  "限定表达", "属于", "相关", "区别于", "应用于", "由事实支持",
]);

export const frameworkRelations = [
  relation("overview-design", "external-context", "operation-design", "影响", "影响选择与设计", "overview"),
  relation("overview-real", "enterprise-operating-system", "enterprise-operation", "进行", "进行", "overview"),
  relation("overview-digital", "operation-design", "digital-implementation", "提出需求", "提出数字化需求", "overview"),
  relation("overview-enter", "digital-implementation", "enterprise-operation", "进入", "进入并支持", "overview"),
  relation("overview-facts", "enterprise-operation", "operating-results", "产生", "产生", "overview"),
  relation("overview-feedback", "operating-results", "operating-feedback", "支持", "支持分析和决策", "overview"),
  relation("overview-adjust", "operating-feedback", "operation-design", "调整", "调整下一轮设计", "overview"),
  relation("path-digital-business", "digital-implementation", "enterprise-business-architecture", "依赖", "从业务设计开始", "digital"),
  relation("path-business-objects", "enterprise-business-architecture", "business-objects-events", "构成", "包含固定视角", "business-architecture"),
  relation("path-view-object", "business-objects-events", "business-object", "限定表达", "展开业务对象", "business-architecture"),
  relation("path-object-base", "business-object", "object", "限定表达", "底层性质是对象", "foundation"),
  relation("path-object-app", "object", "robotaxi-object", "应用于", "应用于 Robotaxi", "application"),
  ...[
    "business-domain", "enterprise-capability", "value-stream", "enterprise-function",
    "organizational-responsibility", "business-process", "business-rule", "business-metric",
  ].map((id) => relation(`view-${id}`, "enterprise-business-architecture", id, "构成", "固定视角", "business-architecture")),
];

export const frameworkViews = [
  {
    id: "overview",
    name: "企业经营体系总览",
    nodes: [
      "external-context", "enterprise-operating-system", "operation-design",
      "digital-implementation", "enterprise-operation", "operating-results", "operating-feedback",
    ],
    layout: "directed-overview",
  },
  {
    id: "digital",
    name: "数字化实现",
    nodes: ["digital-implementation", "enterprise-business-architecture"],
    layout: "focused-path",
  },
  {
    id: "business-architecture",
    name: "企业业务架构",
    nodes: [
      "enterprise-business-architecture", "enterprise-capability", "value-stream",
      "business-process", "business-objects-events", "business-rule", "business-metric",
      "business-domain", "enterprise-function", "organizational-responsibility", "business-object",
    ],
    primaryNodes: [
      "enterprise-capability", "value-stream", "business-process",
      "business-objects-events", "business-rule", "business-metric",
    ],
    secondaryNodes: ["business-domain", "enterprise-function", "organizational-responsibility"],
    layout: "business-architecture",
  },
];

export const frameworkApplications = [
  {
    id: "robotaxi-object",
    slug: "robotaxi",
    name: "Robotaxi 应用",
    conceptIds: ["business-object", "object"],
    mapping:
      "单台 Robotaxi 是企业用于提供出行服务的实体资源和业务对象；车队履约能力由车辆、技术、人员、规则、流程、设施、伙伴和数字化系统共同形成，不能把单台车辆本身定义为企业能力。",
    evidenceBoundary:
      "这是认知框架在 Robotaxi 场景中的分析应用，不代表真实城市 Robotaxi 经营结果已经被验证。",
    source,
  },
];

export const mainFrameworkPath = [
  { kind: "view", id: "overview", label: "企业经营体系总览" },
  { kind: "concept", id: "digital-implementation", label: "数字化实现" },
  { kind: "concept", id: "enterprise-business-architecture", label: "企业业务架构" },
  { kind: "concept", id: "business-object", label: "业务对象" },
  { kind: "concept", id: "object", label: "对象" },
  { kind: "application", id: "robotaxi-object", label: "Robotaxi 应用" },
];

export const frameworkConceptById = new Map(frameworkConcepts.map((item) => [item.id, item]));
export const frameworkViewById = new Map(frameworkViews.map((item) => [item.id, item]));
export const frameworkApplicationBySlug = new Map(frameworkApplications.map((item) => [item.slug, item]));

export function conceptHref(id, sourceView = "overview") {
  return `${FRAMEWORK_BASE}/concepts/${id}?from=${sourceView}`;
}

export function explorerHref(view = "overview", conceptId) {
  const params = new URLSearchParams({ view });
  if (conceptId) params.set("concept", conceptId);
  return `${FRAMEWORK_BASE}/explore?${params}`;
}

export function applicationHref(slug = "robotaxi", conceptId = "object") {
  return `${FRAMEWORK_BASE}/applications/${slug}?concept=${conceptId}`;
}

export function relationsForView(viewId) {
  return frameworkRelations.filter((item) => item.context === viewId || (
    viewId === "overview" && item.context === "overview"
  ));
}

export function validateFrameworkModel() {
  const errors = [];
  const ids = new Set();
  for (const item of frameworkConcepts) {
    if (ids.has(item.id)) errors.push(`duplicate concept: ${item.id}`);
    ids.add(item.id);
    if (!item.definition || !item.source?.version) errors.push(`incomplete concept: ${item.id}`);
  }
  const applicationIds = new Set(frameworkApplications.map((item) => item.id));
  for (const item of frameworkRelations) {
    if (!ids.has(item.from)) errors.push(`missing relation source: ${item.id}`);
    if (!ids.has(item.to) && !applicationIds.has(item.to)) errors.push(`missing relation target: ${item.id}`);
    if (!allowedRelationTypes.has(item.type)) errors.push(`invalid relation type: ${item.id}`);
  }
  return errors;
}
