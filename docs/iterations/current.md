# 当前迭代

## 当前唯一版本：`v0.23.0`

状态：已完成实现、验证、收口、发布与公网验收；当前仅作为最近发布基线保留。没有下一项已确认候选时，不自动创建新版本。
发布授权：已完成直接上线；下一版本由 current 明确标记“直接上线”或“仅本地”。
正式方案：[`docs/design/v0.23.0 统一能力展示控件与可组合表达方案.md`](../design/v0.23.0%20统一能力展示控件与可组合表达方案.md)
候选 ID：`XBUILD-CAPABILITY-001`

### 目标

把现有 ShowcaseLayout、RichDocument、SystemStage 和图形/媒体入口收敛为可组合的能力展示控件，使页面和长文可以通过内容声明组合图片、视频、图形和受控互动空间，而不为具体运营内容反复开发页面。

### 本版本范围

- CapabilityStage/VisualizationHost 的公开能力合同与声明式入口；
- 统一 idle/active/selected/result/error/fallback 状态和键盘/触控语义；
- 图片、视频、图形和受控互动空间的容器自适应与内容投影自适应；
- 在现有文章图形和 Showcase/SystemStage 上建立兼容性 fixture，不固定具体运营内容；
- 保留现有 IA、暖色视觉、RichDocument、Observation rail、Header/Footer 和独立内容发布合同。

### 明确不做

- 不固定某一篇文章或 Robotaxi 模块的最终公开内容；
- 不修改 Robotaxi 上游工程、登录态、系统状态或 `/embed` 边界；
- 不改变 Observation/Practice schema、全站主题、一级导航或内容发布合同；
- 不在本版本一次性实现所有 renderer、所有 LikeC4 视图或完整全能力平台；
- 不把候选 DRAFT、内容 draft 或无关工作区文件纳入本版本。

### 验收入口

- 产品/视觉：方案中的能力空间、组合、视觉、响应式和状态合同；
- Engineering：host/adapter/source-driven 入口、状态机、失败降级、六档真实响应式与全量 `npm run release:check`；
- 发布：仅在本版本完成产品验收、精确收口、`release:preflight` 通过后，进入 push、EdgeOne 和公网验收；
- 内容：Observation、Article、Practice 的日常发布继续按独立合同执行，不等待或夹带本版本。

## 本版本发布结果

- 产品版本：`v0.23.0`
- commit/tag：`3d2f90c39ac5952aa122d1d4ee6aacd117b65e28` / `v0.23.0`
- 生产：`https://xingbuild.top/`
- EdgeOne deployment：`dp9oxdxvo4a4`
- 本地与公网：六档响应式、点击/Enter/Space 状态交互、既有页面回归与 `release:check` 均通过。

## 已发布基线

- 产品版本：`v0.23.0`
- commit/tag：`3d2f90c39ac5952aa122d1d4ee6aacd117b65e28` / `v0.23.0`
- 生产：`https://xingbuild.top/`
- EdgeOne deployment：`dp9oxdxvo4a4`

## 当前状态边界

当前没有已确认的产品版本变更。任何新问题或优化点必须先进入 `docs/iterations/candidates/<candidate-id>.md`，由产品与视觉 task 评审；候选确认并写入 current 前，Engineering 不得实现。日常内容与 Ops 运行证据只保留在被忽略的 `.content-workspace/ops/`，不改变本版本。

## 版本完成后的下一步

v0.23.0 已完成并发布，结果见 `history/v0.23.0.md`。当前没有 `confirmed` 候选，因此产品版本流水线在此停止；内容运营继续按独立合同运行。下一次启动只检查 `docs/iterations/candidates/`，不读取 roadmap 或 task 历史。
