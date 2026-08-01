# 原型实施说明

自行启动本地服务，并使用当前环境可用的浏览器打开预览；能够自行启动时，不把启动服务的操作转交给用户。

进行重大视觉修改前，如果视觉事实源不明确或已不符合当前目标，先使用 Product Design 插件的 `get-context` skill。用户确认的长期视觉偏好先进入产品/视觉主文档，再进入 Engineering 版本。

应用界面在 `src/` 中实现。保持 `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs` 和 `tests/sites-worker.test.mjs` 完整；交付 Sites 前运行 `npm run build` 和 `npm run test:sites`。

跨项目共同的质量、能力化、产品—Engineering—运营分工和低使用量原则，遵循 career 项目的《跨项目产品工程运营质量与效率总合同 v1.0.md》；本项目的产品、代码、内容、版本和发布细节仍以本项目事实源与规则为准。

## xingbuild 事实源入口

- 产品目标、信息架构、页面责任、内容对象、视觉、响应式和能力合同：[`docs/product/xingbuild 网站产品架构与视觉系统总案.md`](docs/product/xingbuild%20网站产品架构与视觉系统总案.md)。这是唯一产品/视觉主文档。
- 版本先后、候选范围和进入条件：[`docs/iterations/roadmap.md`](docs/iterations/roadmap.md)。它不是当前授权。
- 当前唯一实施版本：[`docs/iterations/current.md`](docs/iterations/current.md)。无版本时不得自行开始产品实现。
- 版本、task、问题、内容发布、Git、部署和浏览器资源规则：[`docs/rules/iteration-and-release.md`](docs/rules/iteration-and-release.md)。这是本项目通用工作流唯一来源。
- 已完成版本和公网结果：`docs/iterations/history/`；内容运营合同：`docs/operations/`；career/Robotaxi 上游事实：`docs/upstream/`及各自项目的权威源。
- `docs/design/` 只保留历史方案、DRAFT 或明确交接附件；不能直接覆盖主文档和规则。

## 责任边界速查

- Ops 只采集、去重和核验可信证据候选，不写公开正文、不决定发布。
- 内容与发布 task 负责事实审核、Brief/Article 结构、可读性和单条内容发布，不改产品/视觉合同。
- 产品与视觉 task 负责网站目标、页面组合、内容对象、视觉、响应式和验收；不参与日常选题和逐条写稿。
- Engineering 只实现已确认并进入 `current.md` 的能力合同，不复制或改写上游事实，发现相邻需求先登记。
- 每项修改只有一个执行 owner；其他 task 只提供事实、验收或授权，不双写文件、版本或发布动作。

## 工作流门禁速查

- 产品版本严格一个接一个：当前版本未完成实现、验证、专业验收、提交/tag、push、部署和公网验收，不开启下一版本。
- 并行设计只能形成明确标记为 `DRAFT` 的文档；DRAFT 不进入主线版本提交/tag；不得修改 `current.md`、VERSION、代码、依赖或发布规则。
- 跨 task 使用事件驱动交接，不使用持续 `wait`、空轮询或长历史；完整方案留在文档，消息只传文档路径、版本/commit、证据、阻断 ID 和下一动作。
- 当前版本中发现的新优化先登记在 `docs/iterations/current.md` 的“在途变更登记”，由产品 task 分类为当前采纳、后续候选、内容/运营或拒绝；不得直接改代码或混入当前范围。
- 实现、验证、commit/tag、push、deploy、公网验收分别报告；未获当前 task 明确授权不得发布或触发远端部署。
- 修改产品内容、结构、视觉、部署行为或域名配置前，先阅读 `docs/rules/iteration-and-release.md` 和对应事实源。
- 稳定迭代必须运行 `npm run release:check`；浏览器验证串行且结束即释放服务、headless worker 和临时 profile。

## 规则语言

规则和解释以中文为主；命令、文件名、字段、枚举、API、skill 和必要技术名称保留英文。英文技术词第一次出现时尽量提供紧邻中文含义，不复制整段双语规则。
