export const siteMeta = {
  name: "xingbuild",
  version: "v0.1",
  updatedAt: "2026-07-24",
  location: "广州",
};

export const hero = {
  title: "把复杂经营问题，构建成可理解、可执行、可验证的系统。",
  mobileTitle: "从真实问题出发，构建可以运行、验证和持续演进的系统。",
  disciplines: ["供应链与企业运作", "企业业务架构", "B 端产品研发"],
};

export const works = [
  {
    id: "robotaxi",
    index: "01",
    title: "Robotaxi 经营闭环模拟平台",
    summary: "从经营模型、业务架构到数据与可运行软件",
    description:
      "围绕需求、供给、匹配、履约、收入、成本与反馈，构建可运行、可观察、可持续迭代的经营闭环模拟。",
    boundary: "模拟作品，不代表真实城市运营或自动驾驶技术。",
    linkLabel: "进入作品",
    flow: [
      { title: "需求与订单", detail: "出行需求预测、订单生成与分配" },
      { title: "运力供给", detail: "车辆与司机管理、运力调度" },
      { title: "匹配与履约", detail: "订单匹配、路径规划与状态跟踪" },
      { title: "收入与成本", detail: "收入计算、结算与成本核算" },
      { title: "经营反馈", detail: "经营指标、策略评估与迭代" },
    ],
  },
  {
    id: "enterprise-framework",
    index: "02",
    title: "企业经营体系与数字化认知框架",
    summary: "连接企业现实、经营与架构设计、数字化实现与运行反馈",
    description:
      "以统一概念、关系与分析路径理解企业如何经营、运作和数字化，并把方法持续应用到供应链、Robotaxi 与职业实践。",
    linkLabel: "进入框架",
    planes: [
      { title: "企业现实", detail: "业务现状、组织能力、资源与约束" },
      { title: "经营与架构设计", detail: "目标、规则、业务架构、流程与指标" },
      { title: "数字化实现", detail: "B 端产品、数据、技术与工程实现" },
      { title: "运行反馈", detail: "事实、指标、分析、决策与持续优化" },
    ],
  },
];

export const about = {
  title: "关于我",
  lead:
    "长期工作在企业经营与数字化的交汇处，连接业务、产品、数据、技术与落地的各个环节。",
  body:
    "我以供应链与企业运作为业务基础，以企业业务架构为核心专业，以 B 端产品研发为职业载体，陪伴团队把复杂问题逐步变清晰、落到系统、持续验证。",
  links: [
    { label: "查看经历", href: "#experience" },
    { label: "下载简历", href: "#resume" },
    { label: "联系方式", href: "#contact" },
  ],
};
