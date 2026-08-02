# 当前迭代

## 当前唯一版本：`v0.24.10`

状态：Engineering 已完成 v0.24.10 不可变版本身份与提交后事件分离实现、自 QA，并形成 local commit/tag；current/history 不记录提交后的验收、授权或线上事件。
localSubmission: complete
发布授权：由显式 `--authorize-publish` 或 `XINGBUILD_PUBLISH_AUTHORIZATION=confirmed` 外部门禁承担，不写入 current/history。
线上状态：由 `release.json`、`content-manifest.json`、部署记录和公网验证承担，不写入 current/history。
父版本：`v0.24.9` / `5437aad6a80486bb22f4f64297aacfff68c2f449`；该 tag 不修改。
责任 task：产品与视觉主线负责提交后 QA 与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

彻底分离不可变版本身份事实与提交后的产品/视觉验收、publish 授权和线上发布事件，避免已打 tag 的 current/history 因事件回写而变脏。

## 本版本范围

- current/history 只保留 local commit/tag/clean 等不可变版本身份事实。
- 产品/视觉验收作为提交后的外部 QA/协作事件，不回写已打 tag 的 current/history。
- publish 只校验既有 clean HEAD+annotated tag，并要求显式 `--authorize-publish` 或环境授权。
- 线上状态只由 release manifest、部署记录和公网验证承担。
- 移除自动 increment、commit、tag、push、deploy；不修改 UI、IA、schema、内容或上游事实。

## 明确不做

- 不移动、删除、覆盖或 push `v0.24.9`、`v0.24.8`、`v0.24.7` tag。
- 不创建 branch、worktree、替代 task 或第二套版本身份。
- 不执行线上 push、publish、deploy 或公网验证。

## 验收与状态

- 必须通过 `npm run check`、release/状态专项测试、`npm run release:closeout-check`、`npm run release:preflight` 与 `git diff --check`。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 `v0.24.1`。
- 活动候选仅保留未确认 DRAFT/pending。
- 下一动作：Engineering 本地提交后，产品/视觉在外部 QA 事件中验收；用户明确 publish 后才执行线上发布。
