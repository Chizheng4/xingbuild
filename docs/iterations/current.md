# 当前迭代

## 当前唯一版本：`v0.24.28`

## 本版本目标

在 v0.24.27 内容发布状态机基础上，完成持续自动闭环、活动 task 身份注册、Xing 称呼和图形优先输出基线收口；产品发布与独立内容发布保持边界并可自动完成。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.28 持续自动闭环与协作身份治理方案.md`。
- 继承设计：`docs/design/v0.24.27 内容发布状态机与幂等恢复方案.md`。
- 产品候选：`XBUILD-CONTENT-RELEASE-003`（已纳入 v0.24.27，保留历史证据）。
- 父版本：`v0.24.27` / `42c125d3a4ba867e78c32756489614e368e8760c`；既有 tag/history 不修改。

## 本版本范围

- 继承 v0.24.27 的独立内容 release 状态机、幂等、恢复和 30 条 observations 串行隔离能力。
- 活动 task 身份、Xing 称呼、图形优先输出和持续自动闭环规则进入统一基线。
- 产品/视觉验收通过后自动执行产品 transport；内容 Approved 且有批次授权后自动执行独立内容闭环。
- 任何硬失败保留 recovery/package/log 并停止，不因自动授权而绕过身份、clean、审核或公网验证。

## 明确不做

- 不修改上游事实、已发布 v0.24.27 或内容正文/来源/status/publishedAt。
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
