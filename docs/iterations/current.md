# 当前迭代

## 当前目标版本

`v0.15.2`

## 要解决的问题

收口 Robotaxi 媒体生命周期与公开 projection，执行上游已撤回媒体的真实隐藏，同时让未来媒体状态同步可走 content-only。

## 本轮范围

- 仅限 Robotaxi 媒体 manifest 生命周期、Practice 公开读取层、内容发布范围、对应测试与 v0.15.2 版本记录。
- 不改 IA、Showcase anatomy、视觉 token、Header、Framework、Observation、About 或 Robotaxi 模块文字。

## 验收标准

- 仅完整 active + approved + public 媒体可公开投影；suspended、superseded、paused、pending_review、revoked、internal、hash mismatch 均不得投影。
- 首页与 `/products` 在四项撤回后无模块、无空框、无横向溢出；`npm run release:check`、closeout/preflight、生产发布与公网复验通过。

## 当前状态

已授权直接完成最小维护补丁、版本化和生产发布。

## 明确 backlog

- 企业现实与经营设计的后续局部视图；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
