# 当前迭代

## 当前唯一版本：`v0.24.29`

## 本版本目标

在 v0.24.28 协作治理基础上，解耦产品 transport、环境型浏览器 QA 与独立内容基座；恢复产品能力发布与内容独立运营的并行闭环。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.29 产品发布门禁与内容基座解耦方案.md`。
- 继承设计：`docs/design/v0.24.28 持续自动闭环与协作身份治理方案.md`、`docs/design/v0.24.27 内容发布状态机与幂等恢复方案.md`。
- 产品候选：`XBUILD-CONTENT-RELEASE-003`（已纳入 v0.24.27，保留历史证据）。
- 父版本：`v0.24.28` / `0a8fc2a90764ddd6ea0e61175d50b5fd4918b290`；既有 tag/history 不修改。

## 本版本范围

- 继承 v0.24.28 的 task 身份、Xing 称呼、图形优先输出和持续自动闭环规则。
- 产品确定性发布门禁与环境型浏览器 QA 分层；不删除 QA，不绕过身份/clean/manifest/公网门禁。
- 内容基座按能力兼容性选择 immutable artifact；内容不等待未上线的最新产品版本。
- v0.24.28 无运行时页面能力变化，内容可复用在线 v0.24.26 基座独立发布。

## 明确不做

- 不修改上游事实、已发布 v0.24.28 或内容正文/来源/status/publishedAt。
- 不让内容 task 修改 `src/`、产品版本、current/history、commit/tag。
- 不创建并行 task、branch、worktree 或 automation。

## 验收合同

- 产品与环境 QA 分层后，确定性门禁和身份门禁可独立验证。
- 内容使用兼容 v0.24.26 artifact 完成独立发布；失败可恢复、不重复部署、不污染产品版本。
- 产品 dist 不含独立内容，产品与内容 transport 只验证自身身份和证据。
- `npm run check`、内容发布专项、release prepare/closeout/preflight、diff-check 通过。
- `npm run check`、相关内容/发布专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；既有环境 I/O 单独记录。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
