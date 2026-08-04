# XBUILD-CONTENT-RELEASE-004

候选 ID：XBUILD-CONTENT-RELEASE-004  
类型：独立内容运营效率与发布一致性能力  
来源：`docs/iterations/candidates/XBUILD-CONTENT-RELEASE-004.md`  
归档原因：已转化为正式产品工程方案 `v0.25.1`。  
目标方案：`docs/design/v0.25.1 内容批次发布与 active 身份一致性能力.md`

## 原始方向

内容身份逐条保留，物理站点发布改为批次/安全分片，减少重复 build、上传、deployment、公网验证和 finalize；保留单条发布 fallback、失败恢复和幂等证据。

## 产品评估结论

方向符合产品与内容解耦原则，但不能只做“30 条批量发布”优化，必须建设通用产品能力：

- `ContentBatchPlan` 只是运营编排对象，不合并单条内容身份；
- Batch Planner 按真实文件/大小/路径约束计算最大安全批次并确定性分片；
- immutable `ProductArtifact` 按 version/commit/sourceBundleHash 缓存；
- `content-release.json`、包内 manifest、completion 和 active 读取必须原子一致；
- 每个分片一次 SitePublication/物理 deployment，combined verify 通过后逐条幂等 finalize；
- 单条发布继续作为紧急/低频 fallback。

## 事实校正

原候选称“30 条已全部独立发布完成”。本次复核发现 30 个内容包均有本地 `released` 记录，但发布台账曾出现一条包的 release record 与 dist manifest 使用不同 `baseSiteArtifactId`，导致后续 active 读取排除该条。该事实已纳入 v0.25.1 的 stale artifact identity 回归验收，不能只以单条 `released` 状态宣称集合完整。

## 处理

- 候选不再作为活动 pending，已转入 v0.25.1 current。
- 不修改内容正文、来源、媒体或上游事实。
- 不由内容 task 修改 CLI/代码；由 Engineering 按正式 current 实现和验证。
