export const site = {
  name: "xingbuild",
  author: "金星 · Xingjin",
  description: "持续观察企业如何经营，并把判断构建成可以运行和验证的系统。",
  version: "v0.4.1",
  updatedAt: "2026-07-25",
  location: "广州",
};

export const observations = [
  {
    id: "observation-four-planes",
    slug: "four-planes-of-enterprise-digitalization",
    title: "为什么理解企业数字化，需要同时看见四个平面",
    summary:
      "页面、流程和系统都只是局部投影。要判断数字化是否真正服务经营，需要把企业现实、经营与架构设计、数字化实现和运行反馈放在同一条因果链上。",
    format: "analysis",
    featured: true,
    discussionQuestion:
      "怎样把企业现实、经营设计、数字化实现和运行反馈放进同一条可验证的因果链？",
    topics: ["企业经营", "业务架构", "数字化"],
    status: "published",
    publishedAt: "2026-07-25",
    updatedAt: "2026-07-25",
    relatedWorks: ["enterprise-framework"],
    sourceNotes: "基于 career 项目《企业经营体系、数字化与职业定位认知框架 v5.1》的网站表达快照。",
    sections: [
      {
        heading: "从系统清单回到经营问题",
        paragraphs: [
          "企业数字化经常被描述成系统、功能和项目的集合，但这些实现本身不能说明企业解决了什么经营问题。判断一项数字化建设是否成立，必须继续追问：它改变了哪些业务对象、规则和事实，又通过什么指标回到经营结果。",
          "因此，页面是否完整、流程是否跑通，只是实现层面的事实；它们不能自动等同于业务能力已经形成，更不能等同于经营结果已经出现。",
        ],
      },
      {
        heading: "四个平面承担不同责任",
        paragraphs: [
          "企业现实描述业务现状、组织能力、资源和约束；经营与架构设计把目标转成能力、价值流、对象、规则和指标；数字化实现把这些设计落到产品、数据、技术和工程；运行反馈记录事实、计算指标并支持新的分析与决策。",
          "四个平面不是四个孤立模块，而是一条可以向下实现、再向上验证的闭环。缺少任何一个平面，局部正确都可能无法形成整体结果。",
        ],
      },
      {
        heading: "判断数字化工作的最小闭环",
        paragraphs: [
          "一个可验证的数字化问题至少需要说明：目标是什么，哪些对象被改变，规则如何执行，系统记录了什么事实，指标如何计算，结果怎样反馈到下一轮判断。",
          "这也是我整理企业经营体系认知框架、设计 Robotaxi 经营模拟以及复盘职业经历时共同使用的分析路径。",
        ],
      },
    ],
  },
  {
    id: "observation-robotaxi-boundary",
    slug: "robotaxi-simulation-boundary",
    title: "Robotaxi 作品首先要证明的，不是页面数量",
    summary:
      "一个经营模拟作品的可信度，来自对象、规则、事实和反馈是否形成闭环，也来自它是否诚实说明模拟与真实运营之间的边界。",
    format: "brief",
    featured: false,
    topics: ["Robotaxi", "经营模拟", "证据边界"],
    status: "published",
    publishedAt: "2026-07-24",
    updatedAt: "2026-07-25",
    relatedWorks: ["robotaxi"],
    sourceNotes: "基于 Robotaxi 项目定位、代码和运行结果形成的网站表达快照。",
    sections: [
      {
        heading: "作品证明什么",
        paragraphs: [
          "Robotaxi 经营闭环模拟平台用于验证我如何把经营问题转成业务架构、B 端产品、数据对象和可运行工程，并通过持续迭代检查这些层次是否一致。",
          "它可以证明认知迁移、产品设计、数据与系统实现以及 AI 协作能力，但不能证明真实城市运营、自动驾驶核心技术或真实企业经营结果。",
        ],
      },
    ],
  },
];

export const works = [
  {
    id: "robotaxi",
    slug: "robotaxi",
    index: "01",
    title: "Robotaxi 经营闭环模拟平台",
    eyebrow: "经营模拟 · 业务架构 · B 端产品 · 工程实现",
    summary: "把需求、供给、匹配、履约、收入、成本和经营反馈连接成可运行的模拟闭环。",
    problem:
      "如何不从页面清单出发，而是从经营目标、业务对象和事实关系出发，构建一个能够持续验证经营逻辑的 B 端系统。",
    boundary: "模拟作品，不代表真实城市运营、自动驾驶核心技术或真实企业经营结果。",
    status: "持续迭代",
    updatedAt: "2026-07-25",
    publicUrl: "https://robotaxi.xingbuild.top/",
    upstream: "Robotaxi 项目文档、代码与运行结果",
    flow: [
      { title: "需求与订单", detail: "需求预测、订单生成与服务承诺" },
      { title: "运力供给", detail: "车辆、人员、区域与可服务能力" },
      { title: "匹配与履约", detail: "供需匹配、任务执行与状态事实" },
      { title: "收入与成本", detail: "交易、结算、资源消耗与经营核算" },
      { title: "经营反馈", detail: "指标、异常、分析、决策与迭代" },
    ],
    sections: [
      {
        heading: "研究对象与系统边界",
        body: "作品聚焦 Robotaxi 企业如何组织需求、供给和履约，并把运行事实转成经营反馈。自动驾驶算法、车辆硬件和真实城市安全运营不在作品证明范围内。",
      },
      {
        heading: "业务、产品与数据架构",
        body: "经营对象具有独立生命周期、状态和事实记录；页面负责展示与触发，业务服务负责规则执行，指标从已经发生的事实计算，而不是从界面状态推断。",
      },
      {
        heading: "当前状态与证据",
        body: "项目已经形成可运行网站、版本化规则、服务与页面实现、自动检查和真实浏览器验证。每项能力仍需以项目当前文档、代码和运行结果为准。",
      },
    ],
  },
  {
    id: "enterprise-framework",
    slug: "enterprise-operating-framework",
    index: "02",
    title: "企业经营体系与数字化认知框架",
    eyebrow: "企业经营 · 业务架构 · 数字化 · 运行反馈",
    summary: "用统一概念和四个平面，连接企业现实、经营设计、数字化实现与运行反馈。",
    problem:
      "如何避免战略、业务、产品、数据和技术各自使用一套语言，并让复杂经营问题可以逐层理解、实现和验证。",
    boundary: "框架是持续演进的认知成果，不替代具体企业的行业数据、组织判断和经营责任。",
    status: "框架 v5.1",
    updatedAt: "2026-07-19",
    upstream: "career 项目认知框架 v5.1",
    planes: [
      { title: "企业现实", detail: "主体、资源、能力、业务现状与约束" },
      { title: "经营与架构设计", detail: "目标、价值流、对象、规则、流程与指标" },
      { title: "数字化实现", detail: "B 端产品、数据、技术与工程实现" },
      { title: "运行反馈", detail: "事实、指标、分析、决策与持续优化" },
    ],
    sections: [
      {
        heading: "构建逻辑",
        body: "框架自下而上建立：底层概念、企业现实概念、战略与架构概念、企业经营体系及四个平面、分析模型，最后进入供应链、Robotaxi 和职业应用。",
      },
      {
        heading: "学习路径",
        body: "使用时自上而下进入：先看企业经营体系总览，再进入四个平面、模块、概念、底层依赖和具体应用。同一概念只保留一处权威定义。",
      },
      {
        heading: "证据边界",
        body: "网站只组织框架的当前表达快照；正式定义、层级关系和版本以 career 项目当前基线为准。",
      },
    ],
  },
];

export const profile = {
  title: "关于我",
  positioning:
    "我是以供应链与企业运作为业务基础、以企业业务架构为核心专业、以 B 端产品研发为职业载体，推动复杂经营问题数字化落地的产品研发负责人。",
  introduction:
    "我长期工作在企业经营与数字化的交汇处，关注的不是系统数量，而是目标、对象、规则、产品、数据和运行结果是否真正连接起来。",
  problems: [
    "把模糊经营问题转成清晰的业务对象、规则、能力与价值流。",
    "连接业务、产品、数据和技术，使设计能够进入真实工程实现。",
    "建立事实、指标与反馈路径，让系统运行结果可以被持续验证。",
  ],
  capabilities: [
    { name: "企业业务架构", description: "从经营目标进入能力、价值流、对象、规则和指标设计。" },
    { name: "B 端产品研发", description: "把复杂业务结构投影为可理解、可执行、可演进的产品。" },
    { name: "数据与系统连接", description: "保持业务事实、数据口径、服务边界和页面表达一致。" },
    { name: "跨职能推进", description: "连接业务、产品、数据、技术和团队协作，推动方案落地。" },
  ],
  experience: {
    summary: "职业事实、项目责任和结果证据仍在按上游材料持续整理。",
    note: "公开表达将严格区分参与、主导、决策和最终责任，也区分规划、建设、上线、使用和实际结果。",
  },
  direction:
    "下一阶段希望进入能够长期积累行业理解的业务环境，承担连接经营问题、业务架构、B 端产品研发与团队交付的责任。",
  resume: {
    status: "整理中",
    note: "简历将在经历事实和公开证据完成核对后提供下载。",
  },
  contact: {
    location: "广州",
    note: "公开联系方式将在确认合适的长期入口后提供。",
  },
};

export const publishedObservations = observations
  .filter((item) => item.status === "published")
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function findObservation(slug) {
  return observations.find((item) => item.slug === slug);
}

export function findWork(slug) {
  return works.find((item) => item.slug === slug);
}
