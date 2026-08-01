# xingbuild 文档索引

这个目录保存网站的长期规则、产品设计、上游事实、迭代历史和验证证据。根目录只保留日常启动、构建、发布和版本识别所需的直接入口。

## 目录责任

| 目录 | 责任 | 是否可直接修改 |
| --- | --- | --- |
| `rules/` | 迭代、发布和工程协作规则 | 规则变化时修改 |
| `product/` | 已形成基线的产品定位与内容模型 | 经确认后修改 |
| `design/` | 已确认的视觉与交互原则 | 经确认后修改 |
| `explorations/` | 尚在分析、比较和确认中的方案 | 可以持续迭代 |
| `iterations/current.md` | 当前唯一正式迭代指针 | 只由实施迭代更新 |
| `iterations/roadmap.md` | 已确认方向的版本队列和跨版本协作合同 | 产品方案确认后更新，不代表当前实现 |
| `iterations/history/` | 已完成版本的计划和结果 | 只追加，不回写 |
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
- [产品能力迭代路线图与版本计划](iterations/roadmap.md)

产品与视觉 task、Engineering 和内容 task 都必须先读取这份主文档。它是当前唯一的产品/视觉入口；旧版本方案不能与本文并列作为现行事实源。

## 历史设计与未确认草案

- `design/v*.md`：对应版本的历史方案，保留用于追溯，不指导当前实现。
- `product/个人网站定位、内容与信息架构设计 v1.0.md`：早期产品定位方案，保留用于追溯，不指导当前实现。
- [网站出版体系、品牌与视觉方向](explorations/网站出版体系、品牌与视觉方向.md)：早期探索，保留作为来源记录。
- [x.ai 式产品能力展示与视觉表达迭代方案（DRAFT）](design/DRAFT-x.ai式产品能力展示与视觉表达迭代方案.md)：候选能力细节；版本先后和进入条件以路线图为准，确认前不得进入 `current.md` 或 Engineering。
- [v0.21.0 Practice 内容独立发布能力方案](design/v0.21.0%20Practice内容独立发布能力方案.md)：当前已确认实施方案；具体实现状态以 `current.md` 和 Engineering 回传为准。
- [v0.20.0 页面定义注册与组合渲染方案](design/v0.20.0%20页面定义注册与组合渲染方案.md)：已完成版本方案，结果见 `iterations/history/v0.20.0.md`。
- [企业经营体系架构视图与文章图形表达方案（DRAFT）](design/DRAFT-企业经营体系架构视图与文章图形表达方案.md)：跨 task 边界尚未完全收口前保留；确认后应将有效决策归入主文档并删除或归档。
- `design/assets/`：被历史设计或 QA 引用的证据资产，不能当作当前设计源。
