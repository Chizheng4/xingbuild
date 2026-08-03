# 当前迭代

## 当前唯一版本：`v0.24.26`

## 本版本目标

修复 v0.24.25 验收后的两项根因：空内容时 `/about` 解析崩溃；独立内容 CLI 无法覆盖 profile 与 businessObservation。产品内容边界保持解耦，内容恢复继续独立运营。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.26 空内容安全与完整内容目标能力方案.md`。
- 父版本：`v0.24.25` / `c83900f7b06106af9392c05359cac4a70fc2a2fd`；既有 tag/history 不修改。

## 本版本范围

- 所有 page content resolver 对缺失对象安全返回 null/空集合；五个公共路由无内容时仍保留网站名、导航、页脚和合法空状态。
- 独立内容目标支持 profile、businessObservation、content、article、practice；每个目标独立生成 contentReleaseId、contentHash、baseSiteArtifactId、deployment、publicVerify。
- 产品 build 继续只消费产品能力与稳定产品源，不读取或复制 `.content-workspace/content`；产品 manifest 不写入内容发布身份。
- 初始内容恢复按仓库实测：profile 1、product 1、businessObservation 1、article 1、observations 30、Robotaxi 媒体 manifest/MP4 1。

## 明确不做

- 不修改上游事实、已发布 v0.24.25 或内容 task 文件。
- 不让内容 task 修改 `src/`、产品版本、current/history、commit/tag。
- 不创建并行 task、branch、worktree 或 automation。

## 验收合同

- 空内容 build 后 `/`、`/products`、`/business-observations`、`/observations`、`/about` 均无运行时错误。
- 产品 dist 不含独立内容正文与运营媒体；产品 manifest 无内容发布身份。
- 五类独立内容目标均可 prepare/build/transport/finalize；内容失败不污染产品版本。
- 产品/内容 transport 只验证自身身份和证据，不调用对方业务逻辑。
- `npm run check`、相关内容/发布专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；既有环境 I/O 单独记录。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
