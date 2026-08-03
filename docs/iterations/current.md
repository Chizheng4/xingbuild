# 当前迭代

## 当前唯一版本：`v0.24.22`

## 本版本目标

在不扩大 v0.24.21 内容目标与恢复能力的前提下，补齐两个安全门禁：registry 对 Robotaxi 产品目标执行固定来源/路由/类型合同；rollback 在恢复前验证 canonical 基线仍是原始 `before`，再重建已发布值并执行 `beforeHash` 校验，禁止用写入动作掩盖内容漂移。该能力建设属于产品工程版本；日常内容修改继续使用独立 `contentReleaseId`，不进入产品版本。

## 正式设计与父版本

- 正式设计：`docs/design/声明式内容定位与快速内容发布方案.md`。
- 父版本：`v0.24.21` / `c11025c4b089ce2b3f573794a026901a07305379`；既有 tag 不修改。

## 本版本范围

- `validateContentTargetRegistry` 对 `kind=product-content` 的 Robotaxi target 强制校验：`editable=true`、`scope=field`、`valueType=string`、`sourcePath=content/products/robotaxi.json`、`projectionRoutes=["/products"]`、登记 ID 与安全字段路径；任何路径或路由漂移硬停止。
- `resolveContentTarget` 与 ChangeSet 读取继续只消费通过上述完整性门禁的登记目标，不允许通过篡改 registry 绕过字段白名单。
- rollback prepare 在构造已发布值前，先校验 canonical 当前字段的 hash/值等于原始 ChangeSet 的 `originalBefore`；不匹配立即停止，不写入覆盖；通过后才重建原始 `originalAfter` 并让逆向 ChangeSet 的 `beforeHash` 真正校验。
- 增加 registry 篡改、Robotaxi 类型/路径/路由漂移、rollback canonical 漂移与成功恢复的专项测试；继续复用既有 `content:target`、`content:prepare`、`content:build` 和独立 transport。

## 明确不做

- 不修改 UI、IA、页面结构、schema、路由、组件、CSS、交互、Practice video、媒体合同或上游事实。
- 不扩大任何内容字段白名单，不新增 CMS、账号/RBAC、实时数据库或第二套内容发布引擎。
- 不改变内容独立发布身份，不写入产品版本以外的运营状态。
- 不创建、删除、暂停或替代 task、branch、worktree、automation 或 scheduler；不修改 v0.24.21 tag/history。

## 验收合同

- 任意 Robotaxi registry target 的来源、路由、类型或字段路径被篡改时，定位卡、ChangeSet、prepare 和 recovery 均硬停止。
- rollback 只在 canonical 基线与原始 `before` 一致时生成恢复包；基线漂移不产生包、不覆盖文件、不继续发布。
- 正向与逆向 ChangeSet 只写 ignored `.content-workspace/`，canonical 内容、产品版本身份和产品 manifest 不变。
- `npm run check`、内容/Practice/ChangeSet/registry/recovery 专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；完整 Sites 测试若仍只有既有 Mermaid/Puppeteer macOS I/O，记录为环境阻断。
- Engineering 完成本地 commit/tag/clean 与 history 后，交产品/视觉验收；未验收、未授权前不 push/publish/deploy。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
