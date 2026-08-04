# XBUILD-VISUAL-EVALUATION-001：网站视觉评估与升级方案（DRAFT）

状态：`DRAFT` / `pending`  
责任：产品与视觉  
用途：沉淀 xingbuild.top 当前视觉评估、工具调研和后续产品版本计划。本文未进入 `current.md`，不能授权 Engineering 修改代码。

## 1. 问题定义

当前问题不是单一颜色、字号或 CSS 缺陷，而是：

```text
网站有真实内容和作品
→ 作品视觉证据没有稳定进入公网页面
→ 首页和产品页退化为文字说明
→ 内容层级、主次关系和行动路径不足
→ 网站看起来像一份克制的说明文档，而不是高级的产品作品集
```

目标不是增加装饰，而是让真实作品、方法、证据和观察形成可阅读、可验证、可持续的视觉系统。

推荐方向：**证据驱动的编辑型产品作品集**。

## 2. 当前证据

### 2.1 公网运行证据

已检查 `https://xingbuild.top/`、`/products`、`/business-observations`、`/about`、`/observations`：

- 桌面运行窗口约 `1512px`；手机运行窗口约 `390px`。
- 首页有 4 个 Robotaxi 模块，但运行时 `img` 数为 `0`、`video` 数为 `0`，没有 `SystemStage`。
- 首页的 Robotaxi 模块全部退化为文字说明；企业经营体系只有标题、摘要和文章入口。
- 观察 rail 使用完整正文和来源，视觉密度高于主作品区域。
- 手机页面无横向溢出；首页 H1、H2、H3 语义结构存在；本次浏览未见控制台错误。
- 键盘完整路径、200% 缩放、对比度测量、读屏和 reduced-motion 尚未完成验证。

### 2.2 源码证据

- 首页只组合定位语、Practice、企业经营体系和 Observation rail：`src/pages/HomePage.jsx:16-21`。
- Practice 缺少媒体时只渲染说明，不渲染舞台或 action：`src/components/practice/PracticePage.jsx:18-26`。
- 首页两栏固定为主区和观察 rail：`src/styles/layout.css:49-55`、`src/styles/tokens.css:63-83`。
- Observation rail 卡片包含完整正文、日期、维度和来源：`src/styles/components.css:316-353`、`src/components/observations/Briefs.jsx:6-29`。
- 现行视觉基线要求暖白、编辑式字体、克制强调色和真实内容对象：`docs/product/xingbuild 网站产品架构与视觉系统总案.md:413-504`。

### 2.3 重要边界

`.content-workspace/content/media/robotaxi/manifest.json` 中存在已批准的 Robotaxi 视频声明，但本地 ignored 内容文件和 manifest 不能直接证明公网媒体已经完成独立内容 transport。必须先核对内容发布证据，不得用视觉改造掩盖媒体发布缺口。

当前 `v0.24.27` 是内容发布状态机迭代，明确不包含 UI 改造。本候选只能在当前版本收口后进入新的产品/视觉迭代。

## 3. 视觉评估结论

| 优先级 | 问题 | 根因 | 影响 |
| --- | --- | --- | --- |
| HIGH | 核心作品没有视觉证明 | 媒体/能力展示没有稳定进入公网投影 | 读者无法快速理解作品质量和真实边界 |
| MEDIUM | 首页模块缺少进入动作 | 缺媒体时 `PracticeModule` 同时失去 stage 和 action | 作品入口被隐藏，主路径依赖顶部导航 |
| MEDIUM | 观察 rail 与主作品竞争注意力 | rail 使用完整内容和高密度表面，主作品没有同等视觉重量 | 页面主角不明确 |
| MEDIUM | 极简层级不足 | 颜色和字体方向正确，但对象之间缺少可见证据和强弱差异 | 克制被读成空、薄、未完成 |
| LOW | 现存通用 card/shadow token 可能与当前产品视觉基线不一致 | 历史卡片能力仍在样式层保留 | 未来修改时容易重新引入泛卡片化 |

## 4. 目标体验

网站应让新读者在约 30 秒内回答：

1. Xing 是谁，解决什么类型的问题；
2. 哪个作品最能证明能力；
3. 作品是模拟、演示、真实使用还是公开结果；
4. 企业经营体系和 Robotaxi 之间是什么关系；
5. 下一步应该进入作品、阅读方法，还是继续观察。

视觉原则：

- 用真实媒体、图形和交互建立高级感，不用装饰隐喻；
- 保留暖白、墨色、赭色和中文编辑式字体；
- 一页只有一个主视觉主角；
- 内容对象遵循 `Identity → Proposition → Proof → Action`；
- 观察是证据流，不抢占作品主叙事；
- 所有视觉增强都必须能在源码、运行和事实边界中验证。

## 5. 推荐信息与视觉结构

### 5.1 首页

```text
身份与定位
  ↓
Hero 判断
  ↓
主作品：Robotaxi
  ├─ 视频或受控互动舞台
  ├─ 问题定义与边界
  └─ 进入产品
  ↓
方法作品：企业经营体系
  ├─ 总览图
  ├─ 一段解释
  └─ 阅读入口
  ↓
当前信号：最新观察
  ├─ 1 条重点
  └─ 2–3 条紧凑更新
```

### 5.2 `/products`

- 首屏先展示 Robotaxi 真实媒体或受控产品空间；
- 左侧说明问题、对象和边界，右侧展示 evidence；
- 四个运营模块作为可扫描的能力层，而不是四段长说明；
- 每个模块保留一个明确进入路径；
- 模拟数据、产品演示和真实运营事实必须继续分开。

### 5.3 `/business-observations`

- 继续使用长文阅读 shell；
- 增加章节图形与文字之间的视觉节奏；
- 观察 rail 降为“当前信号”层；
- 不把企业经营体系做成软件架构控制台，也不引入第二套知识图谱。

### 5.4 `/about`

- 保持事实诚实，不为视觉完整虚构职业经历或结果；
- 强化定位、能力、问题和证据之间的关系；
- 待上游经历核验完成后，再增加时间线、项目证据或联系入口。

## 6. 结构化视觉评估输入

第一阶段不建议把评估表直接做成公开网站页面。优先采用私有、可版本化的 Markdown/YAML 输入，避免把治理字段、候选方案和内部判断暴露给读者，也避免污染现有产品内容对象。

建议输入对象：`VisualEvaluationBrief`。

```yaml
id: xingbuild-homepage-visual-evaluation
target:
  site: xingbuild
  routes: [/, /products, /business-observations, /about]
  viewports: [1512x815, 390x844]
mode: analysis
goal: "让真实作品、方法和证据形成高级、精致、可信的作品集体验"
audience:
  - 了解企业经营与数字化的招聘方
  - B端产品与业务架构同行
  - 需要判断作品真实性的读者
constraints:
  - 不虚构 career 或 Robotaxi 事实
  - 不把模拟作品表达为真实经营结果
  - 保留 xingbuild 当前事实源和产品边界
  - 不未经确认修改代码、版本或发布状态
evidence:
  sourceFiles: []
  runtimeScreenshots: []
  publicUrls: []
questions:
  - "读者第一眼是否知道 Xing 解决什么问题？"
  - "核心作品是否有真实视觉证明？"
  - "下一步行动是否清晰？"
expectedOutput:
  - facts
  - findings
  - alternatives
  - recommendedDirection
  - verificationPlan
  - confirmationGate
```

使用规则：

1. 用户先填写目标、受众、页面、约束和希望改善的感受；
2. Skill 读取结构化输入并补充源码/运行证据；
3. 输出问题、根因、候选方案和推荐方案；
4. 用户确认方案；
5. 只有确认后才生成实现任务或修改代码；
6. 修改后重新生成截图、自动检查和人工验收证据。

## 7. 开源工具与 Skill 调研

### 7.1 结论

不存在一个开源 CLI 能把网站自动“改造成顶级视觉”。工具可以高质量地发现回归、可访问性、性能和结构问题，但“高级感”仍需要产品/视觉判断、真实内容和用户确认。

推荐组合，而不是安装一个巨型工具：

| 层 | 推荐工具 | 能解决什么 | 不能解决什么 |
| --- | --- | --- | --- |
| 专业分析 | `xingbuild-interface-review` + Jakub `better-interface` 原则 | 形成跨可访问性、布局、文案、字体、颜色、UI polish 的方案 | 不能替 Xing 决策，也不能替代真实运行证据 |
| 浏览器证据 | Playwright | 真实页面、断点、状态、截图和交互检查 | 不判断审美方向 |
| 视觉回归 | Playwright `toHaveScreenshot()` 或 BackstopJS | 比较改前改后的像素差异，防止视觉倒退 | 不知道哪一种设计更高级 |
| 组件状态 | Storybook | 隔离展示共享组件和各种状态 | 当前项目尚未建立 Storybook，需要新增工程能力 |
| 可访问性 | axe-core | 自动发现常见 WCAG/ARIA 问题，并标出需要人工检查的 incomplete 项 | 不能覆盖完整键盘、读屏和真实认知体验 |
| 综合质量 | Lighthouse CLI | 性能、可访问性、最佳实践、SEO 的可重复审计 | 分数高不代表视觉高级 |

### 7.2 研究依据

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)：使用 `toHaveScreenshot()` 生成和比较基线截图，并提示不同操作系统和渲染环境会产生差异。
- [axe-core](https://github.com/dequelabs/axe-core)：开源可访问性引擎，支持 WCAG 规则；其文档明确说明自动化只能覆盖一部分问题，`incomplete` 需要人工判断。
- [Lighthouse](https://developer.chrome.com/docs/lighthouse)：可从 DevTools、CLI 或 Node 模块执行性能、可访问性、最佳实践和 SEO 审计。
- [BackstopJS](https://github.com/garris/BackstopJS)：通过参考图、测试图和 diff 报告做视觉回归，支持 CLI、Chrome Headless、交互脚本和 CI。
- [Storybook UI testing](https://storybook.js.org/docs/writing-tests)：用 stories 隔离组件状态，并连接交互、可访问性和视觉测试；视觉测试通常依赖 Chromatic 云服务，不属于完全本地开源闭环。
- [Jakub Krehel skills](https://github.com/jakubkrehel/skills)：提供 `better-interface` 与六个界面质量领域 Skill；本项目已建立独立的 `xingbuild-interface-review` 适配层。

## 8. 推荐工具链方案

### 阶段 A：零新增工程依赖的分析闭环

使用现有浏览器能力、`xingbuild-interface-review`、项目源码和现有检查：

```text
结构化 VisualEvaluationBrief
→ 源码扫描
→ 桌面/手机真实截图
→ 运行 DOM 与控制台检查
→ Skill 六领域分析
→ 方案与确认门
```

这是当前最推荐的起点，因为它先解决“我们是否定义了正确问题”，不会先增加工具维护成本。

### 阶段 B：视觉回归基线

在方案确认并完成第一轮改造后，优先增加 Playwright 截图基线：

- `/`、`/products`、`/business-observations`、`/about`；
- 桌面 `1512px`、紧凑宽度和手机 `390px`；
- 页面初始、菜单展开、文章目录展开、媒体加载、媒体 fallback；
- 只在统一浏览器/字体/运行环境中生成 baseline；
- baseline 必须和版本/commit 绑定，不能随意 approve。

BackstopJS 只有在需要独立的可视化 diff 报告或不采用 Playwright Test 时再考虑，不与 Playwright 同时作为两套主基线。

### 阶段 C：可访问性与综合质量门禁

按需增加：

```text
Playwright + axe-core → 页面与组件 a11y
Lighthouse CLI        → 性能、SEO、最佳实践、基础 a11y
```

自动分数只作门禁和趋势信号，不把分数当作产品/视觉验收结论。

### 阶段 D：组件隔离能力（可选）

只有当共享组件状态开始变多、页面修改频繁造成回归时，才引入 Storybook。当前不建议为了“看起来专业”立即加入 Storybook，因为项目仍以页面组合和内容对象为主，新增组件平台本身会增加维护成本。

## 9. 评估与执行计划

### P0：事实与展示能力核对

- 核对 Robotaxi 已批准媒体的独立内容 transport、公网 URL、hash 和 current artifact；
- 核对首页/产品页 action 是否因缺媒体一并消失；
- 输出媒体可用、媒体缺失、媒体 fallback 三种状态合同；
- 不修改 UI，先关闭“公网是否有证据”的事实缺口。

### P1：正式视觉候选

- 把本稿转化为新产品/视觉版本的 `current.md` 方案；
- 固定首页、产品页、经营观察页的目标结构；
- 固定视觉验收指标和截图基线范围；
- 明确不做：不改上游事实、不做通用知识图谱、不把网站变成营销落地页。

### P2：第一轮实现

- 先实现 Robotaxi 主视觉和清晰 action；
- 再重构首页主次关系和 Observation rail 密度；
- 再统一产品页、文章页、About 的 proof 表达；
- 每个阶段都先截图对比，再由产品/视觉验收。

### P3：工具化与回归

- 添加 Playwright visual baseline；
- 添加 axe-core 页面检查；
- 评估 Lighthouse CLI 是否进入 release check；
- 仅在组件状态复杂后评估 Storybook。

## 10. 验收标准

### 产品与视觉

- 首页首屏明确表达 Xing 的定位和唯一主作品；
- Robotaxi 至少有一个可验证的视觉 evidence 或明确的可靠 fallback；
- 核心作品有清晰进入 action；
- 观察 rail 不抢占作品主叙事；
- 暖白、墨色、赭色、字体角色和编辑式方向保持一致；
- 桌面、紧凑宽度和手机均无空白舞台、无横向溢出和无意义内部滚动。

### 事实与工程

- 作品媒体只来自批准的 source/manifest；
- 模拟、计划、上线、真实使用和结果不混写；
- 结构化评估输入、方案、实现、截图和验收结果可追溯到版本/commit；
- 不把自动化工具通过结果写成“高级感已验证”；
- 产品版本、内容发布和公网验收状态分别记录。

## 11. 决策请求

建议确认以下方案作为下一步方向：

> 采用“证据驱动的编辑型产品作品集”；先核对媒体和 action 的公网事实，再建立 Robotaxi 主视觉、首页层级和观察 rail 的整体视觉升级；使用结构化 `VisualEvaluationBrief` 管理输入，使用 Playwright 作为第一视觉回归基线，axe-core/Lighthouse 作为辅助质量门禁，Storybook 和 BackstopJS 暂不默认引入。

本稿在 Xing 确认前保持 `DRAFT/pending`，不授权代码执行。
