# xingbuild 产品能力迭代路线图与版本计划

> 状态：正式的规划与排队合同，不等于当前迭代授权。  
> 责任：产品与视觉 task 维护；Engineering 只实现已经确认并进入 `current.md` 的一个版本。  
> 更新时间：2026-08-01  
> 产品/视觉事实源：[`docs/product/xingbuild 网站产品架构与视觉系统总案.md`](../product/xingbuild%20网站产品架构与视觉系统总案.md)  
> 迭代与发布规则：[`docs/rules/iteration-and-release.md`](../rules/iteration-and-release.md)

## 1. 这份路线图解决什么问题

路线图用于把“当前正在做的版本”“已经确认但尚未开始的版本”“未来可能需要的能力”和“内容运营工作”分开。它不是第二份产品架构文档，也不替代 `docs/iterations/current.md`。

唯一关系是：

```text
产品/视觉总案：定义产品应当是什么
路线图：定义先做什么、后做什么、何时不做
current.md：定义现在只做哪一个版本
history/v{version}.md：记录已经完成了什么和学到了什么
内容/运营合同：定义日常如何持续使用已完成能力
```

任何新需求先进入分类和排队，不得直接变成 Engineering 的临时任务；只有当前版本完成串行收口后，下一项才可以进入 `current.md`。

## 2. 长期目标与不变原则

长期目标是：

> 通过一次工程化能力建设，让页面、内容和视觉表达可以持续复用；内容运营负责填充和更新，产品与 Engineering 只在共享能力真正变化时介入。

固定原则：

1. 一个项目同一时间只有一个正在实施的产品版本。
2. 先用现有能力产生真实内容和反馈，再决定是否升级能力，不为假设提前建大平台。
3. 同一页面组合的新内容不触发工程迭代；新的页面组合、内容 block、互动模型或 renderer 才触发产品版本。
4. 每个版本只有一个明确的主要问题、一个最小可交付能力和一份可执行验收合同。
5. 新需求如果不能在当前目标和验收内完成，登记为后续候选，不夹带、不隐性扩大范围。
6. 版本方案是完整事实源；task 消息只传方案 ID、文件路径、commit/证据、阻断 ID 和下一动作，不传长历史。
7. 内容发布始终独立于产品版本；内容 task 不修改本路线图、产品总案、代码、版本或发布规则。

## 3. 当前基线

### 3.1 已完成基线：`v0.19.0`

`v0.19.0` 已完成并公开验收。它建立了常青长文、受控 `RichDocument`、目录和 source-driven figure；图形由锁定的 Mermaid/LikeC4 adapter 在内容准备阶段生成 desktop/mobile SVG。它解决的是“企业经营体系可以作为可更新长文发布”，不是通用页面注册平台或完整互动架构浏览器。

完整结果见 [`docs/iterations/history/v0.19.0.md`](history/v0.19.0.md)。

### 3.2 当前可直接运营的能力

- Brief、Article、Practice 和 About 使用既有内容对象和页面母版；
- 文章可以增加章节、来源和既有类型图形，不改页面组件；
- 内容发布保持产品版本/tag 不变；
- 现有页面继续使用当前稳定的路由和共享视觉系统。

### 3.3 已完成基线：`v0.20.0`

`v0.20.0` 已完成并公开验收。它建立了受控 `PageDefinition` registry 和共享页面组合渲染，证明同组合的新页面可以通过定义和内容引用接入。完整结果见 [`docs/iterations/history/v0.20.0.md`](history/v0.20.0.md)。

### 3.4 尚未兑现的产品合同

产品总案已经确认 `PageDefinition → PageComposition → Content Objects + CapabilityHost`，但目前主要仍是产品合同，不应误报为已经完成的动态页面平台。下一步要用一个小版本把它变成可验证的最小运行能力。

## 4. 版本队列

队列中的版本都是候选，除非明确写入 `docs/iterations/current.md`，否则不得修改代码、版本、依赖或发布状态。

### `v0.20.0` 已完成版本：页面定义注册与组合渲染

正式实施方案：[`v0.20.0 页面定义注册与组合渲染方案`](../design/v0.20.0%20页面定义注册与组合渲染方案.md)。该文件已从 DRAFT 转为正式方案；未来未确认方案必须保留明确的 `DRAFT` 状态并不得进入主线版本提交。

**要解决的问题**：让同一页面组合的新页面通过页面定义和内容对象接入，而不是新增页面 JSX、页面 CSS 和重复路由逻辑。

**最小范围**：

- 建立受控 `PageDefinition` registry（页面注册表）；
- 用一个共享 renderer（组合渲染器）承接已有 `HomeComposition`、`ShowcaseComposition`、`CollectionComposition`、`ReadingComposition`；
- 迁移一个真实、低风险页面作为证明；
- 证明新增一个同组合页面只需页面定义和内容对象；
- 保留现有 URL、内容 schema、Header、Footer、返回导航和发布命令。

**明确不做**：

- 不实现完整 `VisualizationHost`；
- 不引入 LikeC4 原生多视图运行时；
- 不嵌入 Robotaxi 独立系统；
- 不重做全站视觉、不改 Observation schema、不迁移所有历史页面；
- 不把任意 JSX 或任意 CSS 暴露给内容 task。

**结果**：已完成并公开验收；后续内容和同组合页面继续复用现有能力，不因新增同类内容重开本版本。

**验收核心**：新增同组合页面不改页面组件和页面 CSS；桌面/紧凑/手机结构一致；关闭可选区域不留空占位；内容发布仍不改产品版本。

### `v0.21.0` 已完成版本：Practice 内容独立发布能力

正式实施方案：[`v0.21.0 Practice内容独立发布能力方案`](../design/v0.21.0%20Practice内容独立发布能力方案.md)。

**要解决的问题**：让已批准的 B 端 Practice 内容可以按单一目标独立检查、提交、push、部署和公网验收，不再与产品版本或页面工程绑定。

**最小范围**：

- `practice:scope-check -- --id <practiceId>` 目标文件与版本门禁；
- `publish-practice.command --id <practiceId>` 内容专用发布闭环；
- 复用现有 Practice schema、媒体 manifest、审批状态、文件/hash 和页面投影；
- 保持产品版本/tag、页面结构、视觉系统和 Robotaxi 独立系统不变。

**明确不做**：`CapabilityHost / VisualizationHost`、LikeC4 多视图、Robotaxi embed、页面重构、Practice schema 扩展和批量发布。

**结果**：已完成并公开验收。建立了单一 Practice id 的独立检查、提交、push、部署和公网验收能力；产品版本/tag、页面结构、视觉系统和 Robotaxi 独立系统均未被内容发布改变。完整结果见 [`docs/iterations/history/v0.21.0.md`](history/v0.21.0.md)。

**发布结果**：commit/tag 为 `6493f43a7504a78113f2cd0c5dff2b2894a24e34` / `v0.21.0`；GitHub、EdgeOne 和公网 release/content manifest 已对齐；当前没有公开 Practice module，未执行 Practice 内容发布。

### `v0.22.0` 当前版本：企业经营体系多视图架构阅读能力

正式方案：[`v0.22.0 企业经营体系多视图架构阅读能力方案`](../design/v0.22.0%20企业经营体系多视图架构阅读能力方案.md)。

**要解决的问题**：企业经营体系此前被压成一张静态图，层级、边界、关系类型和下钻路径不可读；本版本用同一语义源驱动 LikeC4 多视图阅读能力。

**最小范围**：

- 企业经营体系文章内的架构视图入口；
- Landscape、Business、Digital、Product 四个视图；
- 只读进入/返回、焦点恢复、键盘/触控、移动分层/文本降级；
- LikeC4 validate/codegen/runtime、失败清理旧产物、六档响应式验收。

**明确不做**：通用 CapabilityHost 全平台、Robotaxi embed/登录、Mermaid/D2 新 adapter、B 端主页重构、Observation/Practice 内容模型或全站主题改变。

**状态**：已写入 `docs/iterations/current.md`，Engineering 只按正式方案实现。版本完成后才创建 history 并决定后续候选。

### `v0.23.0+` 后续候选：统一能力展示与受控互动

只有当 `v0.21.0` 的真实 Practice 内容继续证明需要新的展示能力时，才分别评估：

- `CapabilityHost / VisualizationHost` 统一图片、视频、静态图形和受控互动空间；
- LikeC4 多视图浏览能力；
- Robotaxi 受控 `/embed` 展示边界；
- 更多 Mermaid/LikeC4 adapter 或其他开源 renderer；
- 更复杂的对象状态、流程和生命周期互动。

每项能力独立形成 DRAFT、独立验收和独立版本，不打包成“全能力平台”大版本。

当前候选登记（均未进入 `current.md`）：

| 候选 ID | 文件 | 状态 | 进入条件 |
| --- | --- | --- | --- |
| `XBUILD-CAPABILITY-001` | [`iterations/candidates/DRAFT-x.ai式产品能力展示与视觉表达迭代方案.md`](candidates/DRAFT-x.ai式产品能力展示与视觉表达迭代方案.md) | `DRAFT` | v0.22.0 真实使用证明需要统一图片、视频、图形和受控互动展示控件 |
| `XBUILD-ARCH-VIEWS-001` | [`design/v0.22.0 企业经营体系多视图架构阅读能力方案.md`](../design/v0.22.0%20企业经营体系多视图架构阅读能力方案.md) | `selected / current` | 已转正式方案并写入 current；完成 v0.22.0 后归档 |

## 5. 版本排队与文档职责

路线图只记录版本队列、依赖、进入条件和产品侧决策，不复制项目通用工作流。新需求分流、问题登记、DRAFT 门禁、跨 task 交接、串行执行、验证、提交/tag、发布和资源规则，统一以 [`docs/rules/iteration-and-release.md`](../rules/iteration-and-release.md) 为准。

xingbuild 的产品侧分流只保留以下判断：

| 变化 | 路线图处理 |
| --- | --- |
| 现有内容对象或同类型图形增加 | 不进入版本队列，按内容合同运营 |
| 现有页面组合的新页面 | `v0.20.0` 注册能力完成后按 `PageDefinition` 接入 |
| 新页面组合、block、共享视觉或 renderer | 形成独立 DRAFT，排入候选版本 |
| 上游事实、采集、审核或发布问题 | 留在对应上游/运营问题清单 |

完整版本文档包、检查点长度和交接格式不在路线图重复定义；task 消息只传文档路径和当前检查点，完整合同留在版本方案、current、QA 和 history 中。

## 6. 当前版本的唯一落点

产品版本正式开始时，唯一写入 [`docs/iterations/current.md`](current.md)；当前版本中新发现的优化也只登记在该文件的“在途变更登记”区。完成后新增 `history/v{版本号}.md` 并清空当前指针。路线图不替代 current，也不记录实现中的临时状态。

## 7. 通用工作流唯一来源

本路线图不复制串行交付链、事件驱动协作、等待/唤醒限制或发布门禁。上述内容只维护在项目规则文件，避免产品路线图、AGENTS、版本方案各自形成不同流程。

## 8. 运营与产品的边界入口

内容运营继续按产品总案和项目规则中的 Observation/Article 合同执行；路线图只在真实重复需求证明需要新页面组合或共享能力时增加候选版本。产品能力完成后，内容 task 不需要等待产品 task 参与日常写稿或发布。

## 9. 当前状态与下一动作

- 当前公开基线：`v0.21.0`；正在实施的唯一版本：`v0.22.0` 企业经营体系多视图架构阅读能力。
- `XBUILD-CAPABILITY-001` 仍是候选，不因 v0.22.0 自动进入 Engineering；Robotaxi `/embed` 和更多 renderer 也不在当前版本。
- 内容运营继续使用现有 Brief/Article 合同，不因 `v0.21.0` 改变产品版本或发布流程；Practice 内容可在批准后使用已发布的独立命令。
