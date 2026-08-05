# XBUILD-CONTENT-RELEASE-003

候选 ID：XBUILD-CONTENT-RELEASE-003
类型：独立内容发布能力候选
状态：archived_transformed
目标版本：`v0.25.5`
正式方案：`docs/design/v0.25.5 内容发布站点快照身份与可恢复发布方案.md`
归档原因：已转化为 v0.25.5 正式产品方案；不再保留活动 `pending` 候选。
来源：内容独立发布运行记录（2026-08-04、2026-08-05）

## 用户含义与目标

经营观察、B 端产品内容、企业经营体系长文和关于我等内容必须能够独立日常运营。内容确定后，通过标准 CLI 发布，不等待产品版本，不修改产品代码、IA、视觉、VERSION、current、history 或 tag。发布工具必须失败可恢复、重试幂等、身份可证明；部署成功不等于发布成功。

## 转化时确认的根因

三个新 Brief 曾分别产生 deployment/publicVerify，但后续站点快照没有持续保留它们：`content-release.json` 已写入 `baseSiteArtifactId=v0.25.4-99dcd94b08f8`，同包 `dist/client/content-manifest.json` 仍为 `baseSiteArtifactId=null`，后续 active 读取因此排除；状态写入也覆盖了 `publishedSlugs`，造成 active IDs 与 slug 列表不一致。

这属于生命周期事实与构建投影未原子绑定、完整 SitePublication 快照未作为统一发布对象的问题，不是内容、审核、EdgeOne 账号或网络问题。

## 原候选目标与已转化能力

```text
prepare → build → immutable package
       → transport(deploymentId)
       → publicVerify(identity-bound)
       → atomic finalize
       → released(contentReleaseId/hash/base/deployment/publicVerify)
```

- receipt 作为 active 生命周期唯一事实源；
- Coordinator 从 ProductArtifact、全部 active receipt 和 candidate 生成完整快照；
- 单一站点 lease、唯一 deployment、同 publication/deployment resume；
- 全量公网验证通过后才 finalize；失败保留 recovery，不污染既有 active；
- 内容与产品版本/tag 完全解耦。

## 保留的验收要求

1. 新内容与既有 active 内容可以在同一完整快照中同时验证；
2. 传播延迟、身份漂移、旧投影、finalize 中断均可硬失败或恢复，不丢失证据；
3. 同一内容重试不创建新内容身份或重复 deployment；
4. 产品发布不携带独立内容，内容发布不产生产品版本；
5. 真实公网 manifest 的 active IDs、slug、目标页面、媒体、产品身份全部一致。

## 责任收口

- 产品/视觉：维护正式方案并验收；
- Engineering：实现、自 QA、commit/tag/clean 和发布；
- 内容 task：保留既有 package/recovery/log，能力通过后按 reconcile 恢复；
- Ops：不参与内容发布恢复。
