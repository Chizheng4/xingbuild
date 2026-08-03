# xingbuild 网站产品架构与视觉系统总案

> 状态：正式产品与视觉基线（唯一现行主文档）  
> 责任：xingbuild 产品与视觉 task 维护；Engineering 只实现已经确认并进入当前迭代的能力  
> 更新时间：2026-08-01  
> 适用版本：从当前公开 `v0.23.0` 起，持续适用于后续网站版本
> 说明：本文档不是产品版本号，也不是内容发布版本号。它是网站产品结构、视觉系统、内容对象与能力边界的统一依据。

## 0. 唯一事实源与阅读方式

从本文件发布以后，网站产品结构、页面责任、内容对象、视觉语言、响应式合同和可复用展示能力，只以本文件为现行产品/视觉依据。

本项目的文档职责分开，不互相复制正文：

| 文档或目录 | 责任 | 与本文件的关系 |
| --- | --- | --- |
| `docs/product/xingbuild 网站产品架构与视觉系统总案.md` | 产品目标、信息架构、页面责任、内容对象、视觉系统、展示能力 | 唯一现行产品/视觉主文档 |
| `AGENTS.md` | 项目边界和强制入口 | 只引用本文件，不复制产品/视觉正文 |
| `docs/rules/00-baseline-index.md` | 规则优先级、五层结构和按任务类型读取 | 不复制任何规则正文 |
| `docs/rules/iteration-and-release.md` | 产品版本、Git、部署和回退规则 | 工程发布事实源，不由本文替代 |
| `docs/rules/responsibility-and-workflows.md` | 责任域与内部产品工程流程 | 只维护责任和分流，不由本文替代 |
| `docs/rules/collaboration-workflow.md` | 跨 task 一次性交接和回传 | 只维护协作消息，不由本文替代 |
| `docs/iterations/current.md` | 唯一当前工程迭代指针 | 只记录正在实施的版本 |
| `docs/iterations/candidates/` | 产品设计前的未确认候选入口 | 只保留 pending/DRAFT，不定义 Engineering 授权 |
| `docs/iterations/history/candidates/` | 已转化或已关闭候选的历史归档 | 只保留来源、转化/关闭结果和证据，不参与当前决策 |
| `docs/iterations/history/` | 已完成版本的计划和结果 | 只用于追溯，不重新定义当前产品 |
| `docs/qa/` | 版本或问题的验证证据 | 证明某次验收，不是长期设计源 |
| `docs/operations/` | 日常采集、审核和发布操作合同 | 不存产品视觉正文 |
| `docs/upstream/` | career、Robotaxi 等上游事实快照 | 提供事实，不提供网站 UI 决策 |
| `docs/design/` | 已确认的正式版本方案、视觉系统与验收合同 | 不得存放未确认 DRAFT |

事实冲突时按以下顺序处理：

1. 上游事实仍以 career、Robotaxi 的权威源为准；
2. 网站产品与视觉决策以本文为准；
3. 工程执行和发布门禁以 `docs/rules/iteration-and-release.md` 为准；责任与协作按 `docs/rules/00-baseline-index.md` 路由；
4. 版本实施状态以代码、`current.md`、Git 和真实部署证据为准；
5. 历史方案不得覆盖本文已经确认的当前决策。

任何 task 都不得因为找到了旧方案，就重新引入已被当前基线淘汰的页面结构、视觉规则或图形运行时。

## 1. 产品定位与根本目标

`xingbuild` 是作者主导的个人网站和持续演进的作品集合，不是在线简历，也不是自动工程活动日志。

网站把三类长期内容连接成一个对外阅读入口：

```text
持续观察与判断
        ↓
形成方法、系统和作品
        ↓
用经历、结果和证据说明能够提供的价值
```

网站需要让读者逐步回答：

1. 作者是谁，当前关注什么；
2. 作者能够解决哪些企业经营与数字化问题；
3. 这些判断由哪些经历、作品和事实支持；
4. Robotaxi 等作品的真实边界是什么；
5. 读者应该继续阅读、进入作品，还是联系作者。

网站不直接宣称成长、社会价值或长期自我记录等内部解释，而通过持续内容、作品质量和证据让读者自行形成判断。

## 2. 当前产品状态

### 2.1 已经工程化并公开使用

当前公开 `v0.23.0` 已经形成以下稳定能力：

| 能力 | 当前实现 | 内容更新是否需要产品迭代 |
| --- | --- | --- |
| 全站 SiteShell、Header、Footer、sticky 状态 | `LayoutShell`、`SiteHeader`、`SiteFooter`、共享 token | 否 |
| 一级导航与页面路由 | B端产品、经营观察、关于我；集中观察页为上下文入口 | 否 |
| B端产品展示母版 | `ShowcaseLayout`、`PracticePage`、`SystemStage`、Observation rail | 增加已批准内容时否 |
| Brief 观察内容 | `ObservationPublication`、schema、rail、集合页、单条文章 | 采集/审核/内容 publish 不进入产品版本；改变内容能力才进入产品版本 |
| 常青长文 | `EvergreenArticlePublication`、`EvergreenArticle`、`RichDocument`、`ReadingTOC` | 内容对象独立发布；新增 block 类型、阅读结构或图形能力才进入产品版本 |
| 富文本受控 block | lead、heading、paragraph、list、definitionList、figure、callout、sources、link | 新增 block 类型需要产品版本 |
| 图形静态内容 | Mermaid/LikeC4 源文件在构建期生成 desktop/mobile SVG，文章用 `picture` 投影 | 增加图或章节不需要；改变渲染能力需要版本 |
| 返回导航 | 共享 `ReturnNavigation`，使用安全站内目标和返回焦点 | 否 |
| 响应式阅读 | 桌面双栏/目录、紧凑单栏、移动折叠目录和自然页面滚动 | 内容增加不需要 |
| 内容与产品责任分离、发布身份分开 | 内容审核、确认与 publish 独立运行；产品结构与能力仍使用产品版本 | 内容使用独立发布身份；不修改产品版本、tag 或产品 current |

### 2.2 已确认但不是当前公开运行时的能力

- 企业经营体系的事实模型仍可作为上游模型和迁移证据；当前公开页面以常青长文为主，不再把旧 `FrameworkGraphRuntime` 或 `ArchitectureExplorer` 当作公开产品合同。
- LikeC4 和 Mermaid 已固定为内容构建阶段的开源 adapter；当前文章图形是静态响应式图，不是 LikeC4 原生多视图运行时。
- `?view=digital-implementation` 只作为旧链接兼容入口，解析到文章稳定锚点；不得继续维护第二套局部页面。

### 2.3 已确认的未来能力

未来需要建立统一的“视觉表达能力层”：

```text
内容对象或页面区域
        ↓
VisualExpression（视觉表达对象）
        ↓
VisualizationHost（统一展示控件）
        ↓
Renderer Adapter（LikeC4、Mermaid 等）
        ↓
交互运行时或静态降级
```

它的目标是让架构图、流程图、状态机、生命周期图、概念关系图和 Robotaxi 受控互动空间成为可调用能力，而不是页面专用代码。

页面也统一采用 `PageDefinition → PageComposition → Content Objects + CapabilityHost` 的产品架构。首页、B端产品、独立观察集合、长文、About 和未来互动能力页都是该架构下的不同组合，不再创建互相独立的页面结构。

这是未来产品版本能力，不得在内容 task 中通过私有 JSX、手工坐标或页面 CSS 偷渡实现。

### 2.4 明确不做

- 不把网站变成通用知识图谱、在线白板或自由画布；
- 不为了展示图形而复制 career 或 Robotaxi 的业务事实；
- 不为每一篇文章新建一个页面组件；
- 不用静态截图冒充可运行系统；
- 不在读者界面展示 candidate、sourceTier、claimKind 等治理字段；
- 不通过页面 CSS、手工 SVG 坐标或固定换行持续修补图形；
- 不因为内容增加十张图、子章节或下一级概念就重新开发页面；
- 不在没有产品版本授权时修改 `current.md`、版本、tag、代码或发布规则。

## 3. 事实边界与上游关系

```text
career
  └─ 企业经营、数字化和职业定位概念事实
Robotaxi
  └─ Robotaxi 作品状态、业务对象、运行结果和受控素材
xingbuild
  └─ 网站展示快照、内容对象、视觉、测试和发布状态
EdgeOne
  └─ 生产部署、域名和线上运行事实
```

- career 是企业经营、数字化和职业定位概念的上游事实源；网站只读取批准同步快照，不改写概念定义。
- Robotaxi 是 Robotaxi 业务对象、系统状态、运行证据和素材审批的上游事实源；xingbuild 不复制业务系统，也不把模拟作品表达为真实城市运营。
- xingbuild 可以重组公开表达，但不得提升上游事实的完成状态、商业结果或证据等级。
- 公开内容必须区分规划、建设、上线、可运行模拟、真实使用和实际结果。

## 4. 网站信息架构

### 4.1 一级导航

当前一级导航固定为：

```text
B端产品 / 经营观察 / 关于我
```

对应责任：

| 入口 | 公开责任 | 当前主要对象 | 页面组合 |
| --- | --- | --- | --- |
| `/products` | 展示可运行或受控的产品作品及其状态边界 | Robotaxi运营平台 | `ShowcaseComposition` |
| `/business-observations` | 展示企业经营框架、经营观察和常青长文 | 企业经营体系、Brief rail、Article | `ReadingComposition` / `HybridComposition` |
| `/about` | 展示作者定位、能力、经历和联系 | About RichDocument | `ReadingComposition` |
| `/observations` | 集中观察集合，不是一级导航 | Brief 与有详情的长文入口 | `CollectionComposition` |
| `/observations/:slug` | 单条观察或文章详情 | `ObservationPublication` | `ReadingComposition` |
| `/` | 只使用一次定位语，并投影真实最新对象 | Robotaxi、企业经营体系和最新观察 | `HomeComposition` |

表中的 `PageComposition` 是已确认的产品组合合同，不表示当前代码已经为每个组合建立独立运行时；实现必须在进入唯一 `current` 后由 Engineering 按组合合同逐项落地。

企业经营体系属于“经营观察”，不是 B端产品；Robotaxi运营平台属于当前 B端产品，不得与企业经营体系互换归属。

### 4.2 首页责任

首页不是第二套内容系统：

1. 只使用一次定位语作为唯一可见 H1；
2. 复用来源页中的最新 B端产品和最新经营观察对象；
3. Observation rail 只出现一次；
4. 不显示“首页”“核心实践”、复制摘要或空视觉舞台；
5. 首页投影只改变语义 heading level，不复制内容、字段顺序或事实。

### 4.3 B端产品责任

B端产品页使用 `ShowcaseLayout`：

```text
左侧：对象标题 + 极短说明 + 必要事实边界
右侧：SystemStage（媒体、视频或受控产品空间）
下方：可选的产品长文和经营闭环解释
右侧 rail：最新经营观察（有有效 Brief 时才出现）
```

Robotaxi 的互动空间与企业经营架构图是两种不同表达，不共享业务模型。若未来嵌入 Robotaxi 独立系统，必须使用受控、无伪登录、无越权访问记录的公开演示边界；当前批准 action 仍以独立 Robotaxi 网站为准。

### 4.4 经营观察责任

经营观察同时容纳：

- 可信事实驱动的 Brief；
- 有明确来源的 Robotaxi/企业经营观察；
- 可持续更新的企业经营体系常青长文；
- 长文中的受控图形表达。

它不是通用新闻流，也不是工程活动日志。

### 4.5 About 责任

About 使用与文章相同的 `RichDocument` 受控 block，表达当前定位、问题、能力、经历、证据边界、方向和联系方式。职业事实不足时如实显示整理中，不补造结果。

### 4.6 页面产品架构与组合合同

页面不是一次性设计的私有组件，而是由统一页面定义选择结构组合：

```text
NavigationEntry（导航入口）
        ↓
PageDefinition（页面定义）
        ↓
PageComposition（页面组合）
        ↓
Content Objects + CapabilityHost
        ↓
Responsive / Interaction / Fallback
```

每个页面定义至少表达：

```text
id
route
navigationEntry?
intent
composition
regions
contentRefs
capabilities?
navigationContext
responsivePolicy
acceptance
```

`PageDefinition` 只定义页面责任与组合，不复制业务事实；内容对象和视觉表达对象仍由各自唯一事实源提供。

标准页面组合：

| 组合 | 责任 | 可选区域 |
| --- | --- | --- |
| `HomeComposition` | 定位语、最新作品和最新观察的统一投影 | `TopBand`、观察 rail、`ClosingSection` |
| `ShowcaseComposition` | B端产品或作品的说明与能力展示 | `left` 说明、`right` CapabilityHost、长文、rail |
| `CollectionComposition` | Observation 等内容集合 | 标题、导读、集合、筛选/分页能力、rail |
| `ReadingComposition` | Article、About 和长文阅读 | 标题、摘要、TOC、RichDocument、来源 |
| `HybridComposition` | 能力展示与长文在同一页面的组合 | `left`、`right`、RichDocument、rail |
| `CapabilityComposition` | 独立的架构、流程、状态或互动能力入口 | CapabilityHost、说明、结果、返回 |

页面组合是可选择的产品结构，不是每个页面一套实现。新增内容优先选择现有组合；只有新增组合、区域责任或共享能力，才进入产品版本。

菜单与页面的关系固定为：

```text
菜单只负责导航目标
页面定义负责页面组合
内容对象负责公开内容
能力控件负责展示、响应式和互动
```

网站名进入 `/`；一级导航进入 `/products`、`/business-observations`、`/about`；“更多观察”进入 `/observations`；单条内容进入 `/observations/:slug`。导航名称不决定页面内部布局，页面内部布局只由 `PageDefinition` 和现有组合合同决定。

## 5. 内容对象与页面投影

### 5.1 ObservationPublication（观察）

```text
ObservationPublication
└─ EvidenceUnit × N
   └─ Source × N
```

读者对象使用统一 `ObservationBlock`：

```text
subject · eventAt
#维度
80–160 个中文等价字符的事实正文，建议 2–3 句、一个段落
来源：...
```

- `subject` 和事件日期帮助识别；
- dimension 当前只表达分类，不是默认可点击筛选；
- 读者页面不展示 `claimKind`、`sourceTier` 或治理标签；
- 有长文时在同一块内嵌 `ArticlePreview`；普通 Brief 不单独创建详情页；
- 来源是末行弱信息，不能被视觉强调掩盖正文。

内容、审核、来源和发布边界遵循 [`docs/operations/内容运营与发布规则.md`](../operations/内容运营与发布规则.md)，产品工程版本边界遵循 [`docs/rules/iteration-and-release.md`](../rules/iteration-and-release.md)；本文不复制操作命令。

### 5.2 EvergreenArticlePublication（常青长文）

当前首个对象：

```text
content/articles/enterprise-operating-system.json
```

受控字段包括：`id`、`slug`、`title`、`summary`、`status`、`updatedAt`、`blocks[]`、`sources[]`。

`RichDocument` 当前允许：

```text
lead | heading | paragraph | list | definitionList
figure | callout | sources | link
```

后续增加章节、定义、来源或十张图，只修改文章对象和图源，经过 article checks 后独立发布，不修改页面组件、产品版本或 tag。新增 block 类型、改变阅读结构或改变图形能力才进入产品版本。

### 5.2.1 内容运营与产品版本边界

内容运营的对象、审核、发布身份和公网内容证据由 `docs/operations/内容运营与发布规则.md` 负责。内容增加或修正文案、事实、来源、媒体、章节和模块说明时，不改变产品版本；只有新增页面组合、路由、schema、组件、交互或共享展示能力时，才进入产品工程版本。

### 5.3 Practice / Robotaxi 作品

Robotaxi 内容对象由上游批准的 `media`、可选 `action` 和内部 `provenance` 组成：

- `media` 是读者可见素材；
- `action` 是可选的独立系统入口；
- `provenance` 保存审批、状态、版本、commit 和哈希，不投影到读者界面；
- 未达到 approved/public 或哈希校验失败的素材不得进入读者页面。

### 5.4 Profile / About

About 的公开内容使用受控 `RichDocument`，不在页面 JSX 中写业务正文、私有字号或任意 margin。

### 5.5 VisualExpression（未来统一视觉表达对象）

视觉表达对象不是新的业务事实源，只是内容的表现声明。最小语义包括：

```text
kind: architecture | flow | state | lifecycle | sequence | concept | mindmap | interactive-stage
sourcePath
renderer
mode: static | interactive
initialView?
title?
alt
caption
fallback
provenance
```

内容 task 只声明表达意图和源文件；页面不声明节点坐标、关系路径、字体尺寸或响应式分支。

## 6. 页面模板与布局合同

### 6.1 全局 shell

- 桌面唯一 shell 最大 `1280px`，外边距至少 `32px`；
- 手机 gutter `20px`，窄屏 `16px`；
- 主背景暖白，内容自然流动，不为每个页面创建独立版心；
- Footer 始终位于页面内容自然流的末端；短内容页面也不能让 Footer 悬在内容中部。

### 6.2 ShowcaseLayout

桌面完整双栏：

```text
主展示区 952px = 说明列 208px + 20px + SystemStage
主展示区 952px + 24px + Observation rail 304px
```

仅当 SystemStage 仍可保持至少 `640px` 有效宽时使用完整双栏；否则转为单栏，不压缩主视觉到不可读。

手机使用单列，并保持对象归属：`SystemStage → explanation` 的间距 `12–16px`；不同对象之间 `40–48px`。同一内容对象不得在手机被拆成无法判断归属的两块。

### 6.3 ReadingShell 与 ReadingTOC

- Article 与 About 共用居中 ReadingShell；
- 桌面文章目录约 `160px`，正文约 `768px`，目录和正文间 `24px`；
- 目录只从有稳定 `id` 的 H2/H3 生成；
- sticky 目录必须避开 sticky Header；
- 手机目录使用原生 `details` 展开，跳转后关闭；
- 点击、刷新、直接锚点访问和 Header 偏移必须成立；
- 正文不使用内部滚动容器。

### 6.4 Observation rail

- 只有存在有效 Brief 时才渲染 rail；
- 页面与首页使用相同观察对象和 `ObservationBlock` 投影；
- rail 不展示治理信息；
- 无有效 Brief 时不保留空 rail 或占位空间。

### 6.5 PageComposition 共享区域

所有页面组合共享以下区域语义；区域可声明存在或省略，不以空白占位替代缺失内容：

```text
PageFrame
├─ TopBand
├─ ContentComposition
│  ├─ left?
│  ├─ right?
│  ├─ body?
│  └─ rail?
├─ RichDocument?
└─ ClosingSection?
```

- `TopBand`：页面标题、可选说明和最多一个有真实目标的上下文 action；标题可左对齐或居中。
- `ContentComposition`：单栏、左右双栏或内容区关闭任一侧；关闭后不留下空 rail，不创建页面私有版心。
- `RichDocument`：使用受控 block 和目录，可以独占页面、进入一个区域或位于展示能力下方。
- `ClosingSection`：居中标题、标题+说明或省略；默认是内容收束，不自动成为营销 CTA。
- 同一页面在桌面、紧凑宽度和手机只改变顺序、密度和区域折叠，不改变对象语义、导航目标和内容事实。
- 页面内的图片、视频、图形和互动状态由统一能力层负责内容级响应式；不能只缩放外层容器。

标准移动顺序为：

```text
TopBand → title/summary → action or TOC → capability/content → result → ClosingSection
```

## 7. 视觉系统

### 7.1 品牌与颜色

温暖、编辑式、精确，不以装饰建立高级感。

| 角色 | 当前 token | 责任 |
| --- | --- | --- |
| 主背景 | `--color-canvas: #F5F1E8` | 全站画布 |
| 轻表面 | `--color-surface-subtle: #ECE5D8` | 目录、导读、轻区分区域 |
| 主文字 | `--color-text: #20211F` | 标题和正文 |
| 辅助文字 | `--color-text-muted: #625F58` | 元数据、来源、边界 |
| 边界 | `--color-border: #C9C3B7` | 必要控件、焦点辅助、真实边界 |
| 强调 | `--color-accent: #A34322` | 当前项、链接、标签和克制反馈 |
| 强强调/焦点 | `--color-accent-strong: #7D2F19` | hover、active、focus |

规则：

- 当前只有浅色主题，不自动跟随系统深色模式；
- 正文不使用强调色；
- 不用边框、阴影、浮起效果制造通用卡片；
- 线条只表达真实边界或业务关系；
- 不采用手绘、水彩、草图、植物、风景和装饰隐喻。

### 7.2 字体角色

```text
Editorial：Noto Serif SC → Songti SC → STSong → serif
Interface：Noto Sans SC → PingFang SC → Microsoft YaHei → sans-serif
Wordmark：Georgia → Noto Serif SC → serif
```

角色顺序固定：

```text
wordmark → 首页定位 → 页面/对象标题 → 模块/章节标题
→ 阅读正文/摘要 → metadata/source
```

桌面和手机共享角色，不因断点整体换字体。中文标题必须先保证词义完整，再讨论行数和几何。

### 7.3 间距与层级

视觉结构固定为：

```text
Page Frame → Section → Content Group → Content Object → Element → Relationship
```

父级 flow 负责同级对象之间的间距；子对象只负责内部结构。不得通过空段落、硬编码 `<br>`、重复 margin 或页面私有 CSS 制造节奏。

关系 token：

```text
bind：8–12px       同组紧密关系
relate：16–24px    标题、摘要、正文关系
object：32–48px    对象内部主要分组
group：48–64px     同栏目对象之间
section：96–128px  栏目之间
```

具体数值可以随模板调整，但不能改变关系语义。

### 7.4 Header、导航、Footer

- Header 是一个紧凑横向身份组：较大的 `xingbuild` 后接较小的 `金星 Xingjin`，间距约 `8px`，基线对齐；
- Header 全站 sticky，顶部与画布融合，滚动后只增加暖色半透明层、克制 blur 和轻 shadow，不改变高度；
- 一级导航保持 `B端产品 / 经营观察 / 关于我`；
- 手机低于约 `520px` 使用全视口菜单 overlay，锁定背景滚动并恢复焦点；约 `557px` 保留紧凑行内 Header；
- Footer 只显示 `© 年份 xingbuild · 当前产品版本`；作者、地点、更新时间和治理状态不进入全局 chrome；
- 采集、draft、review、recovery 和内容 publish 不进入产品版本；Footer 只显示当前产品版本，不展示内容运营状态。

### 7.5 卡片、链接与返回

- 重复可点击集合使用共享卡片系统；整张卡片是主链接；
- hover 只改变克制表面/边界对比，不改变尺寸、不重排、不上浮；
- focus-visible 必须清楚且不只依赖颜色；
- `ReturnNavigation` 是全站统一辅助文字链接，主文案为 `← 返回{真实目的地名称}`；
- 它不是描边按钮、浮动工具条或页面私有变体；
- 同页最多一个主返回和一个不重复目标的次级栏目入口；
- 返回目标、origin/returnTo、焦点和必要滚动现场必须在刷新、直接访问和浏览器历史下成立。

### 7.6 页面能力展示的视觉与互动

- 展示空间是页面内容对象的视觉主角，但不改变页面的语义层级；说明、操作、状态、结果和来源保持可辨识顺序。
- 图片、视频、架构图和互动系统都必须有真实的边界、可读尺寸、`alt/caption` 或文本结果；不能用巨大空白、不可读缩放或孤立标签填充空间。
- 桌面支持 hover、focus-visible 和 click；手机支持 tap；键盘 Enter/Space 与触控共享同一状态语义。hover 不能是唯一信息来源。
- 选中、加载、错误和 fallback 只改变必要的颜色、说明、结果或状态，不改变页面列数、标题位置、图形坐标或滚动上下文。
- 交互反馈使用克制的边界、颜色和轻量过渡，尊重 `prefers-reduced-motion`；不把复杂滚动动画作为理解内容的前提。
- 统一能力层负责“容器响应式 + 内容投影响应式”：固定桌面图不能仅通过 `width: 100%` 压缩到手机；renderer 必须提供合适投影或可靠降级。

## 8. 视觉表达能力层

### 8.1 三种责任必须分开

| 表达 | 主要问题 | 当前/未来方式 |
| --- | --- | --- |
| LikeC4 多视图架构 | 系统边界、层级、组件和视图下钻 | 未来由统一 host 调用 LikeC4 原生 runtime |
| 文章内局部图 | 当前章节的一个关系、流程或状态 | 当前使用 source-driven 静态 figure；未来由 renderer adapter 选择 |
| Robotaxi 互动空间 | 受控产品演示和独立系统入口 | `InteractiveStage`，遵守登录、权限和访问记录边界 |

### 8.2 当前图形合同

当前公开文章的图形只通过受控 `figure` block 声明：

```text
sourcePath / renderer / layoutPreset / alt / caption
```

构建期由锁定的 Mermaid 或 LikeC4 CLI 生成 desktop/mobile SVG 和校验记录；运行时使用响应式 `picture`，不是手写节点坐标、关系路径或每页专用 SVG。

当前静态图形必须满足：

- source 单一且可编辑；
- 生成失败先清除目标旧产物；
- desktop/mobile 均有可读的图形或文本降级；
- 不把图形治理字段投影给读者；
- 不用图形替代必要的文字解释。

### 8.3 未来统一 host 合同

未来的 `VisualizationHost` 应统一负责：

- 有界响应式展示面；
- renderer 隔离；
- 交互、键盘、触摸和焦点；
- 多视图进入/返回和当前层级；
- 加载、错误、静态和文本降级；
- 无障碍名称、说明和操作；
- 不允许父级 CSS 破坏 SVG/DOM、字体、缩放和溢出。

页面和文章只传入视觉表达对象，不声明坐标、路径、尺寸或移动端特例。LikeC4 runtime 作为架构 adapter，Mermaid 作为流程/状态/生命周期 adapter；D2 仍是未来可选 adapter，未经锁定和专项验收不得声明。

## 9. 当前代码与内容映射

| 产品责任 | 当前代码/内容落点 | 使用边界 |
| --- | --- | --- |
| 路由与全局 chrome | `src/App.jsx`、`src/components/site/` | 共享页面骨架 |
| 页面版心和两栏 | `src/components/site/LayoutShell.jsx` | 不在页面复制版心 |
| B端产品 | `src/pages/ProductsPage.jsx`、`src/pages/RobotaxiPage.jsx`、`src/components/practice/` | 只读取批准 Practice 内容 |
| 观察集合和 rail | `src/content/observationRepository.js`、`src/components/observations/Briefs.jsx` | Brief/Article 共用投影 |
| 常青长文 | `content/articles/*.json`、`src/content/evergreenArticleRepository.js`、`src/components/reading/` | 内容更新不改组件 |
| 企业经营体系 | `content/articles/enterprise-operating-system.json` | 当前公开入口是长文 |
| 图形构建 | `src/architecture/`、`scripts/generate-evergreen-figures.mjs`、`src/content/diagramFigureAssets.js` | 构建期 adapter |
| 文章图形投影 | `src/components/reading/RichDocument.jsx` | 统一 figure，不写业务 JSX |
| 返回导航 | `src/components/navigation/ReturnNavigation.jsx` | 全站共享 |
| 内容发布 | `scripts/content-*`、`scripts/article-*`、发布命令 | 采集/审核数据不进产品版本；正式内容 publish 使用独立内容身份和内容证据 |

`src/components/framework/` 中的旧架构运行时和投影代码属于迁移/历史实现，不是当前公开产品合同。未经新的产品版本方案确认，不得在新页面重新引用它们，也不得以删除遗留代码替代产品设计验收。

## 10. 责任分工与迭代门禁

### 产品与视觉 task

- 维护本文；
- 决定产品目标、信息架构、内容对象、页面责任、视觉、响应式和验收合同；
- 对 Engineering 已形成的本地提交版本执行产品与视觉验收；验收发现产品、视觉、对象边界或验收合同问题时，直接定义下一个 patch/小迭代/大迭代并写入 `current.md`，不把该验收问题重新放入普通候选队列；
- 每次收口必须报告本地版本状态、线上版本状态、本地/线上 URL、已确定项、未确定项、候选状态和下一动作；无候选时也必须明确报告等待用户下一步；
- 不参与日常选题、写稿、事实审核和逐条内容发布；
- 负责确定产品版本合同、产品发布能力边界和内容运营边界；正式内容 publish 属于独立内容运营，采集与审核数据不触发产品版本。

### 内容与发布 task

- 按现有 schema 写 Brief、Article 和视觉表达声明；
- 调整公开结构和可读性，但不得改变上游事实、来源性质或证据边界；
- 只执行内容事实和 schema 检查，按统一发布命令提交已批准内容；
- 不修改本文、页面组件或视觉 token；不得修改产品版本、创建产品 tag 或绕过内容运营合同。

### Ops task

- 只产出可信证据候选、去重和覆盖记录；
- 不写公开标题、摘要、正文，不决定发布；
- 不把内部台账或治理标签投影到读者界面。

### Engineering task

- 只实现已经确认并进入唯一 current 的能力合同；
- 在当前合同内完成实现与自 QA；本地提交后交产品与视觉 task 验收，不自行改变产品目标、对象边界或视觉合同；
- 不复制或改写 career/Robotaxi 业务事实；
- 不为页面方便建立专用数据、坐标、路径或视觉特例；
- 形成一个本地提交版本后，分别报告本地版本状态与线上版本状态、本地/线上 URL、已确定项、未确定项、候选状态和下一动作；publish 后再报告线上统一版本证据。

### 产品版本与内容更新判定

| 变化 | 是否产品版本 |
| --- | --- |
| 新增 Brief、文章章节、来源、图源或现有 block 内容 | 内容运营独立发布，不进入产品版本 |
| 新增十张同类型图，仍使用现有 figure 合同 | 内容运营独立发布，不进入产品版本 |
| 新增 block 类型、页面层级或新的内容对象 | 是 |
| 改变共享 Layout、Header、Footer、返回、目录或视觉 token | 是 |
| 新增或改变 VisualizationHost/renderer adapter | 是 |
| 修改 Robotaxi 嵌入安全、权限或公开演示能力 | 是 |

产品方案、串行交接和发布命令按 `docs/rules/00-baseline-index.md` 路由：候选和产品设计遵守职责规则，跨 task 遵守协作规则，版本收口和发布遵守迭代规则。产品方案可以并行形成 `DRAFT`，但不能修改当前版本或合入主线；当前版本收口后由产品 task 检查候选入口并交 Engineering。

## 11. 产品变化的分流原则

本文件只维护“网站产品应该是什么”。项目通用的规则按 [`docs/rules/00-baseline-index.md`](../rules/00-baseline-index.md) 路由：职责与候选分流以 `responsibility-and-workflows.md` 为准，跨 task 以 `collaboration-workflow.md` 为准，版本启动、验证、提交/tag、发布和资源以 `iteration-and-release.md` 为准；活动候选以 `docs/iterations/candidates/` 为准；转化/关闭记录以 `docs/iterations/history/candidates/` 为准；当前实施状态以 `docs/iterations/current.md` 为准。

产品侧只保留以下分流：

- 新增内容对象、章节、来源或现有类型图形：按内容合同运营；不得创建产品版本或产品 tag；
- 新页面但复用已有组合：使用已确认的 `PageDefinition` 能力；当前尚未实现时排入相应版本；
- 新页面组合、内容 block、共享视觉、响应式或 renderer：形成活动候选记录；产品 task 启动版本时综合形成正式设计方案，写入 `current.md`，并立即归档来源候选；
- 上游事实继续由 career/Robotaxi 和 Ops 事实合同维护；Engineering 实施中的跨范围问题、工具缺陷或新的产品优化统一登记到 `docs/iterations/candidates/`，由产品与视觉 task 评审；已提交本地版本的产品与视觉验收问题直接定义下一版本，不在运营文档或 task 私有文件中另建问题入口；
- 任何新产品方案都必须回到本文确认，不得在 task、页面组件或旧设计文件中形成第二份网站主架构。

## 12. 文档整理与保留规则

### 12.1 当前唯一入口

后续产品/视觉 task 必须从本文开始读取。`docs/README.md` 只指向本文，不再把多个旧设计文件列为当前基线。

### 12.2 必须保留

- `docs/iterations/history/`：版本追溯和发布证据；
- `docs/qa/`：真实运行验收证据；
- `docs/upstream/`：上游事实快照；
- `docs/operations/`：内容运营和发布合同；
- `docs/design/assets/`：仍被历史 QA 或设计证据引用的资产。

这些文件不是当前设计入口，但删除会损害可追溯性。

### 12.3 历史设计方案

`docs/design/v*.md` 是对应版本的设计决策和实施输入，应保留用于追溯；它们不再拥有当前产品/视觉权威。若未来需要物理归档，只能在检查所有引用、更新链接并保留可恢复历史后单独执行，不能在本次主文档建立时批量删除。

`docs/design/xingbuild Visual System v1.md` 和 `docs/design/视觉系统与交互原则.md` 的有效内容已经吸收到本文。前者保留为历史视觉快照，后者只作为兼容入口，不得继续追加新规则。

企业经营体系多视图方案已在 `docs/design/v0.22.0 企业经营体系多视图架构阅读能力方案.md` 正式落点；本总案仍是长期产品/视觉事实源，版本方案只承载本次实施范围与验收，不形成第二份网站总架构。

### 12.4 删除门禁

只有同时满足以下条件，文件才可以删除：

- 不是版本历史、QA、上游事实或运营合同；
- 没有被代码、脚本、current、README、AGENTS 或历史证据引用；
- 有效决策已完整进入本文或对应唯一责任文档；
- 删除后可以通过链接、文档和 Git diff 检查；
- 删除范围已在变更说明中列出并得到产品责任确认。

## 13. 验收合同

每次产品/视觉迭代至少检查：

### 产品结构

- 页面入口、上层与返回目标符合本文 IA；
- 内容对象没有被复制成第二份事实源；
- 首页投影与来源页共用同一内容对象；
- Brief、Article、Practice、About 的责任边界没有混合。

### 视觉与响应式

- Header、Footer、品牌色、字体角色和返回导航保持共享合同；
- 桌面、紧凑宽度、手机均无横向溢出和无意义内部滚动；
- hover、focus、click、tap 不改变布局几何或造成页面晃动；
- 文字、关系线、图形和说明在真实尺寸下可读；
- 目录、锚点、焦点和直接访问成立；
- 图形不是截图式占位，不把线条与无关组件边缘重合。

### 内容与事实

- 文章/图形只读取批准源；
- 图形 alt、caption、正文和来源互不替代；
- 不把模拟、计划、公司表述或推断写成已验证经营事实；
- 读者界面不泄露内部治理字段。

### 工程与发布

- 构建失败不得复用旧图形产物；
- 通过项目、内容、文章和 Sites 检查；
- 产品能力使用产品版本身份；内容提交和线上内容发布使用独立内容身份；采集与审核数据保持运营内部边界。
- 实现、验证、提交/tag、push、部署和公网验收分别记录；
- 浏览器验证结束后释放服务和资源。

## 14. 当前待确认事项

当前产品总案没有脱离活动候选入口的已确认事项。新的产品、视觉、页面或公开发布能力优化，必须先登记到活动 `docs/iterations/candidates/`；产品 task 评估后要么转为正式设计方案并归档候选，要么保留 pending 并向用户报告。内容 task、Ops 和 Engineering 不得自行把问题升级为产品版本。

## 15. 变更记录

| 日期 | 变化 | 责任 |
| --- | --- | --- |
| 2026-08-01 | 首次建立统一产品架构、内容对象、视觉系统、展示能力和文档治理主文档 | 产品与视觉 task |
| 2026-08-01 | 补充 `PageDefinition → PageComposition` 页面产品架构、共享区域和能力展示互动合同；候选 DRAFT 改为只保留未确认能力细节 | 产品与视觉 task |
| 2026-08-02 | 统一候选入口、current/history 和规则索引；roadmap 不再作为活动事实源 | 产品与视觉 task |
