# 当前迭代

## 当前唯一版本：`v0.24.6`

状态：Engineering v0.24.6 本地实现、自 QA、commit、annotated tag 与 preflight 已完成；产品/视觉验收待确认。未 push、publish、部署或公网验收。
发布授权：未授权线上 publish、push 或部署。
父版本：既有 `v0.24.5` tag / `4fb92b64257676479ae392f0f32bb42f36e872ae`；动态测试修复基线 / `3c26282aeec300c31739a1af4462c5844d5cdc21`。
责任 task：产品与视觉主线负责方案与验收；Engineering 主线负责本地版本收口。

## 本版本目标

解决既有 `v0.24.5` annotated tag 与动态版本测试修复提交的身份冲突，在不移动既有 tag 的前提下形成唯一 v0.24.6 本地版本身份。

## 本版本范围

- 同步 `package.json`、`package-lock.json`、`VERSION.md`、`current.md` 与 `docs/iterations/history/v0.24.6.md` 为 v0.24.6。
- 保留动态版本测试修复；保留既有 `v0.24.5` tag，不移动、不删除、不覆盖。
- 正式方案：`docs/design/v0.24.6 版本身份冲突收口方案.md`。

## 明确不做

- 不修改 UI、页面 IA、内容 schema、内容事实或上游事实。
- 不创建 branch、worktree、替代 task 或第二套版本身份。
- 不 push、publish、部署或修改线上版本。

## 验收与下一动作

- `npm run check`、Practice/release 相关测试、`git diff --check`、`npm run release:closeout-check`、`npm run release:preflight` 通过。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）；线上 URL：`https://xingbuild.top/`。
- 线上继续 v0.24.1；活动候选仅保留未确认 DRAFT/pending。
- 下一动作：向产品/视觉 task 回传本地提交检查点，等待验收与用户 publish 授权。
