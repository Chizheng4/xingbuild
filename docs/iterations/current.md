# 当前迭代

## 当前目标版本

`v0.18.0`

## 主题

企业经营体系多层架构浏览器重构

## 事实源

- `docs/design/v0.18.0 企业经营体系多层架构浏览器重构方案.md`
- `docs/design/assets/v0.18.0-architecture-explorer-desktop-selected.png`
- `docs/design/assets/v0.18.0-architecture-explorer-desktop-hover.png`
- `docs/design/assets/v0.18.0-architecture-explorer-mobile-selected.png`
- `docs/design/xingbuild Visual System v1.md`
- career 同步的企业经营概念与批准网站快照
- `docs/rules/iteration-and-release.md`

## 目标

- 将 `digital-implementation` 从 React Flow 平面节点图重构为 LikeC4 风格的
  多层架构浏览器；
- 使用业务设计层、工程实现层、经营运行与反馈层表达现有 9 节点和 13 关系；
- 关系线、箭头和标签默认可见，反馈闭环可以连续追踪；
- 建立真实 Hover 预览、Click 锁定、键盘和手机 tap 状态；
- 桌面、手机和文本降级只读取一个架构模型；
- 把关系线不得与网站组件边缘共线写成几何和视觉硬门槛。

## 明确不做

- 不修改网站一级信息架构、ShowcaseLayout、Header、Observation rail、
  ReturnNavigation、内容对象或发布能力；
- 不修改或补造企业经营概念、节点、关系、方向、定义和作用；
- 不增加第二公开局部入口、节点 URL、详情页或二次下钻；
- 不夹带 Robotaxi、Observation、Article、About、Footer 或其他 backlog；
- 不以效果图代替可编辑模型，不维护第二份手工边集。

## Engineering 范围

- 引入并固定开源 LikeC4 构建与 React 展示能力；
- 将 `digital-implementation` 迁移为单一 LikeC4 模型；
- 删除该视图对 React Flow / ELK 运行时和手工布局的依赖；
- 实现三张视觉事实源对应的桌面 selected、桌面 Hover 和手机 selected 状态；
- 生成同源文本降级、关系清单及全部几何、交互和响应式测试。

## 验收

- 模型逐项保持 9 节点、13 关系和权威说明；
- 关系线与 GraphCanvas、层边界、divider、节点边框共线重叠为 `0`；
- 默认状态无需 Hover 即可看清完整主路径和反馈闭环；
- 实际 Hover、click、Enter、Space、手机 tap 可用且不改变任何几何；
- 1440、1024、768、557、390、320 和代表性 100%–200% 缩放通过；
- Product/Visual 使用真实页面与视觉目标同屏对照；
- 用户实际浏览器环境在发布前完成人工检查；
- `release:check`、closeout、preflight、push、部署和公网验收分别报告。

## 当前状态

产品结构、桌面选中、桌面 Hover、手机纵向分层和验收合同已形成；尚未开始
Engineering 实现，未修改代码、依赖、产品版本、tag 或生产环境。
