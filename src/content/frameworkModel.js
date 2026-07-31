export const FRAMEWORK_BASE = "/enterprise-operating-framework";

const nodeCaptions = {
  "external-context": "外部条件",
  "operation-design": "设计层",
  "digital-implementation": "支撑层",
  "enterprise-reality": "被设计和建设的现实对象",
  "enterprise-operation": "执行主链",
  "operating-facts-results": "执行输出",
  "operating-decision": "衡量与反馈",
  "business-trigger": "触发条件",
  "value-stream": "价值形成路径",
  "capability-resource": "稳定完成什么、依靠什么",
  responsibility: "责任承接",
  "business-process": "执行活动与顺序",
  "business-rule": "侧向约束",
  "business-object-state": "业务现实的变化",
  "business-facts-results": "执行输出",
  "business-metric": "基于事实计算",
  "target-gap": "衡量、比较与反馈",
  "enterprise-business-architecture": "提出数字化需求",
  "b2b-product-architecture": "设计层 · 产品轨道",
  "data-architecture": "设计层 · 数据轨道",
  "technical-architecture": "系统结构与服务边界",
  engineering: "实现活动",
  "enterprise-digital-system": "实现结果",
  "enterprise-reality-operation": "系统进入并支持或执行",
  "digital-facts-results": "运作产生，系统记录",
  "digital-decision": "支持分析，调整业务架构",
  subject: "参与者",
  "activity-process": "参与和作用",
  object: "被作用和追踪的事物",
  relation: "独立现实结构",
  state: "主体、对象、关系分别具有",
  event: "改变状态和关系",
  rule: "约束活动与事件",
  result: "活动与事件形成",
  fact: "记录或验证状态、活动、事件",
  metric: "衡量状态、过程、结果",
};

const node = (id, name, kind, definition, role, desktop, mobile) => ({
  id,
  name,
  kind,
  caption: nodeCaptions[id],
  definition,
  role,
  projection: { desktop, mobile },
});

const edge = (id, from, to, label, kind, desktop, mobile) => ({
  id,
  from,
  to,
  label,
  kind,
  projection: { desktop, mobile },
});

const line = (path, x, y) => ({ path, label: { x, y } });
const position = (x, y, width) => ({ x, y, width });

import { digitalImplementationArchitecture } from "../generated/digitalImplementationArchitecture.js";

const legacyArchitectures = [
  {
    id: "enterprise-operation",
    kicker: "企业经营",
    question: "一家企业如何持续创造价值、形成经营结果并调整自身？",
    intro:
      "企业在外部环境与利益相关者需求下设计并建设现实，通过实际运作产生事实和结果，再据此持续调整。",
    defaultNodeId: "enterprise-reality",
    height: { desktop: 570, mobile: 880 },
    viewBox: { desktop: "0 0 900 570", mobile: "0 0 350 880" },
    boundary: {
      label: "企业经营体系 · 系统边界",
      desktop: { top: 148, bottom: 18 },
      mobile: { top: 160, bottom: 18 },
    },
    nodes: [
      node(
        "external-context",
        "外部环境、利益相关者与需求",
        "trigger",
        "外部环境是企业所处的市场、竞争、技术、政策、社会和宏观经济条件；利益相关者提出需求、提供资源、参与合作或承担结果。",
        "它位于企业经营体系边界之外，影响经营与架构设计，并构成企业现实的条件。",
        position(31, 34, 38),
        position(8, 48, 84),
      ),
      node(
        "operation-design",
        "经营与架构设计",
        "standard",
        "战略、商业模式、企业经营架构和企业业务架构对企业现实作出选择与设计，并指导企业现实的建设和调整。",
        "它建设和调整企业现实，并向数字化实现提出需求。",
        position(7, 190, 25),
        position(9, 190, 55),
      ),
      node(
        "digital-implementation",
        "数字化实现",
        "standard",
        "企业业务架构提出数字化需求，产品、数据、技术和工程共同形成进入企业现实的数字化系统。",
        "它承接经营与架构设计的数字化需求，形成系统并进入企业现实。",
        position(7, 316, 25),
        position(9, 305, 55),
      ),
      node(
        "enterprise-reality",
        "企业现实",
        "core",
        "企业现实由产品与服务、业务、资源、企业能力、组织、规则、合作伙伴和数字化系统等共同构成，并在实际运作中持续变化。",
        "它受到外部条件影响，被经营与架构设计建设和调整，并通过企业运作产生事实与经营结果。",
        position(48, 190, 24),
        position(36, 420, 55),
      ),
      node(
        "enterprise-operation",
        "企业运作",
        "standard",
        "企业中业务活动与支撑活动的实际执行。",
        "它在企业现实中发生，产生事实与经营结果，并受到经营分析与决策的后续影响。",
        position(70, 306, 23),
        position(36, 530, 55),
      ),
      node(
        "operating-facts-results",
        "事实与经营结果",
        "result",
        "事实记录已经发生并可验证的状态、事件、活动、资源投入和数量；经营结果是明确范围和期间内形成的可验证后果。",
        "它由企业运作产生，并支持经营分析与决策。",
        position(55, 424, 27),
        position(36, 640, 55),
      ),
      node(
        "operating-decision",
        "经营分析与决策",
        "measure",
        "根据事实、指标和目标差距识别驱动因素，并调整策略、资源、业务规则和后续运作。",
        "它把运行反馈带回经营与架构设计，同时影响后续企业运作。",
        position(17, 458, 28),
        position(9, 755, 55),
      ),
    ],
    edges: [
      edge("op-external-design", "external-context", "operation-design", "影响", "constraint", line("M405 88 V150 H176 V190", 285, 140), line("M145 97 V165 H105 V190", 78, 150)),
      edge("op-external-reality", "external-context", "enterprise-reality", "构成现实条件", "constraint", line("M495 88 V150 H540 V190", 505, 140), line("M250 97 H335 V445 H318", 258, 118)),
      edge("op-design-reality", "operation-design", "enterprise-reality", "建设和调整", "standard", line("M288 216 H432", 337, 207), line("M224 215 H300 V395 H205 V420", 230, 386)),
      edge("op-design-digital", "operation-design", "digital-implementation", "提出数字化需求", "standard", line("M176 242 V316", 184, 282), line("M105 239 V305", 113, 276)),
      edge("op-digital-reality", "digital-implementation", "enterprise-reality", "形成系统并进入", "standard", line("M288 342 H410 V226 H432", 310, 333), line("M224 330 H335 V445 H318", 232, 321)),
      edge("op-reality-operation", "enterprise-reality", "enterprise-operation", "进行", "standard", line("M648 216 H675 V280 H735 V306", 683, 270), line("M205 470 V530", 214, 503)),
      edge("op-operation-facts", "enterprise-operation", "operating-facts-results", "产生", "standard", line("M735 358 V424", 744, 396), line("M205 580 V640", 214, 613)),
      edge("op-facts-decision", "operating-facts-results", "operating-decision", "支持", "standard", line("M495 450 H450 V486 H405", 432, 440), line("M126 665 H90 V780 H224", 98, 655)),
      edge("op-decision-design", "operating-decision", "operation-design", "调整选择与设计", "feedback", line("M153 486 H35 V216 H63", 43, 416), line("M32 780 H15 V215 H32", 22, 704)),
      edge("op-decision-operation", "operating-decision", "enterprise-operation", "影响后续运作", "feedback", line("M405 486 V552 H882 V332 H837", 610, 544), line("M224 780 H335 V555 H318", 236, 770)),
    ],
    tracks: [],
  },
  {
    id: "business-design",
    kicker: "业务设计",
    question: "如何把战略和经营目标转化为可执行、可度量的业务设计？",
    intro:
      "价值形成与执行构成主脊柱；组织责任、规则和指标从侧面承接、约束与衡量。",
    defaultNodeId: "business-process",
    height: { desktop: 570, mobile: 1040 },
    viewBox: { desktop: "0 0 900 570", mobile: "0 0 350 1040" },
    nodes: [
      node("business-trigger", "利益相关者需求 / 业务事件", "trigger", "利益相关者需求表达希望解决的问题和预期结果；业务事件可以成为价值形成与执行的触发条件。", "它触发价值流，是业务设计的现实起点。", position(31, 25, 38), position(10, 38, 80)),
      node("value-stream", "价值流", "core", "从利益相关者需求或业务触发开始，经过多个价值阶段形成用户价值和经营结果的端到端路径。", "它把触发转化为价值形成路径，并识别所需企业能力与资源。", position(34, 112, 32), position(23, 137, 66)),
      node("capability-resource", "企业能力与资源", "standard", "企业能力是企业为回应需求、完成业务并形成结果必须持续完成的事情；资源是可以投入、配置、使用或消耗的对象。", "它承接价值流要求，并通过业务流程落实。", position(34, 202, 32), position(23, 238, 66)),
      node("responsibility", "企业职能归类 / 组织承担", "standard", "企业职能归类相关能力和专业责任；组织把部门、团队、角色、责任和权限落实到现实安排。", "它从侧面归类企业能力，并明确具体承担者。", position(3, 202, 25), position(3, 326, 46)),
      node("business-process", "业务流程", "core", "在明确触发条件、角色分工和业务规则下，为完成业务目标而执行的活动及顺序。", "它承接企业能力与资源，改变业务对象的状态与关系。", position(34, 292, 32), position(23, 424, 66)),
      node("business-rule", "业务规则", "constraint", "对业务行为、对象关系、判断和状态变化的约束。", "它约束业务流程中的行为与判断，也约束业务对象关系和状态变化。", position(72, 292, 24), position(51, 512, 46)),
      node("business-object-state", "业务对象的状态与关系", "standard", "业务对象是在企业运作中被创建、使用、改变和持续追踪的对象；状态与关系表达对象当前条件及已建立联系。", "它由业务流程改变，并产生可记录的事实与结果。", position(34, 382, 32), position(23, 610, 66)),
      node("business-facts-results", "事实与结果", "result", "事实记录已发生的对象状态、事件、活动与数量；结果是活动和事件在明确范围和期间内形成的后果。", "它由对象变化和业务执行产生，为指标计算提供依据。", position(34, 474, 22), position(6, 714, 45)),
      node("business-metric", "指标", "measure", "根据事实计算并用于衡量状态、过程和结果的口径及数值。", "它基于事实计算，并用于衡量价值流结果与经营目标的差距。", position(61, 474, 16), position(55, 714, 39)),
      node("target-gap", "价值流结果与经营目标差距", "measure", "经营结果与经营目标之间的差距，用于识别驱动因素并形成调整决策。", "它触发对企业能力、业务流程和业务规则的反馈调整。", position(80, 454, 18), position(23, 820, 66)),
    ],
    edges: [
      edge("bd-trigger-value", "business-trigger", "value-stream", "触发", "standard", line("M450 75 V112", 460, 99), line("M175 88 V137", 184, 116)),
      edge("bd-value-capability", "value-stream", "capability-resource", "需要", "standard", line("M450 160 V202", 460, 189), line("M175 188 V238", 184, 218)),
      edge("bd-capability-process", "capability-resource", "business-process", "通过流程落实", "standard", line("M450 250 V292", 460, 279), line("M200 288 V424", 209, 386)),
      edge("bd-process-object", "business-process", "business-object-state", "改变", "standard", line("M450 340 V382", 460, 370), line("M200 475 V610", 209, 577)),
      edge("bd-object-facts", "business-object-state", "business-facts-results", "产生", "standard", line("M450 430 V474", 460, 459), line("M175 660 V690 H100 V714", 184, 684)),
      edge("bd-responsibility-capability", "responsibility", "capability-resource", "归类并承担", "standard", line("M252 226 H306", 260, 216), line("M120 326 V305 H80 V263", 86, 315)),
      edge("bd-rule-process", "business-rule", "business-process", "约束行为与判断", "constraint", line("M648 306 H594", 600, 296), line("M178 527 H330 V450 H311", 236, 440)),
      edge("bd-rule-object", "business-rule", "business-object-state", "约束关系与状态变化", "constraint", line("M756 340 V405 H594", 608, 396), line("M178 552 H330 V635 H311", 205, 625)),
      edge("bd-facts-metric", "business-facts-results", "business-metric", "提供计算依据", "standard", line("M504 498 H549", 506, 488), line("M179 739 H193", 115, 728)),
      edge("bd-metric-gap", "business-metric", "target-gap", "衡量并比较", "constraint", line("M693 498 H720", 690, 488), line("M260 764 V800 H200 V820", 266, 793)),
      edge("bd-gap-capability", "target-gap", "capability-resource", "调整能力与资源", "feedback", line("M892 226 H594", 680, 216), line("M345 263 H311", 236, 253)),
      edge("bd-gap-process", "target-gap", "business-process", "调整流程", "feedback", line("M892 360 H620 V316 H594", 700, 350), line("M345 450 H311", 264, 440)),
      edge("bd-gap-rule", "target-gap", "business-rule", "调整规则", "feedback", line("M892 316 H864", 810, 306), line("M345 537 H340", 274, 527)),
    ],
    tracks: [
      {
        id: "bd-feedback-track",
        relatedEdgeIds: ["bd-gap-capability", "bd-gap-process", "bd-gap-rule"],
        projection: {
          desktop: { path: "M882 486 H892 V180" },
          mobile: { path: "M311 850 H345 V220" },
        },
      },
    ],
  },
  {
    id: "concept-grammar",
    kicker: "概念语法",
    question: "如何避免同一个业务词在不同讨论中混用，失去明确边界？",
    intro:
      "从参与和作用、现实结构、变化、约束、记录与衡量理解十个底层概念之间的关系。",
    defaultNodeId: "activity-process",
    height: { desktop: 570, mobile: 1010 },
    viewBox: { desktop: "0 0 900 570", mobile: "0 0 350 1010" },
    nodes: [
      node("subject", "主体", "standard", "能够提出需求、参与行动、作出决定或承担结果的现实参与者。", "主体参与活动，与主体或对象建立关系，并具有状态。", position(5, 50, 20), position(5, 38, 38)),
      node("activity-process", "活动与过程", "core", "为形成某一结果而发生的动作及顺序。", "它由主体参与、作用于对象、受到规则约束，形成结果并由事实记录或验证。", position(38, 50, 24), position(53, 38, 42)),
      node("object", "对象", "standard", "在现实中被识别、使用、改变或持续追踪的事物。", "对象被活动作用，与主体或对象建立关系，并具有状态。", position(75, 50, 20), position(53, 145, 42)),
      node("relation", "关系", "standard", "主体或对象之间已建立的联系、权利或义务。", "它由主体或对象建立，具有状态，并可能被事件改变。", position(7, 180, 22), position(5, 255, 38)),
      node("state", "状态", "standard", "主体、对象或关系在某一时点满足的明确条件。", "它分别属于主体、对象或关系，会被事件改变，并由事实记录或验证。", position(39, 180, 22), position(53, 255, 42)),
      node("event", "事件", "standard", "已经发生并引起对象状态或关系变化的动作。", "它受到规则约束，改变状态或关系，形成结果并由事实记录或验证。", position(73, 180, 22), position(29, 365, 42)),
      node("rule", "规则", "constraint", "对行为、关系、判断和状态变化的约束。", "它约束活动，也约束事件引起的状态和关系变化。", position(73, 300, 22), position(53, 475, 42)),
      node("result", "结果", "result", "活动与事件在明确范围和期间内形成的可验证后果。", "它由活动与事件形成，并由指标衡量；结果本身不直接生成事实。", position(39, 300, 22), position(5, 475, 38)),
      node("fact", "事实", "standard", "已经发生并可以由证据验证的状态、事件、活动或数量。", "它记录或验证状态、活动和事件，并为指标提供计算依据。", position(22, 428, 24), position(14, 620, 44)),
      node("metric", "指标", "measure", "根据事实计算并用于衡量状态、过程和结果的口径及数值。", "它以事实为计算依据，分别衡量状态、活动过程和结果。", position(56, 428, 24), position(42, 760, 44)),
    ],
    edges: [
      edge("cg-subject-activity", "subject", "activity-process", "参与", "standard", line("M225 76 H340", 270, 66), line("M130 66 H186", 145, 56)),
      edge("cg-activity-object", "activity-process", "object", "作用于", "standard", line("M560 76 H675", 605, 66), line("M260 94 V145", 268, 123)),
      edge("cg-subject-relation", "subject", "relation", "建立关系", "standard", line("M140 100 V180", 148, 145), line("M75 88 V255", 83, 181)),
      edge("cg-object-relation", "object", "relation", "建立关系", "standard", line("M760 100 V150 H210 V180", 610, 141), line("M260 195 V230 H75 V255", 165, 220)),
      edge("cg-subject-state", "subject", "state", "具有状态", "standard", line("M180 100 V160 H400 V180", 250, 151), line("M105 88 V230 H260 V255", 112, 151)),
      edge("cg-object-state", "object", "state", "具有状态", "standard", line("M720 100 V165 H500 V180", 620, 156), line("M260 195 V255", 268, 230)),
      edge("cg-relation-state", "relation", "state", "具有状态", "standard", line("M260 205 H350", 283, 195), line("M130 280 H185", 139, 270)),
      edge("cg-event-state", "event", "state", "改变状态", "standard", line("M657 197 H549", 585, 187), line("M175 365 V330 H260 V305", 184, 345)),
      edge("cg-event-relation", "event", "relation", "改变关系", "standard", line("M720 230 V260 H210 V230", 575, 252), line("M175 415 H75 V305", 82, 402)),
      edge("cg-rule-event", "rule", "event", "约束状态和关系变化", "constraint", line("M760 300 V230", 768, 270), line("M260 475 V440 H205 V415", 214, 433)),
      edge("cg-rule-activity", "rule", "activity-process", "约束活动", "constraint", line("M657 325 H590 V76 H560", 598, 316), line("M333 500 H342 V66 H333", 273, 490)),
      edge("cg-activity-result", "activity-process", "result", "形成", "standard", line("M450 100 V300", 458, 279), line("M230 94 H165 V335 H100 V475", 108, 345)),
      edge("cg-event-result", "event", "result", "形成", "standard", line("M657 205 H580 V325 H549", 582, 315), line("M175 415 V455 H75 V475", 112, 445)),
      edge("cg-state-fact", "state", "fact", "状态由事实记录或验证", "standard", line("M450 230 H620 V405 H306 V428", 470, 390), line("M333 280 H337 V600 H180 V620", 190, 590)),
      edge("cg-activity-fact", "activity-process", "fact", "活动由事实记录或验证", "standard", line("M342 100 H320 V405 H280 V428", 286, 377), line("M260 94 V115 H8 V640 H49", 16, 600)),
      edge("cg-event-fact", "event", "fact", "事件由事实记录或验证", "standard", line("M760 230 V270 H880 V405 H350 V428", 610, 397), line("M102 390 H15 V655 H49", 23, 645)),
      edge("cg-fact-metric", "fact", "metric", "提供计算依据", "standard", line("M415 458 H505", 424, 448), line("M170 650 V740 H195", 180, 705)),
      edge("cg-metric-state", "metric", "state", "衡量状态", "constraint", line("M620 428 V260 H500 V230", 628, 332), line("M301 780 H342 V280 H333", 242, 770)),
      edge("cg-metric-activity", "metric", "activity-process", "衡量过程", "constraint", line("M720 452 H880 V76 H560", 730, 442), line("M301 800 H347 V66 H333", 257, 825)),
      edge("cg-metric-result", "metric", "result", "衡量结果", "constraint", line("M620 428 V350 H520", 628, 398), line("M301 790 H335 V545 H100 V525", 250, 780)),
    ],
    tracks: [],
  },
];

export const architectures = [
  ...legacyArchitectures,
  digitalImplementationArchitecture,
];

export const architectureById = new Map(architectures.map((item) => [item.id, item]));

export function connectedEdgeIds(architecture, nodeId) {
  return architecture.edges
    .filter((item) => item.from === nodeId || item.to === nodeId)
    .map((item) => item.id);
}

export function validateFrameworkModel() {
  const errors = [];
  const architectureIds = new Set();
  for (const architecture of architectures) {
    if (architectureIds.has(architecture.id)) errors.push(`duplicate architecture: ${architecture.id}`);
    architectureIds.add(architecture.id);
    const nodeIds = new Set();
    for (const item of architecture.nodes) {
      if (nodeIds.has(item.id)) errors.push(`duplicate node in ${architecture.id}: ${item.id}`);
      nodeIds.add(item.id);
      if (!item.definition || !item.role) errors.push(`incomplete node: ${architecture.id}/${item.id}`);
      if (architecture.id !== "digital-implementation" && (!item.projection.desktop || !item.projection.mobile)) {
        errors.push(`missing node projection: ${architecture.id}/${item.id}`);
      }
    }
    if (!nodeIds.has(architecture.defaultNodeId)) {
      errors.push(`missing default node: ${architecture.id}/${architecture.defaultNodeId}`);
    }
    const edgeIds = new Set();
    for (const item of architecture.edges) {
      if (edgeIds.has(item.id)) errors.push(`duplicate edge: ${item.id}`);
      edgeIds.add(item.id);
      if (!nodeIds.has(item.from) || !nodeIds.has(item.to)) {
        errors.push(`missing edge endpoint: ${architecture.id}/${item.id}`);
      }
      if (!item.label) errors.push(`missing relation label: ${architecture.id}/${item.id}`);
      if (architecture.id !== "digital-implementation" && (!item.projection.desktop?.path || !item.projection.mobile?.path)) {
        errors.push(`missing edge projection: ${architecture.id}/${item.id}`);
      }
    }
    for (const track of architecture.tracks) {
      for (const edgeId of track.relatedEdgeIds) {
        if (!edgeIds.has(edgeId)) errors.push(`track references missing edge: ${track.id}/${edgeId}`);
      }
    }
  }
  return errors;
}
