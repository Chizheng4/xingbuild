# 当前迭代

## 当前唯一版本：`v0.24.11`

状态：Engineering 已完成 v0.24.11 发布构建纯度根修正、自 QA，并形成 local commit/tag；提交后的产品/视觉验收、publish 授权和线上状态由外部事件承担，不回写 current/history。
localSubmission: complete
发布授权：由显式 `--authorize-publish` 或 `XINGBUILD_PUBLISH_AUTHORIZATION=confirmed` 外部门禁承担，不写入 current/history。
线上状态：由 `release.json`、`content-manifest.json`、部署记录和公网验证承担，不写入 current/history。
父版本：`v0.24.10` / `140ff412595592b3e3ce16305e81a43cbee3a59e`；该 tag 不修改。
责任 task：产品与视觉主线负责提交后 QA 与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

修复发布构建无条件运行 tracked-output generators 导致精确 HEAD 构建后 dirty 的根因。

## 本版本范围

- `npm run build`、`release:check`、publish 构建只读消费已提交 `src/generated/` 与 `public/` 生成物。
- `architecture:views`、`framework:data`、`framework:layout`、`article:figures` 保留为显式源变更/素材生成命令，只在 local commit 前运行。
- 增加 build 脚本结构测试与 tracked dirty 门禁回归测试。
- 不修改 UI、IA、schema、内容、上游事实；不移动或修改 v0.24.10 tag。

## 验收与状态

- 必须通过 `npm run check`、相关生成/架构测试、`npm run release:check`、`npm run release:closeout-check`、`npm run release:preflight` 与 `git diff --check`。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 v0.24.1。
- 活动候选仅保留未确认 DRAFT/pending。
- 下一动作：Engineering 本地提交后产品/视觉外部 QA；通过且用户明确 publish 后才执行线上发布。
