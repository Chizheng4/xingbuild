# 当前迭代

## 当前目标版本

`v0.13.0`

## 当前状态

`v0.13.0` 已完成本地实现和验证，正在执行本轮特别授权的稳定收口与生产发布闭环：

- 一级导航、ShowcaseLayout、ObservationBlock、RichDocument 与内容入口均已迁移；
- 日常内容新增将只走受控内容对象与 content-only 流程；
- GitHub、EdgeOne 与公网 smoke test 状态以本轮发布执行结果为准。

## 下一轮

下一轮仅在新增内容对象类型、页面层级、统一布局、媒体类型或交互能力改变时创建产品迭代；日常内容继续走 content-only 流程。

## 发布状态

- GitHub：本轮发布后以远端 `main` 和 `v0.13.0` 为准；
- EdgeOne：本轮发布后以 `xingbuild-nochina` 的生产验证为准；
- 域名：未修改。

## 发布状态

本轮特别授权仅适用于 `v0.13.0`：Engineering 完成稳定提交、matching tag、推送与 EdgeOne 发布后，由设计 task 在生产站完成最终专业验收。后续迭代仍遵循默认发布授权边界。
