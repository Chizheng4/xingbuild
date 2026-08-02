# xingbuild 项目 Agent 入口

本文件只定义项目边界和事实源入口，不复制产品正文或完整工作流。开始任何工作前，按以下顺序读取：

1. [网站产品架构与视觉系统总案](docs/product/xingbuild%20网站产品架构与视觉系统总案.md)
2. [迭代与发布规则](docs/rules/iteration-and-release.md)
3. [当前唯一版本](docs/iterations/current.md)
4. [产品优化候选入口](docs/iterations/candidates/)
5. [运营文档入口](docs/operations/README.md)

## 项目边界

- `xingbuild` 是作者主导的个人网站和持续演进的作品集合，不是在线简历。
- career 与 Robotaxi 是上游事实源；xingbuild 只保存经过核验的网站表达快照，不复制或改写上游业务事实。
- `xingbuild.top` 是本项目正式域名；`robotaxi.xingbuild.top` 由 Robotaxi 项目独立发布。
- 产品版本、内容运营、上游采集和问题治理是不同责任域，不得互相代写或互相阻断。

## 责任边界

- 产品与视觉：维护产品总案、候选、正式版本方案、`current.md`，负责版本启动和最终产品/视觉验收。
- Engineering：只实现已写入 `current.md` 的合同；负责代码、测试、本地收口、版本记录、commit/tag，并按授权完成 push、部署和公网验收。
- 内容与发布：负责事实审核、Brief/Article/Practice 结构和既有能力的日常发布；不修改产品版本或视觉合同。
- Ops：只生成可信证据候选、去重和覆盖记录；不写公开正文、不审核、不发布。
- 每个文件、版本和发布动作只有一个执行 owner；其他 task 只提供事实、验收或短检查点。

## 最小执行门禁

- 产品优化 DRAFT 只进入 `docs/iterations/candidates/`；未确认前不得修改 `current.md`、代码、版本或发布状态。
- 当前版本只由 `docs/iterations/current.md` 定义；已完成版本进入 `docs/iterations/history/`。
- 内容更新不进入产品版本；运营问题若影响产品能力，必须创建候选 ID 后才由产品 task 评估。
- main 只作为干净集成/发布基线；Engineering、DRAFT 和内容发布使用有界 worktree，禁止共享脏工作区。
- 产品预览固定使用 `4317`，必须绑定当前 worktree、HEAD、PID 和 task；不换端口、不终止未知进程。
- 详细迭代、分支、端口、验证、回退和发布规则只以 `docs/rules/iteration-and-release.md` 为准。

## 原型与视觉实施

- 重大视觉修改且视觉事实源不明确时，先使用 Product Design 的 `get-context`；不要用临时截图或页面私有样式替代已确认设计。
- 保持 `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs` 和 Sites 测试完整；交付 Sites 前运行 `npm run build` 与 `npm run test:sites`。

## 协作语言

规则以中文为主；命令、文件名、字段、枚举、API 和必要技术名保留英文，并在首次出现时给出简短中文含义。task 消息只传文件路径、版本/commit、证据、阻断 ID 和下一动作，不传完整历史或媒体。
