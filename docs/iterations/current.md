# 当前迭代

## 当前目标版本

`v0.15.5`

## 要解决的问题

修复全站短页 Footer 随内容停在页面上部的几何根因，使 Footer 在短页位于视口底部、长页位于全部内容末尾。

## 本轮范围

- 仅限全局 SiteShell 纵向几何、Footer 前统一关系间距、动态视口与 safe area、对应测试和 v0.15.5 记录。
- 不改 Header、Footer 文案/颜色/字号、页面正文、Rail、内容对象、发布脚本或其他 backlog。
- 本轮只实现和验证页面框架；产品独立验收前不创建 commit/tag，且不 push、部署或执行公网发布。

## 验收标准

- 全站只使用同一 SiteShell：Header auto、main 可增长、Footer auto；Footer 不使用 fixed/absolute/sticky。
- 1440×900 与 390×844 下，短页无多余滚动且 Footer bottom≈viewport bottom；长页 Footer bottom≈document scrollHeight。
- 所有目标页面 `scrollWidth == clientWidth`、console error/warning 为 0。
- sticky Header、reduced motion、移动菜单 inert/scroll lock 与现有内容结构测试不回退。
- 相关测试、`npm run release:check`、真实页面 QA、diff 与产品独立验收通过后，才进入本地 closeout/preflight。

## 当前状态

v0.15.5 Engineering 实现与自动验证已完成：共享 shell 合同测试、完整 `npm run release:check` 62/62、1440×900 与 390×844 串行本地几何 QA 均通过；产品独立验收通过，进入本地收口。尚未执行 push、部署或公网发布。

## 明确 backlog

- 已发布 Observation 撤下或 canonical 替换；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
