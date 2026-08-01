# xingbuild 迭代、启动与发布规则

## 1. 目标

让每次网站调整都形成一个短闭环：

> 明确目标 → 更新当前迭代 → 修改内容或代码 → 本地验证 → 形成稳定版本 → 发布 → 公网验证 → 记录结果

这套流程服务于快速迭代和真实验证，不复制 Robotaxi 的重型业务版本体系。

## 2. 事实源和责任边界

- `career`：职业定位、经历事实、能力判断和企业认知框架的上游事实源。
- `Robotaxi`：Robotaxi 作品状态、代码和运行结果的上游事实源。
- `xingbuild`：网站内容快照、视觉、交互、代码、测试和发布的唯一事实源。
- EdgeOne：线上部署状态、域名绑定、证书和访问状态的运行事实源。

网站可以重组表达，但不得自行提升上游事实、项目完成状态或结果证据。

### 2.1 跨 task 工作边界

- task 不是历史数据库。跨 task 交接只包含决策摘要、当前事实源/证据路径、修改文件、未完成项、执行范围和验收合同；禁止传递完整媒体、base64 或无界历史。
- 复盘默认只读取当前项目事实源和明确列出的决策。信息不足时报告缺口，不为补全历史自行扩展取证。
- 实现、验证、提交/标签、推送、部署和公网验收是独立状态；正式版本 tag 仅由主线发布责任任务创建。
- 浏览器验证串行执行并在结束后释放资源。单个浏览器工作进程超过 2GB、Codex 合计超过 6GB、swap 持续增长或出现重复 worker 时，立即停止验证并请求用户决定；不得自行终止或清理用户进程。

### 2.2 并行设计与串行交付

- Engineering 当前产品版本从实现开始，直至实现、验证、专业验收、提交/tag、push、部署和公网验收全部完成，必须保持唯一且严格串行；任何较早状态都不得作为开启下一产品版本的依据。
- 产品方案可以在独立 task 与隔离 worktree/branch 中并行推进，但只能形成明确标记为 `DRAFT（草案）` 的设计文档或有界决策检查点，不等于当前迭代、实现授权或发布计划。
- 并行草案不得修改 `docs/iterations/current.md`、`VERSION.md`、产品代码、依赖、发布配置或正在执行版本的验收合同，也不得在当前版本收口前合入主线。
- 草案至少记录事实源、已确认决策、明确非目标、待确认项和建议的后续版本；跨 task 仍只传递不超过 20 行的决策与状态检查点。
- 当前版本完成全部串行交付状态后，仅由产品与视觉责任 task 将已确认草案整理为正式方案并批准进入 `docs/iterations/current.md`，再交 Engineering 开启下一个唯一版本。
- 内容运营、媒体替换和其他不改变产品能力的工作继续遵守各自独立合同，不因产品草案并行而转为产品迭代。

### 2.2.1 DRAFT、主线与版本提交门禁

- `DRAFT（草案）` 是未确认的产品/视觉候选，不是当前版本，也不是发布输入。它不得进入主线版本提交、版本 tag、push、deploy 或公网验收。
- 产品 DRAFT 必须位于独立 task 的隔离 branch/worktree；可以在该隔离位置提交以保留连续性，但不得写入主线的 `current.md`、`VERSION.md`、代码、依赖或发布配置。
- 只有用户和产品责任 task 明确确认、补齐事实源/非目标/验收、指定目标版本，并将状态从 `DRAFT` 改为正式方案后，才允许写入 `current.md`，再交 Engineering 实现。
- 版本收口只暂存 `current.md` 明确列出的文件。未转正的 DRAFT、无责任归属的历史修改和未追踪文件必须在版本收口工作区之外保存；不得为了通过门禁临时挑选、改名或混入文件。
- 其他 task 的未纳入修改不得删除或覆盖。需要收口时，使用独立 branch/worktree 或可逆的有记录隔离，并在收口后完整恢复。
- 内容 `draft` 是另一条内容生命周期，继续只存在被忽略的 `.content-workspace/`，无论是否已人工审核，都不得进入产品版本提交。
- 因此“DRAFT 不进入版本”指不进入未确认方案的产品版本交付；DRAFT 经过确认并正式进入 `current.md` 后，才可作为目标版本的一部分。

### 2.3 统一问题登记与转入

- 可验证问题先进入责任域的唯一 tracked 问题清单；task 不维护私有 backlog，也不以完整会话历史保存问题。
- 问题使用唯一 ID，并记录状态、证据、影响、临时控制、责任 task、是否需要产品版本、下一动作和关闭验证。跨 task 只传 ID 与当前检查点。
- 内容运营问题统一登记在 `docs/operations/内容运营与发布问题清单.md`。内部规则修正使用独立文档提交，不改变产品版本/tag，也不夹入内容提交。
- 只有公开内容对象、信息架构、页面投影、视觉/响应式或发布能力合同需要改变时，产品与视觉 task 才批准其进入 `docs/iterations/current.md`。
- Engineering 只实现当前迭代中已批准的问题；发现相邻问题时登记，不顺手夹带。问题关闭时保留 commit/tag（如适用）与验证结果。

#### 2.3.1 当前版本进行中的新优化

当前版本尚未完成时发现的新优化，统一先写入当前唯一指针 `docs/iterations/current.md` 的“在途变更登记”，不得只留在 task 消息、私有笔记或新建无责任归属的 backlog。

每条登记使用唯一 ID（例如 `V020-OPT-001`），至少包含：

```text
ID / discoveredAt
发现事实与证据路径
要解决的问题和用户影响
分类与优先级：P0 当前阻断 | P1 当前范围内 | P2 后续候选 | 内容/运营
当前决定：adopt-current | defer-next | route-content-ops | reject | closed
是否改变当前范围或验收
责任 task / 下一动作 / 决定时间
```

处理规则：

1. **P0 当前阻断**：影响安全、事实正确性、公开合同或当前验收时，产品 task 先登记并通知 Engineering 在安全检查点暂停相关路径；确认后才可更新当前范围和验收。
2. **P1 当前范围内**：不改变产品目标和公共合同、且能在当前范围内验证的，登记为 `adopt-current`，补充当前方案/验收后再实现；不得借机夹带相邻功能。
3. **P2 后续候选**：不影响当前验收或需要新能力的，登记为 `defer-next`；完整设计进入明确标记的 `DRAFT`，路线图只增加版本队列指针，当前 Engineering 继续原范围。
4. **内容/运营**：交内容、Ops 或问题清单合同处理，不进入产品 current，也不要求 Engineering 等待。
5. **reject / closed**：记录理由和证据，不能删除登记来抹去决策历史。

只有 `adopt-current` 才能改变当前版本的目标、文件范围或验收；产品 task 必须先更新 `current.md`，Engineering 才能执行。`defer-next` 不得修改当前版本或让当前版本等待未来方案。

版本收口时，所有登记必须变为 `closed`、`defer-next` 或已明确交给内容/运营；未决条目不得藏在 task 历史中。历史版本只记录最终决策和结果，完整候选方案保留在对应 DRAFT 或问题清单。

### 2.4 事件驱动的跨 task 调度

项目版本串行约束交付顺序，不要求多个 Codex task 同步阻塞。跨 task 协作固定为：

> 事实源就绪 → 异步交接 → 源 task 结束当前回合 → 目标 task 独立执行 → 主动回传里程碑 → 责任 task 被事件唤起 → 验收或下一授权

- 每次交接必须写明：项目与唯一 current、目标 task、回传 task、事实源路径、允许范围、禁止范围、目标里程碑、遇到合同冲突时的阻断条件和完成后的下一授权方。
- 交接成功后，源 task 不得通过持续 `wait`、`wait_threads`、sleep、重复状态读取或空轮询维持当前回合；项目责任仍然存在，但当前 task 回合应结束。
- 目标 task 对普通专业判断负责并连续执行，不因需要阶段性汇报而暂停；只有事实源缺失、产品合同冲突、破坏性操作、新外部授权或用户必须决定的选择才可停止。
- 目标 task 到达约定里程碑后，必须主动向指定回传 task 发送不超过 20 行的检查点；检查点只包含版本、事实源/commit、已完成证据、未完成项或阻断 ID、下一授权，不复制方案正文或历史。
- 回传 task 只在收到里程碑、合同冲突或用户新指令时恢复；没有新事件时不得定时唤醒自己或目标 task。
- 用户查询状态时，只允许一次即时快照（例如 `timeoutMs: 0`）或读取目标 task 已主动回传的最新检查点；查询结束后不得自动进入持续监控。
- `等待上游输入`、`blocked` 或“待用户授权”表示目标 task 已报告条件并结束当前回合，不表示后台调用等待工具。
- 只有用户明确要求“监控”“等待完成”或同一 task 内不可拆分的短时异步命令，才允许有界等待；每次等待不得超过沟通与资源规则允许的时长。

### 2.5 多项目与项目 Agent

- 每个项目的根 `AGENTS.md` 是该项目目标、事实源、责任边界、版本、验证和发布规则的唯一项目入口；项目特有规则不得只存在于其他项目或某个 task 历史中。
- 跨项目共通原则可以保持同一最小合同，但项目特有字段、版本、命令、证据和发布门槛必须由该项目的产品/管理责任 task 在本项目中确认。
- 一个 task 可以提出跨项目标准或发送有界交接，但不得因此直接修改另一个项目的代码、版本、规则或发布状态；实际修改由目标项目明确负责该责任域的 task 执行并验证。
- 项目 task 是阶段性执行责任，不是永久历史数据库。长期事实进入项目文档、模型、代码、测试或问题清单；task 只保存当前检查点。
- 同一项目可以有产品与视觉、Engineering、内容与发布、Ops 等不同 task，但每项修改只能有一个执行 owner；其他 task 提供事实、验收或授权，不得双写同一文件、版本或发布动作。

## 3. 产品版本与观察内容发布

### 3.1 版本迭代

用于页面结构、内容模型、视觉系统、作品详情、发布架构等形成可辨识能力的变化。

版本号格式：`v主版本.能力版本.稳定修订`，当前从 `v0.1.0` 开始。

### 3.2 快速修订

用于文案、间距、颜色、响应式缺陷、链接等局部调整。多个快速修订可以在验证稳定后合并成一个版本。

不为每次对话、每次试验或未完成尝试增加版本号。

### 3.3 日常观察内容发布

日常 Observation 发布不是产品版本迭代。内容准备与生产发布是两个阶段，保持 `package.json` 版本和既有产品 tag 不变：

- 不要求新版本号、设计方案、`VERSION.md`、版本 tag 或全站七档验收；
- 编辑准备固定为 candidate → draft → 本地直接预览 → 人工事实审核及内容 SHA-256 → promote；日常终端以 `npm run content:approve -- --slug <slug> --authority <authority>` 在共享 JS 能力层受控聚合 review + promote；
- 生产发布固定为 checks → 独立内容 commit → `publish-content.command --slug <slug>` → push → EdgeOne → 公网验收；
- 人工审核 sidecar 至少保存 slug、`status=approved`、reviewedAt、authority 和 contentHash；draft 改动后 hash 不匹配必须失败；
- promote 只接受目标 slug 的有效 draft 和匹配审核记录，保留原 draft、审核记录与精确恢复副本，不让后续失败形成不可解释半状态；
- `content:approve` 要求唯一非空 slug 与 authority；成功只新增目标 review、recovery 与 production 并保留 draft，任一步失败精确回滚本次新增文件，不覆盖既有 draft、review 或 production；
- push、部署或公网验收任一步失败时，目标 draft、review 与 recovery 必须全部保留，以支持同一 HEAD 重试；
- 只有 `verify-content-release` 公网验收成功后，才精确 finalize 目标 slug：删除该 slug 的 draft、review 与 recovery 三份临时事实，不使用通配且不触碰任何无关 workspace 文件；
- 必须通过目标 schema/事实边界/来源/Brief 合同、`content:check`、slug scope check、build 和 Sites test；
- 必须保留来源、逐条 `sourceRefs`、证据性质和边界；
- 必须形成独立 Git 提交；范围只能是 `content/observations/<slug>.json` 与该对象必要的 approved media，产品版本不得变化；
- 发布前必须满足 `origin/main == HEAD^`；push 后的部署或公网验收重试必须保持同一 HEAD，不创建替代提交；
- 无关 slug 的 ignored candidate/import/draft/review 可以并存且不得阻断；目标 slug 的 candidate/import 冲突、审核缺失/hash 不符或重复 production 必须失败；
- `content:approve` 不扫描、不删除也不修改无关 workspace；目标已有 review、recovery、production 或 candidate/import 冲突时硬失败，不得用该机械命令代替人工选题、写稿、事实审核、内容提交或发布授权；
- 发布仍需用户执行 `./publish-content.command` 或在当前任务明确授权；
- Scheduled task 只能产生可信证据候选，不能决定 Brief/Article 表达、人工审核、promote 或生产发布。

`ObservationPublication → EvidenceUnit → Source` 是观察内容的固定三层模型。缺失字段必须失败或保留明确待补项，脚本不得虚构事实、来源、经营影响或证据关系。

Robotaxi 作品媒体是独立于观察的受控内容入口：`media` 保存读者可见的图片或未来视频，`action` 保存可选读者互动，`provenance` 保存上游 approved manifest 的媒体角色、状态边界、版本、Git commit、SHA-256 与审批记录。Git commit 是内部来源记录，不要求转换为网页 URL；只有 `approved/public`、审批记录有效且本地文件 SHA-256 一致的媒体可以导入。draft、rejected、revoked 或哈希不一致的资产必须失败，不得以页面占位、截图或泛化链接替代。

本地 candidate、import、draft、review、recovery 和 superseded 记录只允许位于被 Git 忽略的 `.content-workspace/`。生产读取层只消费 `content/observations/`；生产 bundle、静态资源和目标 slug 解析不得读取或暴露 workspace 路径与治理记录。

`.content-workspace/imports/` 使用安全消费语义：只有候选校验通过、文件名与 slug 一致且 draft 通过排他写入成功后，导入工具才删除这一条精确输入；外部输入和任何失败输入必须保留，不允许通配清理。

新观察进入人工审核前，必须分别在 1440px 与 390px 核对标题中的完整业务词组。只有真实渲染确认发生拆词时，才在该内容的必要词组中加入最小 WORD JOINER；不得以固定换行、视口专用文案或自动中文分词替代人工语义判断。

Supersede 只处理未发布草稿：必须显式提供 old slug、canonical slug、reason 和 decidedAt。原稿按精确文件名归档到 ignored `.content-workspace/superseded/`，sidecar 保存 `supersededBy/reason/decidedAt/contentHash`；canonical 不存在、hash 无法记录、old 已发布或出现通配清理时失败。已发布内容撤下不属于日常 supersede。

### 3.4 常青文章内容发布

`EvergreenArticlePublication` 的日常更新同样不改变产品版本或 tag。提交必须显式指定一个文章 slug，且范围只能包含 `content/articles/<slug>.json`、该文章引用的可编辑图形源和生成 SVG；必须通过 `article:check`、`article:scope-check`、build、Sites 和目标 URL/manifest 验证。当前图形适配器锁定 Mermaid CLI 11.16.0 与 LikeC4；D2 是未来可选 adapter，未锁定并通过专项验收前不得在内容对象中声明。`publish-article.command --slug <slug>` 只允许推送已验证 HEAD 并部署既有项目；它不接受页面、规则、版本或无关内容混入。

## 4. 当前迭代

唯一当前指针：`docs/iterations/current.md`。

已确认方向的版本先后、进入条件和跨版本文档包以 `docs/iterations/roadmap.md` 为准；路线图不是当前授权，不得绕过 `current.md` 直接实现候选版本。

每轮开始时至少记录：

- 要解决的问题；
- 本轮范围和明确不做的内容；
- 涉及页面、内容对象和工程文件；
- 验收标准；
- 当前状态。

完成后将计划移动到 `docs/iterations/history/v{版本号}.md`，再重置当前指针。历史文件只用于追溯，不回写。

## 5. 标准启动

双击根目录的 `start-xingbuild.command`：

1. 检查 Node.js 和依赖；
2. 缺少依赖时安装锁定版本；
3. 执行项目结构检查；
4. 启动 Vite；
5. 使用固定地址 `http://localhost:4317/`。

不要同时启动多个 xingbuild 服务。开发服务器支持热更新，保持一个进程即可。

启动指令必须复用并打开已有的正常 xingbuild 服务；没有服务时固定使用 4317 并自动打开浏览器；端口被异常或其他进程占用时停止并明确提示，不得静默切换到其他端口。终端同时显示本地网站与线上网站地址。

## 6. 完成与发布前检查

任何准备交付或发布的版本必须执行：

```bash
npm run release:check
```

在提交本轮版本前，先暂存预计提交范围并执行：

```bash
npm run release:closeout-check
```

它会阻止未暂存修改或未追踪文件跨入本次收口。通过后再提交与打标签。

本地提交和标签完成后、双击发布前，再执行一次快速只读门槛：

```bash
npm run release:preflight
```

它只核对 `main`、工作区为空、`package.json`/`VERSION.md`/当前迭代版本一致、`HEAD` 标签一致和预期 `origin`；不联网、不构建、不部署。只有该命令通过，版本才是“可发布”，不能把“已提交并打标签”误报为“工作区干净或可发布”。若存在下一轮未提交工作，必须先由负责人决定提交、暂存隔离或延后发布，不能混入当前稳定版本。

检查包括：

- 必需项目文件和内容入口存在；
- 包版本与当前版本记录一致；
- 生产构建成功；
- Sites/Worker 兼容测试通过；
- 生成可部署静态产物。

涉及视觉或响应式变化时，还必须进行桌面和手机真实页面验证。构建成功不等于视觉验收完成。

日常内容发布执行更窄的内容专项门槛：

```bash
npm run content:check
npm run content:scope-check
npm run build
npm run test:sites
```

内容专项验证聚焦 schema、枚举、来源引用、事实边界、草稿隔离、目标文章与相关集合，不替代首次建立或修改内容系统时的产品版本完整验收。

## 7. EdgeOne 发布

生产发布入口由用户手动执行：

```bash
./publish-xingbuild.command
```

默认权限边界：

- Codex 可以在稳定迭代完成后执行本地 Git 提交和版本标签；
- 本地提交不等于推送 GitHub，也不等于发布线上；
- GitHub 仓库创建、首次推送、EdgeOne 发布、域名绑定和 DNS 修改需要用户明确授权；
- 常规情况下由用户双击发布命令；
- 只有用户在当前任务中明确要求“直接发布”时，Codex 才能代为执行线上发布。

发布命令按顺序执行：

1. 执行 `release:preflight`，确认当前位于 `main`、工作区干净、版本记录与 HEAD 标签一致；
2. 确认 GitHub origin、EdgeOne CLI 和登录账号可用；
3. 运行完整发布前检查并生成带版本和提交标识的 `release.json`；
4. 推送版本标签和 `main` 到 GitHub，并确认远端提交一致；
5. 将 `dist/client` 发布到 EdgeOne Makers 的 `xingbuild-nochina` 生产环境；
6. 访问 `xingbuild.top`，核对页面、版本号和 Git 提交；
7. 只有全部成功后才报告正式上线。

双击 `publish-xingbuild.command` 本身就是明确的生产发布动作，脚本不再要求二次输入 `publish`。一次执行同时完成 GitHub 同步和 EdgeOne 生产发布，但两者仍是独立步骤。GitHub 推送成功而 EdgeOne 失败时，必须报告“代码已同步、网站未上线”，不得把部分成功描述为正式发布。

### 7.1 内容专用发布

日常 Observation 使用：

```bash
./publish-content.command --slug <slug>
```

该命令不创建或推送版本 tag，但必须：

1. 缺失或非法 slug 立即失败，不从 HEAD 猜测目标；
2. 确认 `main`、工作区干净，目标 production 为完整 published Observation，审核 hash 与保留 draft 一致；
3. 只检查目标 slug 的 candidate/import 冲突；无关 ignored workspace 内容可以并存；
4. 确认 HEAD 只包含目标 Observation 与必要 approved media，相对父提交产品版本不变，且首次 push 前 `origin/main == HEAD^`；
5. 执行目标检查、全量 content check、生产构建和 Sites 测试，并拒绝任何 workspace 路径进入生产 source/bundle；
6. 只推送已验证 HEAD；若 `origin/main == HEAD`，仅允许以同一提交重试部署与公网验收；
7. 部署既有 `xingbuild-nochina` 项目；
8. 以目标 slug URL、稳定产品版本和同一 commit 完成公网验证，分别报告 push、部署和公网结果；
9. 仅在公网验证成功后精确 finalize 目标 slug 的 draft/review/recovery；失败时三者完整保留，同一 HEAD 的 post-push retry 成功后仍执行 finalize。

脚本存在不构成发布授权。GitHub 同步、EdgeOne 部署和公网验收仍需分别报告。

### 7.2 轻量访问概览

- xingbuild 只在 `https://xingbuild.top/`（以及正式支持并重定向到同站的 `www` 别名）页面 visible 累计 15 秒后，以 `site_code=XINGBUILD` 调用同源 `POST /api/visits/qualify`；隐藏时间暂停累计，每次页面加载最多触发一次。
- 本站 origin 的 localStorage 独立保存 `visitor_seed`，不得使用父域 Cookie、共享种子或服务端网络信息关联 Robotaxi 匿名身份。父域 `xingbuild_visit_excluded=1` 只表达本设备排除。
- localhost、127.0.0.1、preview、webdriver、自动 QA 和非正式域名不调用；本站不新增访问管理页面。
- Worker 使用 `visitHashSecret` 对 `site_code|visitor_seed` 执行 HMAC-SHA-256，截取前 24 位小写十六进制；以 `visit_<SITE_CODE>_<YYYYMMDD>_<visitor_identifier>` 在 `visitKv` 中按 Asia/Shanghai 自然日幂等。
- KV 对象只允许 `site_code/qualified_date/visitor_identifier/first_qualified_at/last_qualified_at/device_type/website_version` 七字段；`qualified_date` 固定为 `YYYYMMDD`，`device_type` 只允许 `MOBILE/DESKTOP`。不得记录或推导 IP、地区、路径、点击、来源、输入、业务数据、精确时长、会话心跳或结束事件。
- 每次合格写入执行有界 30 天旧 key 清理。`visitKv` 和至少 24 位的 `visitHashSecret` 属于 EdgeOne 外部配置门禁；未绑定时接口必须失败，本地实现不得声称公网能力可用。

首次发布前需要一次性完成：

1. 执行 `npm ci` 安装项目锁定的 EdgeOne CLI；
2. 登录与当前 EdgeOne 免费账号一致的区域；
3. 在 EdgeOne 建立或确认 `xingbuild-nochina` 项目；
4. 绑定 `xingbuild.top`；
5. 配置 DNS CNAME 和 HTTPS；
6. 确认生产域名。

凭证只由 EdgeOne CLI 或控制台管理，禁止写入脚本、Git、文档或 `.env`。

当前生产项目固定为：

- EdgeOne 项目：`xingbuild-nochina`
- 项目 ID：`makers-ze0f6txvlhco`
- 加速区域：全球可用区（不含中国大陆）
- 正式域名：`xingbuild.top`

项目名是发布目标合同。不得为了命名简洁改回 `xingbuild`，否则 CLI 可能创建或更新另一个项目。

## 8. 发布状态

沟通时必须区分：

- **实现完成**：内容和代码已修改；
- **本地验证完成**：完整检查和页面验证通过；
- **稳定版本完成**：版本记录、Git 提交和标签完成；
- **可发布**：稳定版本完成，且 `release:preflight` 已通过；
- **部署完成**：EdgeOne 报告生产部署成功；
- **域名生效**：`xingbuild.top` 已指向该部署且 HTTPS 正常；
- **公网验收完成**：通过桌面和手机从公网打开并验证核心页面。

任何前一状态都不能替代后一状态。

每轮迭代完成报告必须同时给出可点击的本地预览 `http://127.0.0.1:4317/` 和线上网站 `https://xingbuild.top/`。链接用于便捷访问，不代表对应状态已经完成；仍需分别说明本地服务、生产部署和公网验收状态。

## 9. Git 版本管理

本地 Git 是 xingbuild 代码和网站表达变化的版本事实源：

1. 每个稳定版本完成验证；
2. 更新当前迭代和 `VERSION.md`；
3. 检查变更范围；
4. 暂存本轮范围并执行 `npm run release:closeout-check`；
5. 创建本地提交；
6. 创建同名版本标签；
7. 执行 `npm run release:preflight`；只有通过后才报告“可发布”；
8. 需要共享、备份或触发 EdgeOne Git 部署时，再单独推送 GitHub。

本地 Git、GitHub 和 EdgeOne 分别承担不同责任：

- 本地 Git：差异、历史、回退和稳定版本；
- GitHub：远程备份、协作和可选的 EdgeOne 自动构建来源；
- EdgeOne：生产部署、域名、证书和公网运行状态。

不得因为已经提交而宣称已经推送，也不得因为已经推送而宣称已经上线。

## 10. 域名边界

- `xingbuild.top`：个人网站正式主域名。
- `www.xingbuild.top`：只做主域名跳转。
- `robotaxi.xingbuild.top`：Robotaxi 独立项目，由 Robotaxi 项目发布。

两个项目可共用根域名体系和 EdgeOne 账号，但不得共用构建产物、发布脚本或版本号。

## 11. 回退

- 不删除稳定 Git 标签和历史迭代记录。
- 线上出现问题时，优先在 EdgeOne 回退到上一个成功部署。
- 回退后记录失败版本、现象、影响范围和修复条件。
- 未完成公网验证前，不宣称问题已经恢复。
