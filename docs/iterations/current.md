# 当前迭代

## 当前唯一版本：`v0.24.27`

## 本版本目标

修复 v0.24.26 内容发布运行暴露的状态机、幂等、恢复和生命周期路径根因；同时收口活动 task 注册、Xing 称呼和图形优先输出基线。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.27 内容发布状态机与幂等恢复方案.md`。
- 产品候选：`XBUILD-CONTENT-RELEASE-003`。
- 父版本：`v0.24.26` / `70847cdf6df0820458c32e2f6df19f6aea7711e8`；既有 tag/history 不修改。

## 本版本范围

- 独立内容 release 使用 `prepared → built → transported → verifying → finalized → released` 可恢复状态机。
- 同一 `contentReleaseId/contentHash/baseSiteArtifactId` 的 package/deployment 具备 lease、幂等和 resume，不重复部署。
- publicVerify 支持有界传播等待和身份绑定校验；finalize 使用独立 content root，原子完成且保留 recovery/log/package。
- 30 条 observations 串行发布，单目标失败不得污染其他目标或产品版本。
- 活动 task 身份、Xing 称呼和图形优先输出基线已登记并纳入本次治理收口。

## 明确不做

- 不修改上游事实、已发布 v0.24.26 或内容正文/来源/status/publishedAt。
- 不让内容 task 修改 `src/`、产品版本、current/history、commit/tag。
- 不创建并行 task、branch、worktree 或 automation。

## 验收合同

- 公网传播延迟可在同一 release 上等待/重试并成功收口。
- transport 成功、finalize 中断后可恢复，不出现 publication file missing。
- 同一 release 重试不产生重复 deployment；失败保留 package/recovery/log。
- 产品 dist 不含独立内容，产品与内容 transport 只验证自身身份和证据。
- `npm run check`、内容发布专项、release prepare/closeout/preflight、diff-check 通过。
- `npm run check`、相关内容/发布专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；既有环境 I/O 单独记录。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
