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

## 3. 产品版本与观察内容发布

### 3.1 版本迭代

用于页面结构、内容模型、视觉系统、作品详情、发布架构等形成可辨识能力的变化。

版本号格式：`v主版本.能力版本.稳定修订`，当前从 `v0.1.0` 开始。

### 3.2 快速修订

用于文案、间距、颜色、响应式缺陷、链接等局部调整。多个快速修订可以在验证稳定后合并成一个版本。

不为每次对话、每次试验或未完成尝试增加版本号。

### 3.3 日常观察内容发布

日常内容发布不是产品版本迭代。它只允许新增或修改一个受控内容对象，并保持 `package.json` 版本不变：

- 不要求新版本号、设计方案、`VERSION.md`、版本 tag 或全站七档验收；
- 必须经过 candidate → draft → 本地直接预览 → 人工审核 → promote；
- 必须通过 `npm run content:check` 和 `npm run content:scope-check`；
- 必须保留来源、逐条 `sourceRefs`、证据性质和边界；
- 必须形成独立 Git 提交；范围只能是一项 `content/products|business-observations|observations|articles|profile/*.json`，或该对象必需的已批准媒体 manifest/资产；
- 发布仍需用户执行 `./publish-content.command` 或在当前任务明确授权；
- Scheduled task 只能生成 candidate，不能直接写入公开内容或执行生产发布。

`ObservationPublication → EvidenceUnit → Source` 是观察内容的固定三层模型。缺失字段必须失败或保留明确待补项，脚本不得虚构事实、来源、经营影响或证据关系。

Robotaxi 作品媒体是独立于观察的受控内容入口：`media` 保存读者可见的图片或未来视频，`action` 保存可选读者互动，`provenance` 保存上游 approved manifest 的媒体角色、状态边界、版本、Git commit、SHA-256 与审批记录。Git commit 是内部来源记录，不要求转换为网页 URL；只有 `approved/public`、审批记录有效且本地文件 SHA-256 一致的媒体可以导入。draft、rejected、revoked 或哈希不一致的资产必须失败，不得以页面占位、截图或泛化链接替代。

本地 candidate、import 和 draft 只允许位于被 Git 忽略的 `.content-workspace/`。生产读取层只消费 `content/observations/`，生产 bundle、静态资源和公开集合不得包含 draft。

`.content-workspace/imports/` 使用安全消费语义：只有候选校验通过、文件名与 slug 一致且 draft 通过排他写入成功后，导入工具才删除这一条精确输入；外部输入和任何失败输入必须保留，不允许通配清理。

新观察进入人工审核前，必须分别在 1440px 与 390px 核对标题中的完整业务词组。只有真实渲染确认发生拆词时，才在该内容的必要词组中加入最小 WORD JOINER；不得以固定换行、视口专用文案或自动中文分词替代人工语义判断。

## 4. 当前迭代

唯一当前指针：`docs/iterations/current.md`。

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

日常观察使用：

```bash
./publish-content.command
```

该命令不创建或推送版本 tag，但必须：

1. 确认 `main`、工作区干净，且 `.content-workspace/` 没有残留 JSON；
2. 确认最新提交只包含一项受控内容对象（以及必需的已批准媒体），且相对父提交的产品版本未变化；
3. 执行内容检查、生产构建和 Sites 测试；
4. 只推送 `main`；
5. 部署既有 `xingbuild-nochina` 项目；
6. 以稳定产品版本、新提交和目标文章 URL 完成公网验证。

脚本存在不构成发布授权。GitHub 同步、EdgeOne 部署和公网验收仍需分别报告。

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
