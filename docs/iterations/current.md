# 当前迭代

## 当前唯一版本：`v0.24.16`

状态：Engineering 已完成 v0.24.16 内容独立发布治理实现、自 QA 与本地提交版本收口；产品与视觉验收待确认，未 push、publish、部署或公网验收，官方目录继续 direct-local。
localSubmission: complete
父版本：`v0.24.15` / `cf9fb87ca7ed2f20373aad5a410c6302f3aae5a7`；该 tag 不修改。
责任 task：产品与视觉主线负责方案、基线边界和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

彻底统一内容运营与产品工程版本边界，并为 B 端产品页面内容协作提供唯一可继承的运营规则和研究入口。

## 本版本范围

- 新增 `docs/operations/内容运营与发布规则.md`，集中定义内容运营责任、生命周期、B 端内容合同、xAI CLI 研究边界和独立内容身份。
- 修正 `AGENTS.md`、`docs/README.md`、`docs/rules/iteration-and-release.md` 与产品总案中的内容/产品版本冲突。
- 保留现有网站页面结构和能力；本版本不重做 B 端页面、不引入外部内容数据层。
- 将内容独立发布能力的工程实现列入本版本 Engineering 范围；能力完成前，内容 task 只能确认、校验和本地预览，不得绕过门禁上线。
- 内容发布采用 `content:prepare` → `content:build` → 独立 transport → finalize；发布包位于 ignored `.content-workspace/releases/`，canonical main 不写 tracked 内容。
- 提供给内容发布 task：当前 `/products` 能力边界、Robotaxi 内容对象字段、xAI CLI 研究模式和本轮 B 端内容确定流程。

## 非目标

- 不修改 `ShowcaseLayout`、`PracticePage`、`SystemStage`、路由、schema、CSS 或业务逻辑。
- 不创建产品以外的 branch/worktree/task。
- 不修改 v0.24.15 或更早版本的 tag/history。
- 不在本版本内实施 `contentKv` 或其他外部内容数据层；待 B 端内容模型和展示验收后另行评估。

## 验收合同

- 规则、Agent、README、产品总案和新运营规则对“内容独立、产品能力归产品版本”表述一致。
- Engineering 完成本版本规定的内容独立发布能力后，内容 publish 不创建/递增产品版本，不修改 `current.md`、`VERSION.md`、产品 history 或产品 tag。
- 内容包 manifest 记录 `contentReleaseId`、目标、内容 hash、来源、审核/发布时间、deployment/public verify 与 base product provenance；base 字段不构成产品门禁。
- 内容 task 可只读取产品总案、新运营规则、当前版本和 B 端内容 Brief 开始工作。
- 本地 URL：`http://127.0.0.1:4317/`；线上 URL：`https://xingbuild.top/`。
- 当前线上仍为 v0.24.13；本版本未 push/publish/deploy。
- 活动候选仍只保留未确认 DRAFT/pending；本版本不新增普通候选。
- 下一动作：完成 v0.24.16 本地 commit/tag 后，交产品/视觉验收；验收通过且用户明确要求后，产品与内容分别按各自发布合同上线。
