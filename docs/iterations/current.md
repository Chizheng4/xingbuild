# 当前迭代

## 当前目标版本

`v0.14.1`

## 要解决的问题

`v0.14.0` 线上验收发现 Framework 同源投影的内部说明标题固定为 `H3`：来源页正确，但首页形成 `H2 → H3 → H3` 的语义并列。

## 本轮范围

- 只让 FrameworkDescription 的内部说明标题相对选中节点标题自动递进；
- 来源页固定为 `H1 → H2 → H3`，首页投影固定为 `H2 → H3 → H4`；
- 不改 Framework 的字号、间距、文案、模型、边集、视觉或交互。

## 验收标准

- 首页与来源页各有可执行标题层级合同；
- 所有说明标题仍使用同一既有视觉角色；
- `npm run release:check`、closeout/preflight 与公网最小回归通过。

## 当前状态

本地语义修复、自动检查与定点浏览器回归已通过；待本轮 stable commit、matching tag、preflight 与已授权生产发布闭环。完成后必须主动回传当前设计 task 做专业验收，不轮询等待。

## 明确 backlog

- 企业经营体系总览进入局部视图；
- legacy Article 与 ArticlePreview 闭环；
- 八条 Brief 人工扩充至80–160字；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
