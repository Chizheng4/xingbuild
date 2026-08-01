# 当前迭代

## 当前唯一版本：`v0.22.0`

状态：已完成实现、产品/视觉验收、提交/tag、推送、部署与公网验收；当前没有下一正式产品版本。此文件暂保留上一已发布版本作为唯一基线，直到下一方案正式进入 current。
正式方案：[`docs/design/v0.22.0 企业经营体系多视图架构阅读能力方案.md`](../design/v0.22.0%20企业经营体系多视图架构阅读能力方案.md)
候选 ID：`XBUILD-ARCH-VIEWS-001`

### 目标

把企业经营体系从文章中的单张静态图升级为同源的 LikeC4 多视图架构阅读能力：总览、业务架构、数字化实现、B 端产品架构四个视图，支持清晰进入、返回、焦点恢复和移动端分层/文本降级。

### 本版本范围

- 企业经营体系文章内的架构视图入口与受控 LikeC4 多视图投影；
- 四个已确认视图及其层级、边界、关系标签和返回关系；
- 桌面/紧凑/手机的可读投影、键盘/触控交互、失败文本降级；
- 模型来源校验、生成失败清理旧产物、真实六档响应式验收；
- 保留 RichDocument、ReadingTOC、Observation rail、Header/Footer、旧链接降级和独立内容发布合同。

### 明确不做

- 不实现通用 `CapabilityHost / VisualizationHost` 全能力平台；
- 不嵌入或修改 Robotaxi，不处理登录态、系统操作或访问记录；
- 不新增 Mermaid/D2 adapter，不重做 B 端产品主页，不改变 Observation/Practice schema；
- 不改全站主题、一级导航、文章结构、内容发布命令或产品内容事实；
- 不把未确认候选、内容 draft 或无关工作区文件纳入本版本。

### 验收入口

- 产品/视觉：方案中的产品、视觉、响应式和返回焦点合同；
- Engineering：LikeC4 validate/codegen/runtime、模型来源 hash、失败清理、全量 `npm run release:check`；
- 发布：仅在本版本完成产品验收、精确收口、`release:preflight` 通过后，进入 push、EdgeOne 和公网验收；
- 内容：Observation、Article、Practice 的日常发布继续按独立合同执行，不等待或夹带本版本。

## 已发布基线

- 产品版本：`v0.22.0`
- commit/tag：`7ad9edd0e3cc4888bbaece0ddeace0cc32bf270c` / `v0.22.0`
- 生产：`https://xingbuild.top/`
- EdgeOne deployment：`dpslfti62ltf`

## 在途变更登记

当前没有超出 v0.22.0 正式合同的在途优化。发现相邻问题时只在本表登记，不在 Engineering 工作区顺手修复：

| ID | 发现事实/证据 | 分类 | 当前决定 | 范围/验收影响 | 责任与下一动作 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| XBUILD-V022-VIS-001 | 产品独立验收发现桌面 LikeC4 默认主题和舞台几何不符合视觉合同 | P1 视觉/可读性阻断 | 已在 v0.22 同版本修订并通过独立复验 | 暖色节点/实线关系；六档无横向溢出；移动端同源文本降级；不改模型语义 | 已完成并随 v0.22 发布 | closed |

登记规则：P0/P1 只有在补充本方案和验收后才可 `adopt-current`；需要新能力的事项登记为 `defer-next` 并进入 `docs/iterations/candidates/`；内容/运营问题移交 `docs/operations/内容运营与发布问题清单.md`，不得改变本版本。

## 版本完成后的下一步

v0.22.0 已完成实现、专业验收、commit/tag、push、部署和公网验收；归档记录见 `history/v0.22.0.md`。候选 `XBUILD-CAPABILITY-001` 仍需基于真实使用证据单独评估，不自动开启 v0.23.0。
