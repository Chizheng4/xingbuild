# 当前迭代

## 当前唯一版本：`v0.24.20`

## 本版本目标

把已确认的 `content/registry/content-targets.json` 从内容 task 的定位契约，落成一个最小、确定性的 B 端 Robotaxi 内容定位能力：自然语言请求只能映射到已登记字段，生成可预览、可校验、可回滚的字段级 `ChangeSet`，并复用现有 Practice 独立内容发布链路。该能力建设属于产品工程版本；能力建成后的日常内容修改仍使用独立 `contentReleaseId`，不进入产品版本。

正式设计：`docs/design/声明式内容定位与快速内容发布方案.md`。

## 本版本范围

- 消费 `content/registry/content-targets.json`，实现 B 端 Robotaxi 已登记字段的唯一定位、当前值/hash、受影响路由和允许范围预览；
- 支持 `products.robotaxi.title`、`intro`、`boundary` 及已登记模块的 `label`、`shortDescription`、`loopRelation`、`action.href`；
- 生成被忽略 `.content-workspace/changes/` 中的结构化 `ChangeSet`，至少校验 `targetId`、`fieldPath`、`beforeHash`、`after`、`affectedRoutes`、`sourceRefs`、`boundary` 和 `authority`；
- 只允许字段级内容变更，拒绝未登记目标、整文件覆盖、数组顺序/文本猜测、`src/`、路由、IA、schema、组件、CSS、交互、上游事实和产品版本文件；
- 复用现有 `content:prepare`、`content:build`、Practice 内容校验和独立 transport；不新增第二套发布引擎；
- 增加目标解析、ChangeSet 范围、hash 冲突、独立内容 manifest 和既有 Practice 发布合同的专项测试；
- 将“能力建设”与“能力使用”的边界写入对应唯一规则正文，防止日后把工具能力误当成普通内容运营。

## 明确不做

- 不实现首页 `src/content/siteContent.js` 外部化；
- 不实现 Practice video、媒体合同扩展或新的媒体审核规则；
- 不扩展 Article/About/Observation 的字段级自动变更；注册表已有模板仅作为后续能力输入；
- 不修改 UI、IA、页面结构、schema、路由、组件、CSS、交互或上游事实；
- 不创建人工 CMS、账号/RBAC、实时数据库、任意源码编辑器或第二套 CLI；
- 不创建、删除、暂停或替代 task、branch、worktree、automation 或 scheduler；不改变既有产品发布脚本的 transport-only 边界。

## 验收合同

- 同一自然语言请求在已登记目标上只能得到一个明确 `targetId/fieldPath`；歧义、未登记或能力越界必须硬停止并报告；
- ChangeSet 只能修改允许字段，`beforeHash` 不匹配时拒绝，不能静默覆盖；
- 生成的独立内容包只包含目标内容对象和既有批准媒体边界，不修改产品 `current.md`、`VERSION.md`、commit/tag 或产品 manifest；
- 既有 `content:prepare`、`content:build`、Practice scope/check、独立 transport 和公网内容 manifest 合同不回归；
- `npm run check`、内容/Practice 专项、ChangeSet 专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；完整 Sites 测试若仍有 Mermaid/Puppeteer macOS I/O，只记录为既有环境阻断；
- Engineering 完成本地 commit/tag/clean 与 history 后，交产品/视觉验收；未验收、未授权前不 push/publish/deploy。

父版本：`v0.24.19` / `1d93c6f3124ce9fb53b9e61c577d6a6ffd208832`；既有 tag 不修改。
责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
