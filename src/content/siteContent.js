export const site = {
  name: "xingbuild",
  author: "金星 Xingjin",
  description: "持续观察企业如何经营，并把判断构建成可以运行和验证的系统。",
  homeTitle: "我对企业如何经营、学习和演进充满好\u2060奇，也持续探索如何通过 B 端产品、数\u2060据\u2060与 AI，让复杂的经\u2060营\u2060问\u2060题变得更清楚、更可行动。",
  version: "v0.5.0",
  updatedAt: "2026-07-25",
  location: "广州",
  emptyStates: {
    observations: {
      title: "观察",
      message: "暂无已核验简讯",
      description: "当前没有符合信息流标准、可公开呈现的事件简讯。",
    },
  },
  home: {
    title: "首页",
    practicesTitle: "核心实践",
  },
};

export const works = [
  {
    id: "robotaxi",
    slug: "robotaxi",
    title: "Robotaxi 经营闭环模拟平台",
    eyebrow: "经营模拟 · 业务架构 · B 端产品 · 工程实现",
    summary: "把需求、供给、匹配、履约、收入、成本和经营反馈连接成可运行的模拟闭环。",
    problemSummary: "从经营目标、业务对象和事实关系出发，持续验证 Robotaxi 经营逻辑。",
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
    title: "企业经营体系与数字化认知框架",
    eyebrow: "企业经营 · 业务架构 · 数字化 · 运行反馈",
    summary: "用统一概念和四个平面，连接企业现实、经营设计、数字化实现与运行反馈。",
    problemSummary: "让战略、业务、产品、数据和技术使用同一套可实现、可验证的语言。",
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

export function findWork(slug) {
  return works.find((item) => item.slug === slug);
}
