# 当前迭代

## 当前唯一版本：`v0.24.23`

## 本版本目标

把产品能力与内容运营彻底分成两个责任平面：一次性建设通用的 image/video 媒体合同、空媒体模块语义、媒体 ChangeSet/recovery 和 immutable `baseSiteArtifact` 内容发布基座；能力完成后，内容 task 只通过独立内容文档、`contentReleaseId` 和发布日志管理日常内容，不读取当前产品 HEAD/tag、`current.md` 或产品 preflight，不进入产品版本闭环。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.23 统一媒体独立运营能力与内容发布架构方案.md`。
- 父版本：`v0.24.22` / `97d095ca5d9c5e6a6cbe92940b188af58f298c80`；既有 tag/history 不修改。

## 本版本范围

- 统一 `MediaAsset` 的 `image|video` 合同，移除 Practice `type=image` 与固定 `16:10` 限制，校验类型、路径、hash、审核、公开状态、来源和 provenance；视频不建立一次性 MP4 旁路。
- 允许模块没有 `mediaId`：无媒体模块不渲染媒体区域、不生成占位内容；已有 `ShowcaseLayout → PracticePage → SystemStage` 继续复用。
- 扩展 registry 与 ChangeSet，支持已登记媒体对象、模块媒体绑定、before/after/hash、来源边界和逆向 recovery；禁止整文件覆盖、未登记媒体和伪造审批。
- 引入明确 immutable `baseSiteArtifact` 内容构建输入，内容发布不依赖当前产品 HEAD/tag、`current.md`、`release:preflight` 或产品版本推进；基座只作部署来源证明，不替代产品 publish 身份。
- 内容 release package 独立记录 `contentReleaseId`、contentHash、sourceRefs、baseSiteArtifactId、deploymentId、publicVerify 和 recovery 证据；不修改产品版本文件、commit/tag、history 或产品发布状态。
- 更新 `docs/operations/内容运营与发布规则.md`、`docs/rules/iteration-and-release.md`、`docs/rules/engineering-architecture-and-principles.md` 中与本能力直接相关的独立运营、基座输入、工具边界和日志事实；不复制正文、不改无关规则。
- 增加正向/反向专项：产品迭代并行发布 MP4、image/video、空模块、媒体状态/hash/provenance、基座身份、ChangeSet、recovery、失败保留和产品版本不污染。

## 明确不做

- 不重做页面 IA、路由、页面组合、组件布局或视觉系统；不修改上游 Robotaxi 事实。
- 不为本次 MP4 建立特例，不增加人工 CMS、RBAC、第二套产品版本或第二个 scheduler。
- 不把内容文档、内容发布日志或内容状态写入产品 Git、`current.md`、产品 history 或产品 tag。
- 不由内容 task 修改 `src/`、产品 schema、组件或 Engineering 工具；能力缺口必须通过产品候选进入本版本。
- 不创建 branch、worktree、并行 task、automation 或 scheduler；不在能力验收前发布当前 MP4。

## 产品/内容责任边界

```text
产品/Engineering：页面能力、媒体合同、校验器、ChangeSet 消费、baseSiteArtifact 与发布工具
内容 task：内容文档、正文/媒体选择、来源、确认、独立 contentRelease 与公网内容验收
Ops：来源覆盖、证据候选和运行记录
产品候选：只有页面能力、媒体合同、工具或 transport 缺口进入
```

## 验收合同

- 产品主线存在未提交修改或正在形成新产品版本时，仍可用明确稳定 `baseSiteArtifactId` 独立发布已审核 MP4；不读取当前 HEAD/tag 作为内容门禁。
- image 与 video 均通过统一媒体合同、hash、审批、provenance、独立 build、transport 和公网 verify；未提供媒体的模块保持为空。
- 未登记 target、非法 type/MIME、路径越界、hash 不匹配、来源缺失、审批/公开状态错误、媒体绑定缺失、基座错误或基座漂移必须硬失败。
- 正向发布可由原始 before/after 生成 recovery；build、deploy、public verify 任一失败只保留内容 recovery 与工具日志，不污染产品版本事实。
- `npm run check`、`release:prepare`、内容/媒体/ChangeSet/recovery 专项、closeout、preflight、`git diff --check` 通过；已有环境 I/O 只能作为明确阻断记录。
- Engineering 完成本地 commit/tag/clean 与 history 后，交产品/视觉验收能力；能力通过并经用户授权发布产品能力后，内容 task 才恢复本轮 MP4 独立发布。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
