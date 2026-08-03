# 当前迭代

## 当前唯一版本：`v0.24.25`

## 本版本目标

修复 `XBUILD-PRODUCT-CONTENT-ISOLATION-001`：产品构建不得隐式读取或携带独立运营内容；产品发布与内容发布必须拥有独立 source、manifest、deployment 和验证事实。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.25 产品与独立内容发布边界解耦方案.md`。
- 产品候选：`XBUILD-PRODUCT-CONTENT-ISOLATION-001`。
- 关联阻断：`CONTENT-BLOCK-ROBOTAXI-TRANSPORT-001`。
- 父版本：`v0.24.24` / `0ea7056ef66a4d088cf224465e07882cce9460b0`；既有 tag/history 不修改。

## 本版本范围

- 产品 build 只消费产品能力与稳定产品源，不读取或复制 `.content-workspace/content`、独立运营媒体和内容账本。
- 页面无内容时保持合法空状态，不生成占位内容；不改变 UI、IA、schema、路由或视觉系统。
- 产品 manifest 不写入 `contentReleaseId`、内容 hash、内容 deployment 或 publicVerify。
- 内容链路继续使用独立 content root、ChangeSet/recovery、日志和 `contentReleaseId`；可显式消费 immutable `baseSiteArtifact`，不得隐式带入内容。

## 明确不做

- 不修改上游事实、已发布 v0.24.24 或内容 task 文件。
- 不让内容 task 修改 `src/`、产品版本、current/history、commit/tag。
- 不创建并行 task、branch、worktree 或 automation。

## 验收合同

- 产品 dist 不含独立内容正文与运营媒体；产品发布后公网不自动出现未独立发布内容。
- 独立内容包具备 `contentReleaseId`、contentHash、baseSiteArtifactId、deployment 和 publicVerify。
- 产品与内容可以分别构建、部署、验证和回滚；任一失败不污染另一方版本事实。
- 产品/内容 transport 只验证自身身份和证据，不调用对方业务逻辑。
- `npm run check`、相关内容/发布专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；既有环境 I/O 单独记录。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
