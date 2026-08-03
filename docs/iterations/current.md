# 当前迭代

## 当前唯一版本：`v0.24.15`

状态：Engineering 已完成 v0.24.15 对 v0.24.14 本地收口状态事实的最小修正，并形成 local commit/tag；提交后的产品/视觉验收、publish 授权和线上状态由外部事件承担，不回写 current/history。
localSubmission: complete
发布授权：由显式 `--authorize-publish` 或 `XINGBUILD_PUBLISH_AUTHORIZATION=confirmed` 外部门禁承担，不写入 current/history。
线上状态：由 `release.json`、`content-manifest.json`、部署记录和公网验证承担，不写入 current/history。
父版本：`v0.24.14` / `086d70f931ec8da9f8fc513bb0006156230658ba`；该 tag 不修改。
责任 task：产品与视觉主线负责提交后 QA 与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

修正 v0.24.14 本地收口自然语言，使不可变版本身份事实与 commit/tag 状态一致。

## 本版本范围

- 仅修正 v0.24.14 状态表达；不修改 UI、IA、schema、内容、上游事实、规则或 publish 脚本。
- 不移动或修改 v0.24.14、v0.24.13、v0.24.12、v0.24.11 tag；不 push/publish/deploy。

## 验收与状态

- 必须通过 `npm run check`、`npm run release:closeout-check`、`npm run release:preflight` 与 `git diff --check`；v0.24.14 的专项验证和既有 Mermaid/Puppeteer 环境阻断沿用其历史记录。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 v0.24.13。
- 活动候选仅保留未确认 DRAFT/pending。
- 下一动作：产品/视觉验收 v0.24.15；验收通过且用户明确授权后，按固定 EdgeOne transport 合同发布。
