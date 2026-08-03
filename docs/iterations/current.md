# 当前迭代

## 当前唯一版本：`v0.24.14`

状态：Engineering 已完成 v0.24.14 发布 transport 目标与故障决策门治理和自 QA，正在形成 local commit/tag；提交后的产品/视觉验收、publish 授权和线上状态由外部事件承担，不回写 current/history。
localSubmission: complete
发布授权：由显式 `--authorize-publish` 或 `XINGBUILD_PUBLISH_AUTHORIZATION=confirmed` 外部门禁承担，不写入 current/history。
线上状态：由 `release.json`、`content-manifest.json`、部署记录和公网验证承担，不写入 current/history。
父版本：`v0.24.13` / `812d0e60b384f0bd352f074d817213c6b8ea3ba9`；该 tag 不修改。
责任 task：产品与视觉主线负责提交后 QA 与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

形成发布治理的最小一致合同：prepare/build/closeout/preflight/transport 四阶段，transport-only publish 固定消费既有版本与目标，失败进入 Publish Incident 决策门。

## 本版本范围

- 修正规则中旧 publish 构建沙箱、release:check、Sites 与 worktree 描述，使四阶段职责一致。
- 固定 EdgeOne `name=xingbuild-nochina`、`projectId=makers-ze0f6txvlhco`、`domain=xingbuild.top`，拒绝未声明环境变量覆盖。
- 新增 Publish Incident 失败阶段、证据、分类、owner、授权和下一动作门禁；不修改 UI、IA、schema、内容或上游事实。
- 不移动或修改 v0.24.13、v0.24.12、v0.24.11 tag；不 push/publish/deploy。

## 验收与状态

- 必须通过 `npm run check`、release/rules/transport 专项测试、`npm run release:prepare`、`npm run release:build`（记录既有 Mermaid/Puppeteer 环境阻断）、`npm run release:closeout-check`、`npm run release:preflight` 与 `git diff --check`。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 v0.24.13。
- 活动候选仅保留未确认 DRAFT/pending。
- 下一动作：本地 commit/tag 后交产品/视觉验收；验收通过且用户明确授权后，按固定 EdgeOne transport 合同发布。
