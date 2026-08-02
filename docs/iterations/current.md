# 当前迭代

## 当前唯一版本：`v0.24.5`

状态：Engineering v0.24.5 current-fix 本地实现、自 QA、commit、annotated tag 与 preflight 已完成；产品/视觉验收待确认。未 push、publish、部署或公网验收。
发布授权：未授权线上 publish、push 或部署。
父版本：`v0.24.4` / `a4c898a16a1a92c2199f80e96a4ac2e23ff730c4`
责任 task：产品与视觉主线负责方案与验收；Engineering 主线负责本地版本收口。

## 本版本目标

移除统一发布测试对历史版本 `0.24.2` 的硬编码，使版本门禁动态校验当前统一版本身份。

## 本版本范围

- 修改 `tests/practice-release.test.mjs`：动态校验 `package.json`、`package-lock.json`、`VERSION.md` 与 `current.md` 的版本一致性。
- 同步 `package.json`、`package-lock.json`、`VERSION.md`、`current.md` 与 `docs/iterations/history/v0.24.5.md` 为 v0.24.5。
- 正式方案：`docs/design/v0.24.5 统一发布版本动态一致性测试修复方案.md`。

## 明确不做

- 不修改 UI、页面 IA、内容 schema、内容事实或上游事实。
- 不修改发布脚本业务逻辑；不改变固定测试夹具版本。
- 不创建 branch、worktree、替代 task 或第二套版本身份。
- 不 push、publish、部署或修改线上版本。

## 验收与下一动作

- `npm run check`、相关 Practice/release 测试、`git diff --check`、`npm run release:closeout-check`、`npm run release:preflight` 通过。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）；线上 URL：`https://xingbuild.top/`。
- 线上继续 v0.24.1，未 push/publish/deploy；活动候选仍仅保留未确认 DRAFT/pending。
- 下一动作：向产品/视觉 task 回传本地提交检查点，等待验收与用户 publish 授权。
