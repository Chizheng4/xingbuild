# 当前迭代

## 当前目标版本

`v0.15.1`

## 要解决的问题

修复总览下钻节点与画布平移之间的 pointer 责任冲突，确保真实鼠标 click 与键盘进入具有相同结果。

## 本轮范围

- 仅限 FrameworkExplorer 的 pointer session 边界、对应测试与 v0.15.1 版本记录。
- 不改 frameworkModel、几何、构图、URL、观察、Robotaxi、About 或导航。

## 验收标准

- 390/320/1440 的真实 mouse click、Playwright click、Enter、Space 均进入局部；背景 pan、普通节点选择、reset、返回焦点无回退。
- `npm run release:check`、closeout/preflight、生产发布与公网复验通过。

## 当前状态

已授权直接完成最小修订、版本化和生产发布。

## 明确 backlog

- 企业现实与经营设计的后续局部视图；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
