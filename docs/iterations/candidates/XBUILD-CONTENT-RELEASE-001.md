# XBUILD-CONTENT-RELEASE-001：内容发布隔离生命周期闭环

## 状态

- `status: pending`
- `executionAuthorization: pending`
- 产品评审：`pending`（路由：`current-fix`）
- 评审结论：问题事实成立，属于既有内容发布能力的闭环缺口；本轮按用户要求暂不进入 Engineering，待明确启动修复版本后再改为 `confirmed`。
- 评审责任：产品与视觉 task
- 候选类型：发布能力 / 内容运营基础设施
- 来源问题：`OPS-CONTENT-006`
- 责任 task：产品与视觉 task 评审公开能力边界；Engineering task 仅在候选确认后评估实现

## 事实与证据

2026-08-02 的真实单 slug 发布中，`./publish-content.command --slug <slug>` 能够：

1. 从最新 `origin/main` 创建干净隔离 worktree；
2. 重建内容提交并通过 `content:check`、`content:scope-check`、`build`、`test:sites`；
3. push、EdgeOne 部署及公网页面/manifest 验收。

但审核生命周期文件位于调用方的 ignored 内容工作区，隔离 worktree 未自动携带目标 slug 的 `draft/review/recovery`。因此真实运行出现：

- 检查阶段：`Draft not found: <slug>`；
- 使用同一隔离内容根目录完成检查后，公网验收阶段：`Cannot finalize <slug>: draft file is missing`。

真实发布证据：

- Engineering 能力基线：`c49fab4031a4d166f472e9a6cb60f40291fcb7c`；
- 9 条内容实际发布提交：`c7f0f3e`、`3702940`、`5a25720`、`597eded`、`6bb09d0`、`6224d3a`、`a4d09e3`、`c52d20d`、`627ede3`；
- 历史运营证据：`docs/operations/history/内容运营与发布问题清单.md` / `OPS-CONTENT-006`。

## 目标

让固定单 slug 发布命令在干净隔离 worktree、主线前进、部署传播延迟等正常场景下，自动完成：

`approve → 检查 → 独立提交 → push → build/test → EdgeOne → 公网验收 → 目标生命周期精确 finalize`

并保持审核 hash、失败可恢复、无关 workspace 不受影响。

## 影响范围

- 可能影响：内容发布命令、内容 release worktree、审核生命周期的传递与 finalize 路径、相关集成测试。
- 不改变：产品版本/tag、UI、公开 Observation 字段、页面结构、视觉、Ops EvidenceCandidate 合同和日常内容事实审核。

## 非目标与边界

- 不进入当前产品版本，不直接修改 `src/`、`VERSION`、`current.md` 或公开内容对象。
- 不把 EvidenceCandidate 直接交给发布命令。
- 不放宽 slug、scope、hash、origin/main、build、Sites 或公网验收门禁。
- 不因该候选暂停既有 Observation/Article/Practice 日常运营；候选确认前不实施能力改动。

## 建议评审要点

产品与视觉 task 只需确认这是否属于既有网站发布能力的必要闭环，以及是否保持读者界面和产品版本边界不变。若确认，再由 Engineering 形成最小实现与真实 worktree 集成测试合同；若不确认，保留当前受控临时操作并关闭候选。

## 下一动作

产品与视觉 task 已完成问题评审；在用户明确启动修复版本前保持 `executionAuthorization: pending`，不编码、不创建产品版本、不 push/deploy，也不改变日常内容发布对象。
