# 当前迭代

## 当前唯一版本：`v0.24.19`

## 本版本目标

在不重造既有产品、工程、内容或 Ops 事实源的前提下，将产品工程协作规则按职责、协作、迭代发布、产品视觉和 Engineering 五层统一路由，消除重复正文和 task 回传地址歧义。

## 本版本范围

- 新增 `docs/rules/00-baseline-index.md`，登记规则优先级、唯一 owner 和按任务类型读取矩阵。
- 新增 `docs/rules/responsibility-and-workflows.md`，集中维护产品/视觉、Engineering、内容、Ops、用户的职责边界、候选分流和产品工程闭环。
- 新增 `docs/rules/collaboration-workflow.md`，集中维护 `sourceThreadId`、`targetThreadId`、`returnThreadId`、长任务 ACK、一次性交接和禁止轮询。
- 新增 `docs/rules/engineering-architecture-and-principles.md`，只登记现有 `src/`、`content/`、`scripts/`、`worker/`、生成物和 transport 边界。
- `AGENTS.md` 改为入口与强制边界；`iteration-and-release.md` 收敛为产品版本与发布正文；产品总案、内容运营合同和经营观察合同继续作为各自唯一事实源。
- 规则专项测试验证五层入口、读取路径、身份分离、一次回传、无轮询和内容/Ops 不进入产品版本。

## 非目标

- 不修改 v0.24.18 或更早版本的 tag/history。
- 不修改 UI、IA、schema、内容、上游事实、产品总案正文、内容运营合同正文或发布业务逻辑。
- 不创建、删除、暂停或替代任何 task、branch、worktree、automation 或 scheduler。

## 验收合同

- 任何 task 都能从 `AGENTS.md → 00-baseline-index.md → 对应层规则` 找到唯一事实源。
- 职责、跨 task 协作、产品版本发布、产品视觉和 Engineering 架构不再互相复制正文。
- 交接模板明确 source/target/return，目标 task 一次回传；目标缺失或工具不可调用只报告阻断，不猜测、不轮询、不自行创建。
- 内容与 Ops 继续使用独立身份和独立运营合同，不进入产品版本。
- Engineering 完成本地 commit/tag/clean 与 history 后，交产品/视觉验收；本版本不 push、publish、部署。

父版本：`v0.24.18` / `ba1be3d9e12c6b285ff031dd24b00670584f9a41`；该 tag 不修改。
责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
