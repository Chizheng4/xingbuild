# 当前迭代

## 当前目标版本

`v0.15.3`

## 要解决的问题

收口 ObservationRail 的主内容从属预算，消除 Grid stretch 与强制至少一项造成的右栏反向撑高和视觉密度失真。

## 本轮范围

- 仅限 TwoColumnLayout 对齐、ObservationRail 测量/紧凑投影、零模块 Product rail 条件、跨 task 最小治理规则、对应测试与 v0.15.3 记录。
- 不改 Header、首页定位语、Showcase 208/20/724、全站 952/24/304、FrameworkModel/视图、集中观察、Article、About 内容、Robotaxi 媒体状态或其他 backlog。

## 验收标准

- Rail 预算只依赖主栏 intrinsic content height 且受最多约两个视口限制；预算包含 rail gap 与“更多观察”，允许零条。
- `/products` 在 Practice modules=0 时无 rail；首页与经营观察 rail 只渲染完整 Brief，集中观察不变。
- `npm run release:check`、diff、桌面/移动本地 QA、closeout/preflight 通过；本轮不 push 或发布。

## 当前状态

产品与视觉首轮验收发现隐藏测量层扩大页面 overflow bounds，且 React 未正确输出 inert；Engineering 已按原范围修复。`npm run release:check` 与首页/经营观察/Products 桌面和手机串行本地复验已通过，产品与视觉独立复验通过，进入本地收口。本轮不 push、发布或执行公网 QA。

## 明确 backlog

- 企业现实与经营设计的后续局部视图；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
