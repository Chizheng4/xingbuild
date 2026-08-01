# 当前迭代

## 当前目标版本

`v0.20.0`

## 主题

页面定义注册与既有页面组合渲染能力

## 事实源

- [`docs/product/xingbuild 网站产品架构与视觉系统总案.md`](../product/xingbuild%20网站产品架构与视觉系统总案.md)
- [`docs/iterations/roadmap.md`](roadmap.md)
- [`docs/design/v0.20.0 页面定义注册与组合渲染方案.md`](../design/v0.20.0%20页面定义注册与组合渲染方案.md)
- [`docs/rules/iteration-and-release.md`](../rules/iteration-and-release.md)
- 已发布基线 [`docs/iterations/history/v0.19.0.md`](history/v0.19.0.md)

## 目标

- 建立受控 `PageDefinition` registry（页面注册表）；
- 用共享 renderer 承接 `HomeComposition`、`ShowcaseComposition`、`CollectionComposition`、`ReadingComposition`；
- 以 `/about` 作为首个低风险真实迁移页面；
- 以同组合 fixture 证明新增页面只需页面定义和内容引用，不新增页面 JSX、页面 CSS 或重复路由分支；
- 保持现有 URL、内容对象、视觉 token、返回导航和内容发布边界不变。

## 明确不做

- 不实现 `VisualizationHost / CapabilityHost`、LikeC4 原生 runtime 或自由画布；
- 不嵌入 Robotaxi 独立系统，不改变登录、权限、访问记录或素材边界；
- 不迁移全部历史页面，不删除旧实现，不修改 Observation/Article schema；
- 不改变品牌色、主题、Header、Footer、一级导航或发布命令；不提前开启 `v0.21.0`。`v0.20.0` 的标准版本记录、commit/tag 和收口检查属于本版本交付；
- 不允许内容 task 提交 JSX、CSS、节点坐标、关系路径或任意 renderer 配置。

## Engineering 范围

- 页面定义 schema、唯一性/路由/内容引用校验；
- 共享 composition renderer 和必要路由适配；
- `/about` 迁移与同组合 fixture；
- 按版本规则同步 `package.json`、`package-lock.json`、`VERSION.md` 到 `v0.20.0`；
- 结构、响应式、键盘/tap、返回、直接访问和无空区域验证；
- 与本版本范围对应的自动测试和验收证据。

## 验收

- 既有主要 URL 和内容对象无回归；
- 新增同组合页面不新增页面 JSX、页面 CSS 或专用路由分支；
- schema 无效、路由冲突、内容引用不存在时硬失败，不静默换组合；
- 桌面、紧凑宽度、手机无横向溢出、无异常内部滚动、对象归属清晰；
- hover、focus、click、tap 和键盘操作不改变页面整体几何；
- `npm run release:check`、项目专项测试、closeout、preflight，以及后续 commit/tag、push、部署和公网验收分别报告。

## 当前状态

产品方案已确认并进入唯一 `current.md`；Engineering 实现、本地自动与真实 QA、产品/视觉独立复验、closeout、commit 和 `v0.20.0` annotated tag 已完成。当前仍未 push、部署或公网验收；发布前必须先满足 `release:preflight` 的工作区与版本门禁。

## 在途变更登记

本区是当前 `v0.20.0` 进行中发现新优化的唯一登记入口。没有条目时表示当前没有待决新增优化；不得在 task 对话中另建私有 backlog。

### 登记模板

```text
ID：V020-OPT-xxx
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
