# 当前迭代

## 当前唯一版本：`v0.24.0`

状态：已确认，进入 Engineering 实现；完成后直接提交、打标签、推送、部署并公网验收。
发布授权：用户已明确要求本版本直接上线。
正式方案：[`docs/design/v0.24.0 项目文件与协作基线治理方案.md`](../design/v0.24.0%20项目文件与协作基线治理方案.md)
方案 ID：`XBUILD-UNIFIED-RELEASE-001`
关联候选：`XBUILD-CONTENT-RELEASE-001`

## 根本目标

建立 xingbuild 的单一版本源：本地稳定版本、Git 提交、annotated tag、线上 `release.json`、线上 `content-manifest.json` 和正式发布命令使用同一个版本号与最终提交 SHA。

本版本废止“产品版本不变、内容提交独立前进、内容 manifest 单独表示线上状态”的双轨发布逻辑。新采集、draft、review、recovery 仍是内部运营数据；任何经正式 `publish-*` 命令进入公网的内容，都属于本次统一发布版本的一部分。

## 本版本范围

- 将 `AGENTS.md`、产品总案、迭代规则、候选入口、current/history、运营合同和治理方案统一为单一版本合同；
- 将 v0.23.0 之后已进入 main 的产品治理与发布能力变化纳入 v0.24.0 的稳定版本收口；
- 统一 `package.json`、`VERSION.md`、`current.md`、Git commit、annotated tag、`release.json` 和 `content-manifest.json` 的版本/提交校验；
- 改造 `publish-content.command`、`publish-article.command`、`publish-practice.command` 及相关 scope/readiness/verify 测试，使正式内容发布生成统一版本提交和 tag，不再创建独立内容版本；
- 必须修复的指令与校验落点包括：`scripts/content-release.mjs`、`publish-content.command`、`publish-article.command`、`publish-practice.command`、`scripts/lib/content-release-readiness.mjs`、`scripts/article-scope-check.mjs`、`scripts/practice-scope-check.mjs`、`scripts/lib/practice-content.mjs`、`scripts/verify-content-release.mjs`、`scripts/verify-article-release.mjs`、`scripts/verify-practice-release.mjs` 及对应 `tests/`；旧的“product version must not change / must not create a product tag / content-only”断言必须全部移除或改为统一版本断言；
- `publish-*` 不能只部署当前 HEAD：必须在受控发布 worktree 中更新版本记录、创建同名 annotated tag，并让 push、EdgeOne 和公网验证都指向同一最终 commit；失败时保留可恢复的运营数据，但不得留下半个线上版本；
- 正式内容发布必须经过与产品版本相同的 build、Sites、版本一致性、push、EdgeOne 和公网验收；
- 保留 Ops 采集、candidate、draft、review、recovery 的内部数据边界，不把内部治理数据发布到读者页面；
- 将已有 v0.23.0 之后的内容与治理提交作为 v0.24.0 的输入，不移动既有 `v0.23.0` tag。

## 明确不做

- 不修改 Robotaxi、career 或其他上游事实；
- 不改变页面 IA、视觉、内容对象字段或现有公开路由；
- 不把新采集候选、draft、review、recovery 或未审核内容直接加入版本；
- 不保留任何“内容发布不改变产品版本/tag”的命令、测试或现行规则；
- 不移动、覆盖或重写既有 `v0.23.0` tag；
- 不创建第二套内容版本号、独立内容 tag 或只更新 manifest 不更新产品版本的发布路径。

## 统一版本合同

一次正式发布完成后，以下身份必须全部一致：

```text
package.json version       = vX.Y.Z
VERSION.md 当前记录        = vX.Y.Z
current.md 当前版本        = vX.Y.Z
Git commit                 = RELEASE_COMMIT
annotated tag              = vX.Y.Z -> RELEASE_COMMIT
release.json               = { version: vX.Y.Z, commit: RELEASE_COMMIT }
content-manifest.json      = { version: vX.Y.Z, commit: RELEASE_COMMIT }
```

内容发布可以是 patch 级统一版本，但不得绕过产品版本合同。发布命令应在受控流程中生成或确认目标 patch 版本，并将内容变更、版本记录和最终 tag 收口为一个 commit；并发发布必须由 release lease 串行化。

## Engineering 验收入口

- `npm run check`
- `npm run release:check`
- `npm run release:closeout-check`
- `npm run release:preflight`
- `npm run build`
- `npm run test:sites`
- 内容、Article、Practice 三种 `publish-*` 命令的统一版本集成测试；
- 目标内容、首页、相关公开页面在桌面与手机的真实公网验证；
- `release.json` 与 `content-manifest.json` 同时匹配最终版本和最终提交 SHA。

## 交接与完成条件

产品与视觉 task 只交接一次。Engineering 负责实现、测试、本地 commit、版本记录、annotated tag、push、EdgeOne 部署和公网验收；完成后主动回传不超过 20 行检查点。

本版本只有在以下状态全部成立后才算完成：

```text
current / VERSION / package / tag / release.json / content-manifest.json
→ 同一版本
→ 同一最终 commit
→ main 与 origin/main 一致
→ release:check 与 release:preflight 通过
→ EdgeOne 部署成功
→ 公网验证通过
```
