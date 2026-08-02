# 当前迭代

## 当前唯一版本：`v0.24.2`

状态：Engineering 本地实现与自 QA 完成；待本地提交、annotated tag、产品/视觉验收；尚未 push、publish、部署或公网验收。
发布授权：未授权线上 publish、push 或部署。
父版本：`v0.24.1` / `e4b5100b56cb6fd2e84a2329f88ad2ceab3d7b93`
责任 task：产品与视觉主线负责合同与验收；Engineering 主线负责实现、自 QA、本地版本记录、commit/tag 和 clean 收口。

## 本版本目标

将跨项目总合同落地为 xingbuild 的可执行产品、工程、内容与 task 治理流程，统一本地提交版本、产品/视觉验收、线上 publish 和候选清点边界。

## 本版本范围

- `AGENTS.md`：canonical direct-local、task 创建/交接权限、Engineering/产品视觉责任和强制状态报告。
- `docs/rules/iteration-and-release.md`：本地提交版本、history 不回写、验收后下一版本、线上可滞后、publish 统一版本和 task 目标缺失阻断。
- `docs/product/xingbuild 网站产品架构与视觉系统总案.md`：产品/视觉验收责任、Engineering 自 QA 边界和状态报告。
- `docs/operations/Slug级内容审核终端命令交接.md`：内容与发布 task 的本地/线上状态报告和 publish 边界。
- `package.json`、`VERSION.md`、`current.md`、`docs/iterations/history/v0.24.2.md`：统一 v0.24.2 本地提交版本身份。

## 明确不做

- 不修改 UI、页面 IA、内容 schema、上游事实或运营内容。
- 不创建 branch、worktree、替代 task 或第二个问题清单。
- 不在本地提交前执行 push、publish、部署或公网验收。
- 不回写既有 v0.24.1 history、tag 或线上版本。

## 验收与下一动作

- `npm run check`、`npm run content:check`、`npm run article:check`、`npm run practice:check` 已通过。
- 完整 `release:check` 的既有 Mermaid/Puppeteer 浏览器启动 I/O 失败记录为阻断；不扩展本版本范围。
- `git diff --check` 已通过。
- 下一动作：完成版本收口、commit、annotated tag 和 clean 工作区后，向产品/视觉 task 发送一次本地提交检查点；等待产品/视觉验收与用户 publish 授权。
