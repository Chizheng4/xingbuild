# 当前迭代

## 当前目标版本

`v0.14.3`

## 要解决的问题

八条已发布 Brief 曾以固定 slug 豁免 80–160 中文等价字符正文合同。内容扩写完成后，该豁免会让后续 content-only 发布继续依赖产品代码例外。

## 本轮范围

- 删除固定 slug 的迁移豁免；
- 统一以显式 `brief.body` 或 `brief.statement` 作为读者正文，强制 80–160 中文等价字符；
- 只修改 validator、必要测试和版本记录；不改页面、视觉、信息架构、内容事实或发布脚本。

## 验收标准

- 八条已发布 Brief 与未来 Brief 都经同一正文长度校验；
- 不存在 slug、日期或其他固定内容例外；
- `npm run release:check`、closeout/preflight 与公网最小回归通过。

## 当前状态

本地合同修订待完整检查、稳定版本收口和已授权生产发布闭环。完成后必须主动回传当前设计 task 做专业验收，不轮询等待。

## 明确 backlog

- 企业经营体系总览进入局部视图；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
