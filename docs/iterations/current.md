# 当前迭代

## 当前唯一版本：`v0.24.21`

## 本版本目标

在不扩大 v0.24.20 已完成的字段级内容能力边界的前提下，补齐内容 task 的最短操作入口和可验证恢复闭环：内容 task 能从已登记目标直接得到定位卡并生成被忽略的 `ChangeSet`，已发布内容变更能由原始变更事实生成逆向恢复包，再复用既有内容 prepare/build/transport 完成恢复。该能力建设属于产品工程版本；日常内容修改继续使用独立 `contentReleaseId`，不进入产品版本。

## 正式设计与父版本

- 正式设计：`docs/design/声明式内容定位与快速内容发布方案.md`。
- 父版本：`v0.24.20` / `c87df93ff89caee0e53f04d6013f72306fbb0900`；既有 tag 不修改。

## 本版本范围

- 增加一个非发布的内容目标入口（建议 `content:target`）：读取已登记 `targetId`，输出一次定位卡，并按明确的 `after/sourceRefs/boundary/authority` 生成 `.content-workspace/changes/` 中的结构化 `ChangeSet`；不新增第二套内容发布引擎，不在入口内执行 prepare/build/publish。
- `ChangeSet` 保留目标、字段、before 值/hash、after、来源、边界和权限事实；在明确的变更身份下支持生成逆向恢复 `ChangeSet`/recovery package，恢复只消费原始变更事实，不猜测当前正文。
- 恢复包必须关联原始 `changeSetId` 与已生成的 `contentReleaseId`/发布包身份，并可被既有 `content:prepare`、`content:build` 和独立 transport 校验、构建和发布；不修改产品 `current.md`、`VERSION.md`、commit/tag 或产品 manifest。
- 强化注册表完整性门禁：已登记 Robotaxi 目标必须固定到 `content/products/robotaxi.json`、`/products`、`scope=field`、字符串字段和安全字段路径；登记表越界、路径漂移或不匹配时硬停止。
- 增加目标入口、恢复包、注册表完整性、旧值/hash 冲突、canonical 内容不变和既有独立内容发布链路的专项测试。

## 明确不做

- 不修改 UI、IA、页面结构、schema、路由、组件、CSS、交互或上游事实。
- 不扩大首页、Article、About、Observation 或 Practice 的字段白名单，不实现媒体合同扩展，不修改 Practice video。
- 不创建人工 CMS、账号/RBAC、实时数据库、任意源码编辑器或第二套 `plan/preview/approve/publish/rollback` 发布引擎。
- 不把内容日常发布写入产品版本，不创建、删除、暂停或替代 task、branch、worktree、automation 或 scheduler。

## 验收合同

- 已登记目标可一次输出唯一 `targetId/fieldPath`、当前位置、当前值/hash、受影响路由、可改范围和不可改边界；未登记、歧义、路径越界或注册表漂移必须硬停止并报告。
- 用户确认后生成的 ChangeSet 只能修改登记字段；`beforeHash` 不匹配时拒绝，恢复包只能依据原始 `before`/`after` 和发布身份生成，不得静默覆盖或文本猜测。
- 正向和逆向 ChangeSet 均只写 ignored `.content-workspace/`，canonical 内容与产品版本事实不变；既有 `content:prepare`、`content:build`、独立 transport 和公网内容 manifest 合同不回归。
- `npm run check`、内容/Practice/ChangeSet/恢复专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；完整 Sites 测试若仍有 Mermaid/Puppeteer macOS I/O，只记录为既有环境阻断。
- Engineering 完成本地 commit/tag/clean 与 history 后，交产品/视觉验收；未验收、未授权前不 push/publish/deploy。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
