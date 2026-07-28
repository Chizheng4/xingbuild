# 当前迭代

## 当前目标版本

`v0.14.0`

## 要解决的问题

v0.13.1 已建立信息架构和展示母版，但线上仍存在四个同源结构问题：

1. sticky Header 没有滚动态层级反馈；
2. 首页定位语仍与 Rail 共用第一行，未真正占据完整 shell；
3. 字号与语义标题层级仍有页面个性化和投影错级；
4. 手机 Stage 与解释、对象与对象之间的间距比例不清楚。

同时需要关闭首页经营观察手工拼装、公开治理说明和迭代记录漂移。

## 本轮范围

- `docs/design/v0.14.0 浮动导航、排版层级与移动归属收口方案.md` 是唯一执行合同；
- 实现 Header top/scrolled 两态、全站排版角色 token、首页完整定位行、同源 Presentation、手机对象归属；
- 删除读者不需要的 career/版本治理说明；
- 保留 v0.13 已验收的 IA、Showcase 几何、ObservationBlock、RichDocument、内容/展示/provenance 边界；
- 不改八条 Brief 事实正文，不补造 About、长文、局部框架或 controlled-system 内容。

## 验收标准

- 1440/390 Header 滚动态有轻影/半透明上层且高度不变；
- 首页 Rail 从定位语之后开始；
- 首页和来源页标题语义层级正确并消费同一 Presentation；
- 390/320 Stage→解释12–16px、对象→对象40–48px；
- Framework 选中解释仍只消费固定概念；
- 关键页面无溢出，console error/warning为0；
- `npm run release:check`、closeout/preflight 与公网1440/390/320验收通过。

## 当前状态

Engineering 已完成本地实现、自动检查与七档浏览器 QA，待本轮 stable commit、matching tag、preflight 和已授权生产发布闭环。完成后必须主动回传当前设计 task 做生产专业验收，不轮询等待。

## 明确 backlog

- 企业经营体系总览进入局部视图；
- legacy Article 与 ArticlePreview 闭环；
- 八条 Brief 人工扩充至80–160字；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
