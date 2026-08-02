# 当前迭代

## 当前唯一版本：`v0.24.1`

状态：已完成 Engineering v0.24.1 current-fix 实现、验证、提交、打标签、推送、部署与公网验收。
发布授权：用户已明确要求直接上线；本修订不移动既有 `v0.24.0` tag。
父版本：`v0.24.0` / `3e3d499693a4b3c60d4b4b9ed46362b6dad5880b`
正式方案：[`docs/design/v0.24.0 项目文件与协作基线治理方案.md`](../design/v0.24.0%20项目文件与协作基线治理方案.md)
方案/修订 ID：`XBUILD-V024-CLOSEOUT-001`

## 阻断修复目标

修复 v0.24.0 发布后追加 docs-only closeout commit 导致的 tag/HEAD 分离，使本地 canonical main、产品版本、Git tag 和线上发布重新成为同一版本身份。

## 本版本范围

- 保留并追溯 v0.24.0 的实现、线上部署和公网证据；
- 将 current/history 最终证据与 v0.24.1 的版本记录纳入同一修订发布；
- 更新 `package.json`、`VERSION.md`、`current.md`、`docs/iterations/history/v0.24.1.md` 及必要 release 校验；
- 创建不可移动的 annotated `v0.24.1` tag，使最终 `HEAD == origin/main == tag`；
- 重新生成并部署 `release.json` 与 `content-manifest.json`，使二者与 v0.24.1 和最终 commit 完全一致；
- 完成 `release:check`、`release:closeout-check`、`release:preflight`、build、Sites、push、EdgeOne 和公网验证。

## 明确不做

- 不移动或重写 `v0.24.0`、`v0.23.0` tag；
- 不改变页面 IA、视觉、内容 schema、内容事实或上游工程；
- 不新增第二套版本、content-only tag 或未打 tag 的线上 closeout 提交。

## 统一验收合同

```text
package.json / VERSION.md / current.md / history
        = v0.24.1
最终 Git HEAD / origin/main / annotated tag
        = RELEASE_COMMIT
release.json / content-manifest.json / EdgeOne / 公网
        = v0.24.1 + RELEASE_COMMIT
```

只有上述身份全部一致，且 `npm run release:preflight` 通过，产品与视觉 task 才能将本修订标记完成。


## 最终修订验收

- v0.24.1 的最终 HEAD、origin/main、annotated tag、release.json 与 content-manifest.json 由同一 release commit 统一确认。
- 父版本 v0.24.0 的实现、deployment 与公网 manifest 证据保留于 `docs/iterations/history/v0.24.0.md`。
