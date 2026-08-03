# xingbuild 项目 Agent 入口

本文件只定义项目边界和事实源入口，不复制产品正文或完整工作流。开始任何工作前，按以下顺序读取：

1. [网站产品架构与视觉系统总案](docs/product/xingbuild%20网站产品架构与视觉系统总案.md)
2. [迭代与发布规则](docs/rules/iteration-and-release.md)
3. [当前唯一版本](docs/iterations/current.md)
4. `docs/iterations/candidates/` 下的活动候选文件；历史转化/关闭记录见 `docs/iterations/history/candidates/`

## 项目边界

- `xingbuild` 是作者主导的个人网站和持续演进的作品集合，不是在线简历。
- career 与 Robotaxi 是上游事实源；xingbuild 只保存经过核验的网站表达快照，不复制或改写上游业务事实。
- `xingbuild.top` 是本项目正式域名；`robotaxi.xingbuild.top` 由 Robotaxi 项目独立发布。
- 产品版本、内容运营、上游采集和问题治理是不同责任域。产品结构与工程能力使用统一产品版本身份；内容运营使用独立内容发布身份，不得把内容发布批次伪装成产品版本，也不得用内容快照制造第二套产品版本事实。
- 官方项目目录与 canonical `main` 是唯一长期基线；默认 task 直接使用官方目录（direct-local），不自动创建 branch、worktree 或 detached checkout。

## 责任边界

- 产品与视觉：维护产品总案、候选、正式版本方案、`current.md`，负责版本启动、候选转方案与归档、最终产品/视觉验收。
- Engineering：只实现已写入 `current.md` 的合同；负责代码、测试、本地收口、版本记录、commit/tag，并按授权完成 push、部署和公网验收。
- 内容与发布：负责事实审核、Brief/Article/Practice 结构、B 端产品页面内容和独立内容发布；不修改产品版本或视觉合同。详细合同只见 `docs/operations/内容运营与发布规则.md`。
- Ops：只生成可信证据候选、去重和覆盖记录；不写公开正文、不审核、不发布。
- 每个文件、版本和发布动作只有一个执行 owner；其他 task 只提供事实、验收或短检查点。
- Engineering 完成本地实现与自 QA 后，形成一个“本地提交版本”（版本号/名称/说明、代码提交、tag、版本记录和 clean 工作区），再交产品与视觉 task 验收；本地提交后任何修改都属于下一版本。
- 产品与视觉 task 验收本地提交版本；验收发现产品、视觉、对象边界或验收合同问题时，直接定义下一个 patch/小迭代/大迭代并写入 `current.md`，不重新创建普通候选。
- 产品与视觉验收通过后，只有用户明确要求 publish 时，Engineering 才执行线上发布；publish 成功后线上版本必须与本地提交版本的版本号和最终提交一致。
- `current.md`/history 只维护不可变的 local version identity facts（至少 `localSubmission`、版本号、HEAD、annotated tag、clean 状态）；产品/视觉验收、publish 授权和线上状态是提交后的外部 QA/发布事件，不得回写已打 tag 的 current/history。
- 每次 Engineering 或产品与视觉 task 收口都必须报告：本地版本状态、线上版本状态、本地 URL、线上 URL、已确定项、未确定项、候选状态、阻断和下一动作；无候选也必须明确报告等待用户下一步。

## 最小执行门禁

- 产品优化 DRAFT 只进入 `docs/iterations/candidates/`；未确认前不得修改 `current.md`、代码、版本或发布状态。
- 当前版本只由 `docs/iterations/current.md` 定义；已完成版本进入 `docs/iterations/history/`。
- Engineering 实施中发现的跨范围问题、运营工具/CLI/Skill 缺陷和新的产品优化先创建候选 ID；候选初始为 `status: pending`、`executionAuthorization: pending`，并先同步到 canonical `main`，由产品与视觉 task 评审后决定是否转化为产品设计方案。产品与视觉验收已提交本地版本时发现的问题不走普通候选，直接定义下一版本并写入 `current.md`。
- 候选只属于产品设计前阶段：产品与视觉确认并纳入正式设计方案后，必须在同一产品设计版本中记录来源并立即移入 `docs/iterations/history/candidates/` 归档；不得继续留在活动 candidates，也不得以长期 `confirmed` 状态等待 Engineering。`closed` 候选同样移入归档并保留关闭理由；只有未确认的 `pending`/DRAFT 留在活动 candidates。
- 运营工具、CLI 或 Skill 出现缺陷时必须立即停止该次运营操作，只登记候选并通知产品与视觉；禁止内容 task 或其他 task 为自己创建工程分支、修改 main 或绕过产品版本门禁。
- 日常内容更新和 Ops 运行记录只写被忽略的 `.content-workspace/`；不能创建第二个 tracked backlog。内容运营规则见 `docs/operations/内容运营与发布规则.md`。
- 新采集、候选、draft、审核和 recovery 仍是运营数据，不进入产品版本。产品 publish 只消费已完成产品/视觉验收的现有 local commit/tag；内容 publish 使用独立内容身份，不递增产品版本、不回写 package/VERSION/current/history、不创建产品 tag。产品工程实现与内容独立发布能力分别遵守各自版本合同。
- Publish 是线上发布执行器，不是版本创建器：版本创建只发生在 Engineering 本地提交闭环；publish 前后都必须围绕同一 HEAD/tag，构建后再次检查 tracked dirty paths，任何失败不得写入完成声明或继续后续阶段。
- main 只作为干净产品集成/发布基线；产品 DRAFT 与 Engineering 可使用有界 worktree，内容 task 只调用内容规则允许的 CLI（CLI 内部临时 worktree 不属于产品工程分支），禁止共享脏工作区。内容 task 不得以内容发布为由修改产品版本或创建产品分支。
- 任何 branch/worktree/并行 task 都必须得到用户明确授权，并在启动时记录目的、范围、责任 task、canonical HEAD 与清理条件；未获明确授权不得创建或复用。
- task 创建与 task 交接是两种不同动作：普通“执行”、版本推进或规则更新不等于创建 Engineering/内容/Ops task。交接只能发送给用户已明确指定且已存在的目标 task；找不到、无法确认或目标 task 不存在时，必须向用户报告并等待确认，不得自行创建、猜测、替代、轮询或保持后台等待。
- task 归档前必须确认 canonical 已同步、所有修改已分类、官方工作区 clean，并清理本 task 创建的临时 worktree；未确认归属的脏改不得删除或混入版本。
- 产品预览固定使用 `4317`，必须绑定当前 worktree、HEAD、PID 和 task；不换端口、不终止未知进程。
- 详细迭代、分支、端口、验证、回退和发布规则只以 `docs/rules/iteration-and-release.md` 为准。

## 原型与视觉实施

- 重大视觉修改且视觉事实源不明确时，先使用 Product Design 的 `get-context`；不要用临时截图或页面私有样式替代已确认设计。
- 保持 `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs` 和 Sites 测试完整；交付 Sites 前运行 `npm run build` 与 `npm run test:sites`。
- 生成器命令（`architecture:views`、`framework:data`、`framework:layout`、`article:figures`）只在源/产品方案变更后、local commit 前显式运行；`npm run build`、`release:check` 与 publish 构建只读消费已提交生成物，不回写 tracked `src/generated/` 或 `public/`。
- 业务验证和构建必须在 publish 前通过 `release:prepare`/`release:build` 完成；publish/unified product 只做既有 `dist/client` 的身份校验、线上传输、部署和公网 manifest 验证，不包含网站业务逻辑。
- 内容发布不调用产品 `release:preflight`、产品 closeout 或产品 tag 门禁；其内容校验、内容身份、部署和公网内容验收以 `docs/operations/内容运营与发布规则.md` 为准。内容独立发布能力未完成前，内容 task 只能确认和预览，不能绕过工程能力上线。
- 内容发布固定使用 `content:prepare` → `content:build` → 独立 transport；发布包只写 ignored `.content-workspace/releases/`，临时 staging copy 构建，canonical `main` 不写 tracked 内容。
- 发布阶段统一遵守四阶段：`release:prepare` → `release:build` → `release:closeout-check`/`release:preflight` → transport-only publish；失败进入 `docs/rules/iteration-and-release.md` 的 Publish Incident 决策门。
- EdgeOne publish 目标固定为 `xingbuild-nochina` / `makers-ze0f6txvlhco` / `xingbuild.top`，不得用环境变量静默覆盖。

## 协作语言

规则以中文为主；命令、文件名、字段、枚举、API 和必要技术名保留英文，并在首次出现时给出简短中文含义。task 消息只传候选 ID/文件路径、版本/commit、证据、阻断 ID 和下一动作，不传完整历史或媒体；消息不能替代候选文件。
