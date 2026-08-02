# 当前迭代

## 当前唯一版本：`v0.24.8`

状态：Engineering 已完成 v0.24.8 根因治理实现与自 QA，待本地 commit/tag 与产品/视觉验收；尚未 push、publish、部署或公网验收。
发布授权：未授权线上 publish、push 或部署。
父基线：canonical `v0.24.6` / `45d75af830238784a2e29c5497940ea63d56ae25`；异常 `v0.24.7` / `16981ffad2ae733a30d8db06bc2abe1e54f0c0fc` 仅作未发布历史事实，不作为线上基线。
责任 task：产品与视觉主线负责合同与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

从根源统一“版本创建”和“线上发布”边界：publish 只消费已验收的现有 local commit/tag，不自动递增版本、不回写版本历史、不自动 commit/tag，不在失败时产生伪完成事实。

## 本版本范围

- 重写 `scripts/unified-publish.mjs` 与统一版本辅助逻辑。
- 修正 build/生成流程，使构建不污染 tracked source/generated 文件。
- 增加 publish 顺序、授权、accepted HEAD/tag、dirtyPaths、失败短路和同 HEAD 公网校验测试。
- 更新 `AGENTS.md`、`docs/rules/iteration-and-release.md`、`docs/README.md` 与 publish 入口说明。
- 正式方案：`docs/design/v0.24.8 统一发布消费现有版本与构建纯度治理方案.md`。

## 明确不做

- 不移动、删除、覆盖或 push 异常 `v0.24.7` tag。
- 不修改 UI、页面 IA、内容 schema、内容事实或上游事实。
- 不创建 branch、worktree、替代 task 或第二套版本身份；内部构建沙箱不得成为协作事实源。
- 不在本版本执行线上 push、deploy 或 public verify。

## 验收与状态

- 必须通过 `npm run check`、publish/构建专项测试、`npm run release:check`、`npm run release:closeout-check`、`npm run release:preflight`。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 `v0.24.1`。
- 活动候选仅保留未确认 DRAFT/pending；本版本不从候选推导范围。
- 下一动作：Engineering 完成本地提交/tag 后交产品/视觉验收；验收通过后等待用户明确 publish。
