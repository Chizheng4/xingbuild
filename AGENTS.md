# 原型实施说明

自行启动本地服务，并使用当前环境可用的浏览器打开预览；能够自行启动时，不把启动服务的操作转交给用户。

进行重大视觉修改前，如果视觉事实源不明确或已不符合当前目标，先使用 Product Design 插件的 `get-context` skill。用户给出可长期复用的原型设计反馈、偏好或决策时，将其记录到 `AGENTS.md`。

根据已选定的生成式 mock 实现时，该图是布局、组件结构、密度、间距、颜色、字体、可见内容和层级的事实源。

应用界面在 `src/` 中实现。保持 `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs` 和 `tests/sites-worker.test.mjs` 完整，使同一份本地原型可交付 Sites。交付 Sites 前运行 `npm run build` 和 `npm run test:sites`；构建必须生成 `dist/client/index.html`、`dist/server/index.js` 和 `dist/.openai/hosting.json`。

## xingbuild 产品决策

- `xingbuild` 是作者主导的个人网站和持续演进的作品集合，不是在线简历。
- `xingbuild` 将作者身份 `金星 · Xingjin` 与持续设计、构建的作品连接起来。这是内部设计语境：用于判断命名和结构；除非用户明确要求，不把用户关于成长、社会价值或长期自我记录的解释直接写成公开文案。
- 当前一级信息架构为 `B端产品 / 经营观察 / 关于我`。`Robotaxi运营平台` 属于 B端产品；企业经营体系属于经营观察；集中 `/observations` 集合由“更多观察”进入，不是一级导航。
- `经营观察` 包含企业经营框架、简洁的 Robotaxi/企业经营观察和真正的长文；它不是通用新闻流，也不是自动工程活动日志。
- 首页只使用一次定位语作为唯一可见 H1，随后使用与来源页完全相同的内容对象和组件投影最新 B端产品与最新经营观察。不得显示“首页”“核心实践”、超大 Hero、复制摘要或空视觉舞台；Observation rail 只出现一次。
- Observation 使用统一读者块语法。Brief 为 `subject · event date`、独立 hashtag 维度、80–160 个中文等价字符的事实正文和末行来源；存在长文时在同一块嵌入 ArticlePreview，只有长文拥有详情页。证据治理留在数据与生产流程，读者界面不展示 claimKind、sourceTier 或治理标签。
- 未来的 build log 可以投影经验证的项目与发布活动，但当前不是一级导航。
- `Robotaxi运营平台` 是当前 B端产品；企业经营体系/数字化认知框架是当前主要经营观察对象，不是 B端产品。
- 职业经历、定位、能力、方向、简历和联系方式属于 `关于我`。
- 桌面采用温暖编辑式视觉方向；手机采用紧凑系统布局，但不改变网站品牌色。
- 响应式断点可以改变布局、密度、字体、导航和图表方向，但不得重新定义全局品牌色；同一页面缩放时必须保持背景、正文、线条和强调色身份一致。
- 全局 Header 保持一个紧凑横向身份组：较大的 `xingbuild` 后接较小的 `金星 Xingjin`，关系间距 8px、基线对齐，不增加圆点、@、分隔符、第二行或额外高度。所有页面均 sticky，滚动时保留三项主导航并保持高度不变；作者文字来自站点内容字段，不硬编码到 markup。
- Sticky Header 有两个明确视觉状态：顶部时与画布融合；内容滚入其下后，使用全视口暖色半透明背景、克制 blur 和轻 shadow 建立更高层级，不改变高度或移动内容。Reduced motion 禁用过渡。`xingbuild` wordmark 保持暖色正文色，作者信息保持 muted；强调色仅用于当前导航、选中状态、hashtag、focus 和克制交互反馈。
- 字体层级按角色定义，不按页面定义：`wordmark → 首页定位 → 页面/对象标题 → 模块/章节标题 → 阅读正文/摘要 → metadata/source`。首页定位语是唯一 H1，并占据双栏外的完整 shell 行。B端产品和经营观察来源对象在来源页与首页投影中使用相同标题角色，只改变语义 heading level；通用分类标签不得变成超大标题，页面/对象标题不使用强调色装饰。
- 复用的框架投影必须从自身根节点逐级推进语义 heading：来源页保持 `H1 → H2 → H3`，首页投影保持 `H2 → H3 → H4`；共享视觉角色不得压平文档层级。
- 手机导航使用图标按钮和全视口 overlay；打开时必须在视觉上替换页面、锁定背景滚动，并把控制按钮变为关闭图标。
- 页面层级依赖字体、对齐和留白；不使用装饰性横线或盒子作为通用布局脚手架。只有表达真实关系或边界时保留线条，例如业务架构图。
- 重复可点击集合使用一个共享交互卡片系统。边界只用于标识真实、可点击的内容对象，不把任意章节装进装饰盒。ObservationBlock 使用安静的暖色信息块表面，不使用 border、shadow、lift、line 或装饰 divider；页面与 rail 投影复用同一结构。
- 共享卡片系统统一全站 shell、间距角色、字体角色、surface/border、点击区域、hover、focus-visible 和响应式行为；卡片只能按少量已声明的内容类型 schema 变化，不允许页面专用样式或一次性交互变体。
- 同一内容类型的所有实例使用相同字段顺序和结构。Article preview 不在 featured card 与 compact row 之间切换语法；work entry 不创造页面专用 metadata 排列。强调只可在必要时改变 grid span，不得改变字段顺序、交互或内部间距。
- 卡片阅读顺序保持读者优先：标题 → 简明解释/摘要 → 识别、时间或决策所需 metadata。省略不能帮助识别、时间判断或决策的 metadata。
- 整张卡片是主链接；只使用一个克制 hover 和清晰的键盘 focus，不在标题或卡片已经可打开内容时增加“继续阅读”等重复 CTA。
- 桌面集合使用一致 grid 和 card gap；手机保持同一内容 schema 并投影为单列。同类型同一行卡片视觉对齐，但不同内容类型不为对齐而制造虚假字段或相同文本长度。
- 垂直间距必须表达前后内容对象的关系；段落、标题、列表、callout 和 section rhythm 由相邻语义角色定义，避免统一 margin、意外 margin collapse 和相邻组件双重间距。
- 视觉结构是持久层级：page frame → section → content group → content object → element → adjacent relationship。父级 flow 负责 sibling 间距，子对象只负责内部构成；模板变化时保留该层级，不复制旧像素值。
- 数字必须传递语义，不模拟结构。序号只用于有序步骤、排名、稳定引用索引或已知序列位置；年代和日期表达时间，数量只在帮助集合导航时使用。不得为视觉风格给命名章节、无序作品、能力或主题编号。
- Footer 只包含紧凑 copyright 和当前产品版本。作者、地点和更新时间属于相关内容，不进入全局 chrome；纯内容发布不改变显示的产品版本。
- 图表使用简单、直接的业务架构风格，不使用手绘、sketch、水彩、notebook、植物、风景或装饰隐喻。
- 内容、presentation 和视觉 token 分离，使未来编辑不需要重写页面组件。
- career 与 Robotaxi 项目继续作为上游事实权威；网站内容是版本化展示快照，必须保留证据边界。
- 手机导航采用内容驱动断点：低于 520px 才启用全屏菜单；约 557px 宽度保留紧凑行内 Header。全屏菜单从 Header 下方开始，不垂直居中短链接列表。
- 视觉迭代只保留当前有效交互原型和明确要求的最终证据；评审价值结束后删除被拒 mock、被替代截图和临时浏览器 profile，不积累无效视觉资产。
- 浏览器渲染必须有界、串行；采集后不得遗留 preview server、headless Chrome、Playwright runtime 或临时 browser profile。下一次渲染前确认上一次进程退出；HTML/SVG 检查足够时不生成截图。
- 日常 Observation 发布与网站产品版本迭代分离。已发布内容只位于 `content/observations/`；本地 candidate/draft 只位于被忽略的 `.content-workspace/`，不得进入生产 bundle。
- Observation 内容使用 `ObservationPublication → EvidenceUnit → Source` 合同。候选工具可以规范 lifecycle state，但不得虚构事实、来源、经营影响、日期或证据关系。
- 产品版本使用 `publish-xingbuild.command`、要求匹配 tag 并运行完整 release check。纯内容发布使用 `publish-content.command`、保持产品版本不变、只接受一项已发布 Observation，并拒绝工程、配置、规则、worker 或 draft 混入。
- 定时 task 只能生成 candidate；人工审核和明确生产授权仍是 promote 或任一发布命令的前提。

## 日常内容运营责任

- 定时采集 task 只负责发现、去重和核验可信信息，交付包含事件日期、主体、维度、原始事实、claimKind、来源 URL/发布者/日期/等级、事实与来源引用、冲突与未知项的“可信证据候选包”；不得提前决定公开标题、摘要、正文或执行发布。
- X 平台是经营观察的一级实时信息源：优先使用可验证身份的监管/政府机构、公司官方账号、负责人、研究者、行业媒体记者与一线专业人士的原帖，并可使用用户已登录账号获取。每条 X 信息必须保留原帖 URL、账号身份/角色、发布时间与访问时间；截图、搬运号、匿名爆料或无法确认身份的账号不能独立进入候选。账号主体决定来源性质：公司或负责人原帖为 company statement，专业人士的现场/分析帖为可归因线索或 opinion，不自动升级为 verified fact；涉及运营规模、安全、监管、收入等关键事实，除监管或公司正式披露外，仍须以独立原始来源或可信报道交叉核验。
- 内容及发布 task 负责事实审核、Brief/Article/不发布判断、字段与结构适配、面向网站读者和用户本人的可读性复核，以及目标 slug 的单条发布与公网验收；可以调整公开表达和结构，但不得改变上游事实、来源性质或证据边界。
- 日常内容运营固定分为三段：ops 采集只产出可信证据候选、去重结果与覆盖记录；内容及发布 task 只作公开表达、事实审核与发布/不发布判断；终端命令只对已经审核的单个 slug 执行可验证的机械步骤。终端不得代替选题、事实判断或公开文案判断。
- 日常最小终端交接已交付为：审核确认后执行 `npm run content:approve -- --slug <slug> --authority <authority>`，再创建独立内容提交，并执行 `./publish-content.command --slug <slug>`。前一命令在共享 JS 能力层聚合既有 review + promote，只处理显式目标 slug，并以目标级回滚保证失败不留下半状态；提交、推送、部署和公网验收仍须作为独立状态报告。命令缺失或失败时不得绕过审核、自动发布或改用宽范围命令。
- 产品与视觉 task 负责网站目标、信息架构、内容对象、页面责任、视觉系统、响应式和验收合同；不参与日常选题、写稿或逐条发布。只有内容对象、页面结构、视觉、响应式或发布能力需要更新时才介入，并与 Engineering 形成一次串行产品版本。
- Engineering 只实现和验证已确认的产品、视觉或发布能力合同，不决定内容观点，不为页面方便复制或改写业务事实。
- 网站能力完成后，日常内容运营只产生独立内容提交，不改变产品版本或 tag；实现、内容提交、push、部署和公网验收仍分别报告。
- Ops 的来源选择、检索窗口、账号/站点清单、去重与 no-change 结论必须记录在内部覆盖台账；该台账用于证明采集质量与发现盲区，不进入读者页面。
- 旧研究 task 在有效决策、事实源和未完成项形成不超过 20 行检查点，并确认替代自动化稳定后归档；新自动化不因主题相同而自动继承旧 task 历史。

## 规则语言

- 规则和解释以中文为主要叙述语言；命令、文件名、字段、枚举、API、skill 和必要技术名称保留英文。
- 英文技术词第一次出现时尽量提供紧邻的中文含义，例如“候选（candidate）”“草稿（draft）”；不得为了双语形式复制整段规则，以免增加读取成本并造成中英文漂移。
- 如果外部工具强制要求英文指令，同一位置必须提供简洁中文等义说明；中文和英文发生冲突时，以项目已确认的中文产品决策和可验证工程合同为准。
- 展示母版：B端产品与经营观察共用 ShowcaseLayout。桌面主展示区内部固定为208px说明列 + 20px关系间距 + 占余宽的SystemStage；说明垂直居中，媒体/视频/受控系统页面/GraphCanvas是视觉主角。Robotaxi 使用批准媒体或上游提供的稳定公开场景；企业经营体系的固定概念说明位于左列并只读取 career 同步快照/frameworkModel，网站或 AI 不得改写、概括或补造，图下不再设置 ExplanationPanel。
- 企业经营体系首个且当前唯一的局部入口是总览节点 `digital-implementation`。局部视图使用同一路径 `?view=digital-implementation` 并直接投影 `frameworkModel` 已有的 9 节点、13 边和权威说明；不得复制或改写概念与关系。刷新保留局部视图，局部默认选择 `b2b-product-architecture`；返回总览移除 `view` 并把 `digital-implementation` 作为返回焦点。首版不增加 node URL、第二个局部入口或二次下钻。
- 展示母版在手机端必须强化对象归属：同一对象内部 `SystemStage → explanation` 的间距为 12–16px，不同对象之间为 40–48px，至少形成约 3:1 的关系差。Framework 的选中节点解释紧随 GraphCanvas，以轻暖状态面和“当前节点”状态标识说明它属于上方图；定义、作用和直接关系仍只读取 frameworkModel，不得改写。桌面 208px + 20px + SystemStage 合同不变。
- 布局母版：桌面唯一 shell 最大1280px、外边距至少32px；完整双栏为952px主展示区 + 24px + 固定304px rail，只有SystemStage仍可保持至少640px有效宽时成立。集中观察页、Article 与 About 共用居中736px ReadingShell；移动20px gutter、窄屏16px。无有效 Brief 时不保留空 rail。
- ObservationBlock：identity 固定为单行 `subject · eventAt`，subject 最大16个全角等价字符；dimension 独占一行且当前不可点击；body 为80–160个中文等价字符、建议2–3句和一个段落；source 为最后一行且默认与辅助信息同色。有长文时在同一块内增加 ArticlePreview，普通 Brief 不创建详情页。
- 观察层级与返回：第一层首页/B端产品/经营观察可直接进入长文，或先经“更多观察”进入集中观察页再进入长文；长文逐层返回真实上层，并提供经营观察栏目入口。返回上下文必须使用安全站内 origin/returnTo 并在刷新后成立，不能只依赖 history.back。
- 富文本母版：Article 与 About 共用 RichDocument，只允许 lead、H2/H3、paragraph、list、definitionList、figure、callout、sources 等受控 block；页面不得直接写业务正文 JSX、私有字号或任意 margin。内容块、类型令牌和相邻关系一旦验收，后续只增改内容而不改页面组件。
- 内容入口收口后，Robotaxi 模块只通过受控 Practice 内容与已批准媒体 manifest 增加；观察内容只通过 ObservationPublication 中人工写入的显式 `presentation` 产生。二者都不得再通过页面、组件或视觉特例填充。
- Robotaxi 作品媒体分为三个责任：`media` 是读者可见的图片或未来视频内容；`action` 是可选读者互动，当前全框链接到经批准的 Robotaxi 独立系统；`provenance` 保存审批状态、媒体角色、状态边界、版本、Git commit 与哈希，不默认投影为读者界面。manifest 是生命周期与 provenance 事实记录，不等于公开集合；只有总 publication active、manifest/资产逐项 review 与 approval 为 approved、资产 publicStatus 为 public，且文件/hash/version/provenance 校验通过时才能投影。suspended、superseded、paused、pending_review、revoked、internal 或哈希不一致的记录必须保留追溯但不得进入读者界面。

## 迭代与发布工作流

## 跨 task 协作边界

- 产品版本必须串行推进：当前版本未完成实现、验证、专业验收与约定的本地收口前，不开启、不夹带、不宣告下一版本；跨 task 检查点必须明确当前唯一版本、已完成证据、未完成项与下一动作。
- task 不是历史数据库。跨 task 只传递决策摘要、当前事实源或证据路径、修改文件、未完成项、执行范围与验收合同；不传递完整媒体、base64 或无界历史。
- Engineering 不为“复盘历史”读取其他 task 全历史或媒体。复盘默认只读当前项目事实源与明确列出的决策；信息不足时列出缺口，不扩展取证。
- 实现、验证、提交/标签、推送与发布必须分别报告；正式版本 tag 只由当前主线发布责任任务创建。
- 浏览器验证必须串行且结束即释放资源。发现单个浏览器工作进程超过 2GB、Codex 合计超过 6GB、swap 持续增长或重复 worker 时，立即停止验证并请求用户决定；不得自行终止或清理用户进程。

- 修改产品内容、结构、视觉语言、部署行为或域名配置前，先阅读 `docs/rules/iteration-and-release.md`。
- 当前迭代只记录在 `docs/iterations/current.md`；已完成方案移动到 `docs/iterations/history/`，不得回写已完成历史。
- 标准本地启动入口使用 `./start-xingbuild.command`。
- 宣称迭代完成前运行 `npm run release:check`。
- 稳定迭代通过验证后，正常收口动作是创建本地 Git commit 和同名版本 tag；这不授权远端 push 或生产部署。
- 创建 commit 前，先 stage 本版本预计范围并运行 `npm run release:closeout-check`；它会拒绝未 stage 或未追踪的跨版本残留。带 tag 的本地版本只有在 `npm run release:preflight` 确认 main、空工作区、package/version/current iteration 一致、HEAD tag 匹配和 origin 正确后，才是可发布状态。任一检查失败时报告明确阻断，不得称为干净或可发布。
- GitHub remote 创建和首次 push 需要用户授权或明确执行请求；后续 push 遵循该迭代的发布指令。
- 产品版本发布使用 `./publish-xingbuild.command`；纯内容发布使用 `./publish-content.command`。两者目标均为 EdgeOne Makers 项目 `xingbuild-nochina`（`makers-ze0f6txvlhco`）。通常由用户手动执行；除非用户在当前 task 明确要求，Codex 不得发布、触发远端部署、修改 DNS 或绑定生产域名。
- 发布命令不得包含 API token 或其他凭证。
- 发布与实现是不同状态：代码完成、本地验证、提交、部署、域名生效和公网验证必须分别报告。
- `xingbuild.top` 是个人网站 canonical domain；`www.xingbuild.top` 只用于重定向到 canonical domain；`robotaxi.xingbuild.top` 属于独立 Robotaxi 部署，不得由本仓库发布。
- 每轮迭代完成报告必须同时提供可点击的本地预览 `http://127.0.0.1:4317/` 和生产网站 `https://xingbuild.top/`，并区分本地验证与生产部署状态。
