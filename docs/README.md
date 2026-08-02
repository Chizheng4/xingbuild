# xingbuild 文档索引

这个目录保存网站的长期规则、产品设计、上游事实、迭代历史和验证证据。根目录只保留日常启动、构建、发布和版本识别所需的直接入口。

## 目录责任

| 目录 | 责任 | 是否可直接修改 |
| --- | --- | --- |
| `rules/` | 迭代、发布和工程协作规则 | 规则变化时修改 |
| `product/` | 已形成基线的产品定位与内容模型 | 经确认后修改 |
| `design/` | 已确认的正式版本设计、视觉系统与验收合同 | 只能在方案确认后修改；禁止存放 DRAFT |
| `explorations/` | 尚在分析、比较和确认中的方案 | 可以持续迭代 |
| `iterations/current.md` | 当前唯一正式迭代指针 | 只由实施迭代更新 |
| `iterations/candidates/` | 产品设计前的未确认候选唯一活动入口 | 只保留 pending/DRAFT；产品 task 转化为方案后立即归档 |
| `iterations/history/candidates/` | 已转化或已关闭候选的历史归档 | 只用于来源追溯，不参与当前版本判断 |
| `iterations/roadmap.md` | 历史参考文件 | 不再作为活动事实源；当前只读取 `candidates/`、`current.md` 和 `history/` |
| `iterations/history/` | 已完成版本的计划和结果 | 只追加，不回写 |
| `operations/` | 内容运营合同与来源覆盖规则 | 不作为产品问题或版本入口 |
| `upstream/` | career、Robotaxi 等上游事实快照与同步说明 | 按上游同步规则修改 |
| `qa/` | 按版本保存的设计验证结论和必要证据 | 完成验证时追加 |

## 根目录保留原则

以下文件留在根目录，因为它们需要被人或脚本直接发现和执行：

- `README.md`
- `AGENTS.md`
- `VERSION.md`
- `start-xingbuild.command`
- `publish-xingbuild.command`
- `package.json` 与 `package-lock.json`
- `index.html`
- `vite.config.mjs`
- `edgeone.json`

页面实现只进入 `src/`；构建与发布辅助进入 `scripts/`；Worker 和兼容测试分别进入 `worker/` 与 `tests/`。

## 当前唯一产品与视觉基线

- [xingbuild 网站产品架构与视觉系统总案](product/xingbuild%20网站产品架构与视觉系统总案.md)
- 版本当前状态只看 [当前迭代](iterations/current.md)；未确认候选只看 `iterations/candidates/`；候选转化/关闭证据只看 `iterations/history/candidates/`；完成版本结果只看 `iterations/history/`。

产品与视觉 task、Engineering 和内容 task 都必须先读取这份主文档。它是当前唯一的产品/视觉入口；旧版本方案不能与本文并列作为现行事实源。

## 历史设计与未确认草案

- `design/v*.md`：对应版本的历史方案，保留用于追溯，不指导当前实现。
- `product/个人网站定位、内容与信息架构设计 v1.0.md`：早期产品定位方案，保留用于追溯，不指导当前实现。
- [网站出版体系、品牌与视觉方向](explorations/网站出版体系、品牌与视觉方向.md)：早期探索，保留作为来源记录。
- `iterations/candidates/`：未确认或等待产品设计的候选；只允许 `pending`/DRAFT。候选一旦转为正式设计方案或被关闭，立即移入 `iterations/history/candidates/`，不另设版本路线图。
- [v0.20.0 页面定义注册与组合渲染方案](design/v0.20.0%20页面定义注册与组合渲染方案.md)：已完成版本方案，结果见 `iterations/history/v0.20.0.md`。
- `design/v*.md`：已完成或已确认的版本方案，只用于追溯和当前版本实施；当前产品/视觉基准仍以产品总案为准。
- `operations/` 下的运行问题记录已归档；产品与工程优化只读取活动 `iterations/candidates/` 下的候选文件，历史候选只用于追溯。
- `operations/` 仅保存内容发布合同、来源覆盖合同和历史证据；不参与版本状态判断。
- `design/assets/`：被历史设计或 QA 引用的证据资产，不能当作当前设计源。

## Publish 命令边界

`publish-xingbuild.command`、`publish-content.command`、`publish-article.command` 和 `publish-practice.command` 只发布已完成产品/视觉验收的现有 local commit/tag；不自动递增版本、不修改版本记录、不 commit/tag。入口脚本携带用户明确的 `--authorize-publish` 动作，直接调用统一脚本时必须显式传入该参数或 `XINGBUILD_PUBLISH_AUTHORIZATION=confirmed`。发布失败只报告未发布或部分完成，不生成完成历史。详细合同见 [迭代与发布规则](rules/iteration-and-release.md)。

构建只读消费已提交的 `src/generated/` 与 `public/` 生成物，不调用会回写 tracked 输出的生成器。`architecture:views`、`framework:data`、`framework:layout`、`article:figures` 仅在产品方案变更后、local commit 前显式运行并将生成物一并提交。
