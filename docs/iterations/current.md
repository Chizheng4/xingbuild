# 当前迭代

## 当前目标版本

`v0.14.2`

## 要解决的问题

`v0.14.1` 线上验收发现 Header 的全宽伪元素使用 `100vw` 与水平位移，在垂直滚动条存在时扩大文档滚动宽度，造成约 7–8px 横向溢出。

## 本轮范围

- 只修复 Header 全视口背景层的几何责任，使其不参与文档横向滚动范围；
- 保持 Header top/scrolled 两态、暖白透明背景、12px blur、轻影与 56px / 52px 几何不变；
- 不改标题、内容、信息架构、FrameworkModel 或视觉值。

## 验收标准

- Header 全宽层不得使用 `100vw` 或水平位移；
- 1440、1024、390 的滚动前后均满足 `scrollWidth === clientWidth`；
- `npm run release:check`、closeout/preflight 与公网最小回归通过。

## 当前状态

本地 Header 几何修复、自动检查与定点浏览器回归已通过；待本轮 stable commit、matching tag、preflight 与已授权生产发布闭环。完成后必须主动回传当前设计 task 做专业验收，不轮询等待。

## 明确 backlog

- 企业经营体系总览进入局部视图；
- legacy Article 与 ArticlePreview 闭环；
- 八条 Brief 人工扩充至80–160字；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
