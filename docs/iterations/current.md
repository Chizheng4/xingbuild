# 当前迭代

## 当前目标版本

`v0.15.7`

## 要解决的问题

交付 Slug 级内容审核终端聚合能力，让已经完成人工事实审核和公开表达判断的单个 Observation 以一条显式命令完成既有 review + promote，同时保持内容生命周期事实可恢复、失败无半状态。

## 本轮范围

- 新增 `npm run content:approve -- --slug <slug> --authority <authority>`。
- 在共享 JS 能力层复用既有 review、promote、schema、来源、证据、hash、目标冲突与 production 唯一性校验，不以子进程串接 npm，也不复制判断规则。
- 成功只新增目标 review、recovery、production 并保留 draft；失败精确回滚本次新增文件，不覆盖既有目标事实。
- 更新命令入口、项目检查、中文规则、AGENTS 交付态和自动化测试。

## 明确不做

- 不选题、写稿、自动审核、自动提交或自动发布。
- 不改读者 UI、视觉、Footer、Observation 内容对象结构或公开内容。
- 不夹带其他 backlog；本轮产品独立验收前不 stage、commit、tag、push、部署或公网验收。

## 验收标准

- slug 与 authority 必填且非空；重复参数、多 slug、非法 slug 或未知参数硬失败。
- 目标已有 review、recovery、production、candidate/import 冲突，或 draft 的 schema、来源、证据不完整时硬失败。
- 正常目标一次产生匹配 hash 的 review、原 draft recovery 和 published production，draft 保持逐字不变。
- 任一步失败不覆盖已有 production/review/draft，不留下本次 review、recovery 或半成品 production。
- 无关 ignored candidate/import/draft/review/recovery 并存时不阻断且前后逐字不变。
- 内容专项测试、`npm run release:check` 与精确 diff 核对通过后，停在未提交、未暂存状态交产品独立验收。

## 当前状态

v0.15.7 Engineering 实现与兼容性修正已完成：内容专项 29/29、完整 `npm run release:check` 69/69、生产构建 14 条既有 published Observation、精确 diff 与未暂存状态均通过；`content:approve` 失败全回滚，独立 `content:promote` 在 production 写入失败时保留 recovery。等待产品独立验收；内容侧在正式验收前暂停使用 `content:approve`，仅继续候选审核。

## 明确 backlog

- 已发布 Observation 撤下或 canonical 替换；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
