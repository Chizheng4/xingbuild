# 当前迭代

## 当前唯一版本：`v0.23.0`

状态：产品方案已正式纳入，用户已授权自动执行；只允许这一版本进入实现、验证、收口与发布。
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

## 已发布基线

- 产品版本：`v0.22.0`
- commit/tag：`7ad9edd0e3cc4888bbaece0ddeace0cc32bf270c` / `v0.22.0`
- 生产：`https://xingbuild.top/`
- EdgeOne deployment：`dpslfti62ltf`

## 在途变更登记

当前没有超出 v0.23.0 正式合同的在途优化。发现相邻问题时只在本表登记，不在 Engineering 工作区顺手修复：

| ID | 发现事实/证据 | 分类 | 当前决定 | 范围/验收影响 | 责任与下一动作 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| — | 当前暂无新增登记 | — | — | — | 发现后按本版本合同登记 | open |

登记规则：P0/P1 只有在补充本方案和验收后才可 `adopt-current`；需要新能力的事项登记为 `defer-next` 并进入 `docs/iterations/candidates/`；内容/运营问题移交 `docs/operations/内容运营与发布问题清单.md`，不得改变本版本。

## 版本完成后的下一步

v0.22.0 已完成并归档；本版本 v0.23.0 聚焦可组合能力展示控件，不固定具体运营内容。完成后创建 `history/v0.23.0.md`，再继续清点下一批已确认候选。
