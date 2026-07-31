# 当前迭代

## 当前目标版本

`v0.17.0`

## 主题

企业经营体系固定架构图与全站返回统一

## 事实源

- `docs/design/v0.17.0 企业经营体系固定架构图与全站返回统一方案.md`
- `docs/design/xingbuild Visual System v1.md`
- `src/content/frameworkModel.js`
- `docs/rules/iteration-and-release.md`

## 目标

- 采用已选择的“Architecture Spine”方向，只优化 `digital-implementation` GraphCanvas 内部的节点布局、关系线、标签、强调和稳定性。
- 默认完整呈现现有 9 个节点、13 条关系及闭环；选择节点只更新强调和说明，不移动或缩放画布。
- 移除平移、缩放、pointer capture、“复位视图”及 SystemStage 上方的局部标题/私有工具栏。
- 建立共享 `ReturnNavigation（返回导航）`，统一 Article、观察集合和 Framework 的结构、文案、视觉、上下文及焦点恢复。

## 明确不做

- 不修改 `frameworkModel` 的概念、定义、作用、节点、边、方向或关系文案。
- 不修改网站一级信息架构、Header、页面标题、ShowcaseLayout、Observation rail、Robotaxi、Observation 内容、About、Footer 或发布能力。
- 不新增第二个局部入口、节点 URL、详情页、二次下钻或第二图模型。
- 不夹带其他 backlog。

## 验收

- 自动验证覆盖 9 节点/13 边、默认关系完整性、几何稳定、禁用画布移动、ReturnNavigation、安全上下文、焦点恢复、键盘和文本降级。
- 1440、1024、768、557、390、320 六档真实页面串行验证；无横向溢出、嵌套纵滚、节点/标签碰撞、裁切、布局晃动或 console error/warning。
- 不存在“数字化实现 + 返回总览 + 复位视图”额外工具栏；Framework 只显示一个 `← 返回企业经营体系`。
- Article、观察集合和 Framework 使用同一 ReturnNavigation 结构和视觉 token。
- `npm run release:check`、closeout-check 与 preflight 按阶段通过。

## 当前状态

Engineering 实现与本地验证已完成：专项自动测试通过，六档本地页面验证确认固定 9 节点/13 关系、无横向溢出、无标签碰撞或裁切、手机自然滚动与 console error/warning=0；返回链接通过 replace 回到总览并恢复 `digital-implementation` 焦点。下一步为按范围暂存、closeout-check、本地 commit/tag 与 preflight；尚未 push、部署或公网验收，完成本地收口后按事件驱动合同主动回传产品与视觉 task。
