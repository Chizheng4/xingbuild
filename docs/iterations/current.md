# 当前迭代

## 当前唯一版本：`v0.24.12`

状态：Engineering 已完成 v0.24.12 publish 纯传输部署拆分、自 QA，并形成 local commit/tag；提交后的产品/视觉验收、publish 授权和线上状态由外部事件承担，不回写 current/history。
localSubmission: complete
发布授权：由显式 `--authorize-publish` 或 `XINGBUILD_PUBLISH_AUTHORIZATION=confirmed` 外部门禁承担，不写入 current/history。
线上状态：由 `release.json`、`content-manifest.json`、部署记录和公网验证承担，不写入 current/history。
父版本：`v0.24.11` / `5fa8f2871c40433980d8d5e72b84213364209966`；该 tag 不修改。
责任 task：产品与视觉主线负责提交后 QA 与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

彻底分离 publish 的线上传输/部署职责与网站业务验证、构建、Sites 测试职责。

## 本版本范围

- publish 只验证官方 direct-local clean main 的既有 HEAD+annotated tag 与预先生成 `dist/client` 的 release/content manifest 身份。
- 明确授权后 push 同一 HEAD/tag、部署同一 `dist/client` 并进行公网 manifest 验证。
- `release:prepare`/`release:build` 承载业务检查、构建和 Sites 测试；publish 不自行 build、不修改源码、不生成业务内容。
- 内容、文章、实践入口保留精确目标合同，但 transport 阶段不运行其业务 QA。
- 不修改 UI、IA、schema、内容、上游事实；不移动或修改 v0.24.11 tag。

## 验收与状态

- 必须通过 `npm run check`、release/transport 专项测试、`npm run release:check`（记录实际结果）、`npm run release:closeout-check`、`npm run release:preflight` 与 `git diff --check`。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 v0.24.1。
- 活动候选仅保留未确认 DRAFT/pending。
- 下一动作：Engineering 本地提交后产品/视觉外部 QA；随后按既有授权执行 publish transport。
