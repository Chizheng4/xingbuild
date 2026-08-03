# 当前迭代

## 当前唯一版本：`v0.24.24`

## 本版本目标

完成 v0.24.23 验收发现的根合同缺口：让 immutable `baseSiteArtifact` 成为实际可构建的只读产品源快照，把日常内容对象/媒体/发布账本移到独立 content root，并把按 asset ID 枚举的注册表改为稳定能力模式。能力完成后，内容 task 只通过独立内容文档、`contentReleaseId` 和日志管理日常内容，不读取当前产品 sourceRoot、HEAD/tag、`current.md` 或产品 preflight。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.24 内容源与不可变产品基座解耦方案.md`。
- 父版本：`v0.24.23` / `0bbff29fc7fe10e3d617eb76115b7ae0c5aa4b09`；既有 tag/history 不修改。

## 本版本范围

- `baseSiteArtifact` 携带并校验实际 source bundle/hash；内容 staging 只能从选定基座构建，禁止复制当前 canonical sourceRoot。
- 日常 Observation、Article、Practice、B 端内容和媒体对象使用独立 content root、内容文档、release ledger、manifest/log；产品 Git 只保留能力合同和产品基座。
- 注册表改为稳定字段模式/模板；新增内容 asset 不需要修改产品 registry 值、commit/tag 或产品版本。
- 独立 ChangeSet/recovery 支持新增 image/video、模块绑定和清空 `mediaId`，继续保留 hash、审核、来源和事实边界硬门禁。
- 增加产品主线并行、基座漂移、sourceRoot 污染、新增媒体、空模块、失败恢复和产品 Git clean 专项测试。

## 明确不做

- 不重做页面 IA、路由、页面组合、组件布局或视觉系统；不修改上游 Robotaxi 事实。
- 不增加人工 CMS、RBAC、第二套产品版本、第二个 scheduler 或并行 branch/worktree/task。
- 不把内容文档、内容 manifest/log 或内容文件重新写入产品版本历史。
- 不由内容 task 修改 `src/`、产品 schema、组件或 Engineering 工具；能力缺口必须通过产品版本流程进入本版本。
- 不在能力验收前发布当前 MP4；不放宽 hash、审批、来源、固定发布目标或公网验证门禁。

## 产品/内容责任边界

```text
产品/Engineering：页面能力、媒体合同、能力模式、校验器、baseSiteArtifact 与发布工具
内容 task：独立 content root、内容文档、正文/媒体选择、来源、确认、contentRelease 与公网内容验收
Ops：来源覆盖、证据候选和运行记录
产品候选：只有页面能力、媒体合同、工具或 transport 缺口进入
```

## 验收合同

- 产品主线存在未提交修改或正在形成新产品版本时，指定稳定基座仍能独立生成已审核内容包；构建不读取当前 sourceRoot。
- 新增 image/video、模块绑定和清空 `mediaId` 均不修改产品 registry 值、产品版本或 Git；未提供媒体的模块保持为空。
- source bundle/hash、能力模式、type/MIME、路径、媒体 hash、来源、审批、绑定或 recovery baseline 错误必须硬失败。
- 内容文档、content manifest/log 和 recovery 能回答计划/已完成/未完成/线上状态；build、deploy、public verify 任一失败不污染产品版本事实。
- `npm run check`、`release:prepare`、内容/媒体/ChangeSet/recovery 专项、closeout、preflight、`git diff --check` 通过；已有环境 I/O 只能作为明确阻断记录。
- Engineering 完成本地 commit/tag/clean 与 history 后，交产品/视觉验收；能力通过并经用户授权发布产品能力后，内容 task 才恢复独立日常运营。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
