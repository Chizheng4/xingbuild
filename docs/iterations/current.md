# 当前迭代

## 当前目标版本

`v0.15.6`

## 要解决的问题

收口 Robotaxi 页面 canonical，使 `/products` 成为唯一真实读者页面，并让历史详情地址以 replace 方式兼容跳转。

## 本轮范围

- 仅限 `/products/robotaxi` canonical redirect、对应路由测试、v0.15.5 历史归档与 v0.15.6 版本记录。
- 不改 RobotaxiPage、页面内容、视觉、Footer、观察、`robotaxi.xingbuild.top` action、发布脚本或其他 backlog。
- 本轮只实现和验证 canonical 路由；产品独立验收前不创建 commit/tag，且不 push、部署或执行公网发布。

## 验收标准

- `/products` 保持唯一真实页面与 canonical reader URL。
- 直接进入 `/products/robotaxi` 使用 replace 跳转至 `/products`，不增加浏览器历史层。
- `/robotaxi`、`/works`、`/works/robotaxi` 的现有兼容结果保持为 `/products`。
- 删除 `/products/robotaxi` 的独立页面和标题分支，当前导航与最终标题正确。
- 路由测试、`npm run release:check`、桌面/手机真实历史行为、横向溢出、console 与产品独立验收通过后，才进入本地 closeout/preflight。

## 当前状态

v0.15.6 Engineering 实现与自动验证已完成：canonical 路由专项测试、完整 `npm run release:check` 63/63、1440×900 与 390×844 直接进入及 replace 历史行为均通过；产品独立差异复核通过，进入本地收口。尚未执行 push、部署或公网发布。

## 明确 backlog

- 已发布 Observation 撤下或 canonical 替换；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
