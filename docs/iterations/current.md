# 当前迭代

## 当前唯一版本：`v0.24.13`

状态：Engineering 已完成 v0.24.13 transport 合同测试收口、自 QA，并形成 local commit/tag；提交后的产品/视觉验收、publish 授权和线上状态由外部事件承担，不回写 current/history。
localSubmission: complete
发布授权：由显式 `--authorize-publish` 或 `XINGBUILD_PUBLISH_AUTHORIZATION=confirmed` 外部门禁承担，不写入 current/history。
线上状态：由 `release.json`、`content-manifest.json`、部署记录和公网验证承担，不写入 current/history。
父版本：`v0.24.12` / `37b6aef7379ddf6f878556eab11e5e145435af01`；该 tag 不修改。
责任 task：产品与视觉主线负责提交后 QA 与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

收口 transport-only publish 的内容/Practice 合同测试，确保发布阶段只做身份匹配、传输、部署和公网验证。

## 本版本范围

- 修正 Practice/范围专项测试，使业务 scope-check 留在 publish 前准备阶段。
- 保留 v0.24.12 的 transport-only 实现，不修改 UI、IA、schema、内容或上游事实。
- 不移动或修改 v0.24.12、v0.24.11 tag；不 push/publish/deploy。

## 验收与状态

- 必须通过 `npm run check`、release/transport 专项测试、`npm run release:closeout-check`、`npm run release:preflight` 与 `git diff --check`；`release:check` 记录实际结果。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 v0.24.1。
- 活动候选仅保留未确认 DRAFT/pending。
- 下一动作：产品/视觉沿用 v0.24.12 已确认方向验收 v0.24.13；随后按既有授权执行 publish transport。
