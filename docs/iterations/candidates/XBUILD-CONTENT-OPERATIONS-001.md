# XBUILD-CONTENT-OPERATIONS-001：声明式内容定位与独立 CLI 发布能力

## 用户含义与目标（必须先被产品与视觉 task 理解）

用户不需要一个供人类登录、配置和维护的完整 CMS 后台。用户需要的是：当他说“更新首页大标题”“替换 B 端产品某个模块说明”或“重新发布经营观察某一篇内容”时，内容 task 能理解自然语言意图，准确定位网站中对应的页面、模块或字段，生成可核对的变更，并通过固定、标准化、低成本的 CLI 直接完成独立内容发布。

目标是让内容迭代可以随时、快速、高质量地发生：支持整页内容批次、单个模块和单个字段；不需要人工在后台逐项操作；不允许 AI 任意改代码或猜测目标；内容更新不修改产品页面结构、IA、组件、交互、视觉或产品版本/tag。AI 负责理解与定位，注册表和 CLI 负责确定性校验、发布、审计和回滚。

## 状态

- `status: pending`
- `executionAuthorization: pending`
- 候选类型：内容运营能力 / 声明式内容控制层 / 独立发布
- 责任 task：产品与视觉 task 评审公开能力边界；Engineering 仅在产品确认并写入正式方案后实现；内容 task 负责内容对象、变更清单、事实审核和日常发布
- 当前产品版本：`v0.24.19`；本候选不修改当前版本、`current.md`、`VERSION.md`、UI、产品 tag 或线上产品发布

## 现状与真实触发证据

当前内容可以按既有对象独立运营，但定位能力仍主要依赖人工记忆具体文件和对象字段，不能稳定支持“任意页面位置”的自然语言变更。

本轮 Robotaxi 展示媒体还暴露出两个应纳入能力验收的事实：

1. `src/components/showcase/SystemStage.jsx` 已能渲染 video，但 `scripts/lib/practice-content.mjs` 的 Practice 媒体校验仍只接受 `image`；因此短版 MP4 无法进入 approved/public。
2. `publish-practice.command --id robotaxi` 已实际复现参数解析失败；标准 Practice 发布入口与底层 `scripts/content-release.mjs` 的目标参数不一致。

相关事实：

- 当前 B 端对象：`content/products/robotaxi.json`；媒体合同：`content/media/robotaxi/manifest.json`；
- 当前媒体短版仍只在 `.content-workspace/drafts/` 为 `draft/internal`；
- 当前独立内容发布规则：`docs/operations/内容运营与发布规则.md`；
- 当前产品/工程规则：`docs/rules/00-baseline-index.md`、`docs/rules/responsibility-and-workflows.md`。

## 核心问题

~~~text
自然语言请求
  → 缺少稳定的内容目标定位
  → 需要人工猜文件/字段
  → 容易误改共享投影、漏校验或混入产品工程
  → 无法形成低成本、可审计、可回滚的快速内容发布
~~~

这不是要把网站改造成运营后台，而是为现有内容对象增加一个内部、声明式、无 UI 的控制面。

## 单一推荐方案：Content Target Registry + ChangeSet + Content Release CLI

### 1. 内容目标注册表

建立机器可读的内容目标注册表（推荐数据位于 `content/registry/`，职责说明位于 `docs/content/`；实际文件名由产品与 Engineering 在正式方案中确定），只记录定位和约束，不复制正文。

每个目标至少记录：

- `pageId`：`home`、`products.robotaxi`、`observations.article`、`observations.brief`、`about`；
- `targetId`：稳定的页面、模块或字段 ID，例如 `home.hero.title`；
- 真实 `sourcePath` 与 `fieldPath`；
- `projectionRoutes`：实际会受影响的页面 URL；
- `contentType`、长度/格式规则、是否允许更新；
- 事实、来源、媒体和公开边界；
- 共享投影提示：一个源字段被多个页面使用时必须显式显示影响范围。

注册表不允许把 DOM selector、临时文本或内部实现 id 当成唯一事实；目标 ID 必须在页面重排后仍稳定。

### 2. 三种变更范围

- `page`：一个页面的多个已登记内容位组成一个明确变更批次，不是覆盖整份源文件；
- `module`：一个产品模块、文章章节或关于我区块；
- `field`：标题、简介、段落、CTA、链接、已批准媒体等单一字段。

“任意位置”只代表“任意已登记且允许编辑的位置”。未登记、无法唯一定位或会改变页面结构的位置必须停止并转产品候选。

### 3. AI 生成 ChangeSet，CLI 执行确定性操作

AI 不直接改源代码。它将用户请求转换为忽略目录中的结构化 `ChangeSet`，至少包括：

~~~text
changeId / scope / targetId / fieldPath
beforeHash / before / after
affectedRoutes / sourceRefs / boundary
authority / baseProductVersion / rollbackReleaseId
~~~

CLI 必须先输出“定位结果、当前值、变更后值、受影响页面、事实边界和文件范围”，再允许发布。目标不唯一、语义含糊或影响扩大时停止，不猜测。

### 4. 目标 CLI 合同（候选设计，不代表当前已有命令）

~~~bash
npm run content:plan -- --request <request-file>
npm run content:preview -- --change <change-id>
npm run content:approve -- --change <change-id> --authority <authority>
npm run content:publish -- --change <change-id>
npm run content:rollback -- --release <release-id>
~~~

命令应复用现有 Observation/Article/Practice 的校验和独立 release 能力，而不是再建一套发布系统。现有 slug 命令继续兼容；新入口统一承接 page/module/field 目标。

### 5. 发布、审计与回滚

每个变更形成独立内容身份：

~~~text
changeId → contentReleaseId → contentHash
→ baseProductVersion/baseProductCommit
→ deploymentId → public URL/manifest 验收
~~~

必须保留 before/after、审核责任、来源、受影响路由、发布结果和上一版 release；回滚只恢复内容 release，不修改产品版本或代码。

### 6. 内容质量与安全门禁

- 目标必须来自注册表且唯一；
- schema、类型、长度、链接、slug、媒体 hash 和来源完整；
- 事实边界、公开声明和上游来源通过内容审核；
- 只允许内容对象、批准媒体和内容 release 文件；
- 任何 `src/`、IA、路由、组件、CSS、schema、交互或业务逻辑变化立即停止；
- 产品版本/tag、`current.md`、`VERSION.md` 不得进入内容提交；
- 生成构建、内容 manifest、目标 URL 和公网验收必须一致；
- 同一目标支持精确回滚，不允许删除历史或无范围覆盖。

## B 端 Practice 兼容性要求

为兑现 Robotaxi“快速展示型视频”内容运营，正式能力至少需要产品与 Engineering 评审：

1. Practice 媒体合同安全地支持 `video`（保留 src、hash、provenance、事实边界和 approved/public 门禁），并与现有 `SystemStage` 一致；
2. 修正 `publish-practice.command --id <practiceId>` 与底层目标参数的契约；
3. 视频仍按内容媒体审核，不把 public demo 模拟数据表述为真实运营；
4. 不因视频能力改变页面 IA、模块结构或产品版本边界。

## 第一阶段最小范围

只实现以下高价值范围：

- 首页、B 端产品、经营观察长文/短文、关于我五类内容目标；
- page/module/field 三种变更范围；
- 标题、简介、模块说明、CTA、链接和批准媒体；
- AI ChangeSet、定位预览、校验、独立发布、回滚和公网验收；
- 保留现有内容对象，不制作人工后台、账号/RBAC、实时数据库或任意源代码编辑器。

## 明确非目标

- 不把内容控制层做成完整 CMS；
- 不让 AI 直接编辑 `src/`、CSS、组件、schema 或业务服务；
- 不把内容发布并入产品 `v0.x`；
- 不把未登记的页面新结构、交互或功能包装成内容更新；
- 不绕过事实审核、媒体审批、scope、hash、build、部署和公网验收。

## 验收合同

产品与视觉、Engineering 和内容 task 至少用以下场景验收：

1. “更新首页大标题”能唯一定位、预览差异并独立发布；
2. “更新 B 端某模块说明”只改对应模块，不影响其他模块；
3. 一个页面批次可列出所有变更位和受影响路由；
4. 未登记字段、同名歧义、事实来源缺失、代码路径混入、未批准 MP4 均失败；
5. 内容发布不递增产品版本，不修改产品 UI/IA/current/VERSION/tag；
6. 既有 Observation/Article/Practice 发布合同不回归；
7. 发布后可用 release ID 精确回滚并完成公网验证；
8. CLI 可在干净内容环境中重复执行，失败保留 draft/review/recovery 和证据。

## 产品与视觉评审问题

1. 是否确认“注册目标 + AI ChangeSet + CLI release”是唯一推荐的内容运营能力方向？
2. 是否确认五类页面均可纳入同一目标注册表，但实际内容仍由各自对象合同维护？
3. 是否确认 Practice video 支持和 `publish-practice` 参数修正作为本候选的兼容性验收项？
4. 哪些页面/字段首批列为可编辑白名单，哪些必须保持产品版本流程？

## 下一动作

本候选保持 `pending`、`executionAuthorization=pending`。等待产品与视觉 task 评审范围、目标注册表位置、首批白名单和 Practice 兼容性边界；未经确认不编码、不改 `current.md`、不改产品版本/tag、不发布媒体。
