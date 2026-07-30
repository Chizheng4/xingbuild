# 当前迭代

## 当前目标版本

`v0.15.4`

## 要解决的问题

一次性建立 slug 级 Observation 内容准备与生产发布能力，使日常内容发布保持稳定产品版本和 tag，并能在无关 ignored workspace 内容并存时安全发布单一目标。

## 本轮范围

- 仅限中文主规则与四 task 边界、人工审核 hash、可恢复 promote、未发布草稿 supersede、slug scope/commit/origin/workspace 门禁、内容发布脚本、对应测试与 v0.15.4 记录。
- 不改 Footer、Header、页面、样式、Brief/Article 读者 anatomy、任何公开内容对象、已发布内容撤下、Robotaxi 媒体状态或其他 backlog。
- 本轮只实现和验证产品能力；产品独立验收前不创建 commit/tag，且不 push、部署或执行公网发布。

## 验收标准

- `publish-content.command --slug <slug>` 缺失或非法 slug、范围混入、版本变化、上游未同步或 workspace 泄漏时硬失败。
- 目标 draft 只有在人工审核 sidecar hash 匹配时可 promote；无关 slug candidate/draft 可并存，目标 candidate/import 冲突失败。
- 内容提交只含目标 `content/observations/<slug>.json` 与必要 approved media，产品版本/tag 不变，发布前 `origin/main == HEAD^`；push 后只重试同一 HEAD 的部署/公网验收。
- Supersede 只归档未发布草稿，显式 old/canonical/reason/decidedAt/hash，禁止通配和已发布内容撤下。
- push、部署或公网验收失败时完整保留目标 draft/review/recovery；只有公网验证成功后精确 finalize 目标 slug，且不触碰无关 workspace。
- 正反向测试、`npm run release:check`、diff 与产品独立验收通过；随后才进入本地 closeout/preflight。

## 当前状态

产品独立验收退回的发布后 lifecycle finalize 阻断项已修复；专项测试 23/23、完整 `npm run release:check` 61/61 通过，产品独立复验通过，进入本地收口。本轮尚未执行 push、部署或公网发布。

## 明确 backlog

- Footer 与其他页面/视觉调整；
- 已发布 Observation 撤下或 canonical 替换；
- legacy Article 与 ArticlePreview 闭环；
- About 真实事实内容补齐；
- controlled-system/video 内容入口；
- `/products/robotaxi` canonical/redirect。
