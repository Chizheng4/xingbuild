# 当前迭代

## 当前目标版本

`v0.21.0`

## 主题

Practice 内容独立检查、提交与发布能力

## 唯一方案与事实源

- [`docs/design/v0.21.0 Practice内容独立发布能力方案.md`](../design/v0.21.0%20Practice内容独立发布能力方案.md)
- [`docs/product/xingbuild 网站产品架构与视觉系统总案.md`](../product/xingbuild%20网站产品架构与视觉系统总案.md)
- [`docs/iterations/roadmap.md`](roadmap.md)
- [`docs/rules/iteration-and-release.md`](../rules/iteration-and-release.md)
- 已发布基线 [`docs/iterations/history/v0.20.0.md`](history/v0.20.0.md)

## 目标

- 为单一 Practice id 提供 `practice:scope-check` 和 `publish-practice.command`；
- 复用现有 Practice schema、媒体 lifecycle、文件/hash 校验和页面投影；
- 让内容 task 可在不改产品版本/tag、页面代码或视觉系统的前提下独立发布 B 端 Practice 内容；
- 让失败、重试、scope、生产 SHA 和公网目标均可诊断、可复核。

## 明确不做

- 不实现 `CapabilityHost / VisualizationHost`、LikeC4 多视图、Mermaid 新 adapter 或自由画布；
- 不修改 `/products`、首页、Practice 页面结构、视觉 token、响应式布局或 `PageDefinition`；
- 不嵌入 Robotaxi、改变登录/权限/访问记录或发布 Robotaxi 独立网站；
- 不扩展 Practice schema，不支持批量 Practice，不修改 Observation/Article/About 发布合同；
- 不由命令选题、写稿、事实审核、批准媒体或修改无关 workspace；
- 不混入当前工作区已有的版本外 docs 修改或两个未确认 DRAFT。

## Engineering 允许范围

- `package.json`/`package-lock.json` 中本版本命令入口（不升级无关依赖）；
- `VERSION.md` 与 `package.json` 的 `0.21.0` 产品版本记录；Practice 内容发布命令不得修改产品版本；
- `scripts/practice-scope-check.mjs`；
- `publish-practice.command`；
- `scripts/verify-practice-release.mjs`；
- `scripts/lib/practice-content.mjs` 的复用型校验扩展；
- 对应测试、Practice 发布规则段落、QA 与本版本文档。

## 禁止范围

- `src/` 页面、组件、CSS、视觉 token、路由和 PageDefinition 组合；
- Robotaxi 业务事实、manifest 审批结论、公开媒体内容和独立 Robotaxi 仓库；
- Observation、Article、About、Practice 内容发布命令中的产品版本/tag、EdgeOne 项目配置、未确认 DRAFT；产品版本收口所需版本文件只按本方案更新；
- 任何与目标 Practice 无关的代码、内容、规则、worker、发布配置或 workspace 文件。

## 验收

- 正常目标 Practice 通过 `practice:check`、`practice:scope-check`、`npm run build`、`npm run test:sites`；
- schema、媒体生命周期、审批状态、文件存在性、hash 和目标提交范围的错误均硬失败；
- `./publish-practice.command --id <practiceId>` 不创建 commit/tag，不改变产品版本，支持同一 HEAD 的部署/公网重试；
- 1440/768/390 的 `/products`、首页 Practice 投影无横向溢出、console error/warning=0，读者不见治理字段；
- GitHub、EdgeOne、release/content manifest 和目标 Practice 公网内容同 SHA；
- 实现、验证、commit/tag、push、部署、公网验收分别回传。

## 当前状态

产品方案已确认，Engineering 尚未开始实现。当前主线仍为已发布 `v0.20.0`；本版本只在本方案范围内推进。

## 在途变更登记

本区是 `v0.21.0` 进行中发现新优化的唯一入口。没有条目表示当前没有待决新增优化；不得在 task 对话中另建私有 backlog。

### 登记模板

```text
ID：V021-OPT-xxx
发现时间：YYYY-MM-DD
发现事实/证据：路径或可复核说明
问题与用户影响：
分类/优先级：P0 当前阻断 | P1 当前范围内 | P2 后续候选 | 内容/运营
当前决定：adopt-current | defer-next | route-content-ops | reject | closed
是否改变当前范围/验收：
责任 task：
下一动作：
决定时间：
```

### 当前登记

| ID | 发现/证据 | 分类 | 当前决定 | 范围/验收影响 | 责任与下一动作 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| — | 当前暂无新增优化登记 | — | — | — | 发现后先按项目规则登记 | open |

登记后必须遵循项目规则的“当前版本进行中的新优化”合同：只有 `adopt-current` 才能在补充当前方案和验收后进入本版本；`defer-next` 必须指向独立 DRAFT/路线图条目；内容/运营问题移交对应合同。版本收口前不得留下未解释条目。
