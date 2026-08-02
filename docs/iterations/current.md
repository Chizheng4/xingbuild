# 当前迭代

## 当前唯一版本：`v0.24.4`

状态：Engineering v0.24.4 本地实现、自 QA、commit、annotated tag 与 preflight 已完成；产品/视觉验收待确认。未 push、publish、部署或公网验收。
发布授权：未授权线上 publish、push 或部署。
父版本：`v0.24.3` / `e38397aca8583c291602c679bff5cb15ab0ce76b`
责任 task：产品与视觉主线负责方案与验收；Engineering 主线负责本地版本收口。

## 本版本目标

确立候选的单向生命周期：候选只属于产品设计前阶段；一旦被正式产品设计方案继承或关闭，立即归档，Engineering 只读取正式方案与 `current.md`。

## 本版本范围

- 更新 `AGENTS.md`、`docs/rules/iteration-and-release.md`、产品总案和 `docs/README.md` 的候选生命周期基线。
- 新增 `docs/iterations/history/candidates/` 作为已转化/已关闭候选的唯一历史归档目录。
- 将已吸收或已关闭候选移入历史归档，活动目录仅保留未确认 DRAFT/pending 候选。
- 正式方案：`docs/design/v0.24.4 候选转产品设计方案与归档治理方案.md`。
- 同步 `package.json`、`package-lock.json`、`VERSION.md`、`current.md` 与 `docs/iterations/history/v0.24.4.md` 为 v0.24.4。

## 明确不做

- 不修改 UI、页面 IA、内容 schema、内容事实或上游事实。
- 不从活动候选推导 Engineering 实现范围。
- 不创建 branch、worktree、替代 task 或第二套候选清单。
- 不 push、publish、部署或修改线上版本。

## 验收与下一动作

- `npm run check`、`git diff --check`、`npm run release:closeout-check`、`npm run release:preflight` 通过。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）；线上 URL：`https://xingbuild.top/`。
- 线上继续 v0.24.1；候选活动状态仅保留未确认 DRAFT/pending。
- 下一动作：向产品/视觉 task 回传本地提交检查点，等待验收与用户 publish 授权。
