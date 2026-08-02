# XBUILD-V024-CLOSEOUT-001：v0.24.0 统一版本收口修订

## 归档状态

- `archiveStatus: archived_transformed`
- 转化版本：`v0.24.1`
- 正式方案/实施结果：已写入 `docs/iterations/history/v0.24.1.md`
- 归档原因：本候选已被 v0.24.1 产品设计方案继承并完成本地收口；候选不再作为活动输入。

## 原评审状态

- `status: confirmed`
- `executionAuthorization: confirmed`
- 路由：`current-fix`
- 目标版本：`v0.24.1`
- 责任 task：产品与视觉 task → Engineering task

## 事实与阻断

v0.24.0 的产品实现和公网部署已完成，最终产品 commit 为 `3e3d499693a4b3c60d4b4b9ed46362b6dad5880b`，tag 为 `v0.24.0`。随后为补写 current/history 证据产生 docs-only commit `a2c32421152b6286b49d6fd2f4d044aa22f3f0b4` 并进入 `main`，导致：

- canonical `main` HEAD 不再被 `v0.24.0` tag 指向；
- `npm run release:preflight` 明确失败：HEAD 没有精确 `v0.24.0` tag；
- 本地统一版本身份与已发布线上版本再次分离。

## 目标

以不可移动的 `v0.24.0` 为父版本，创建最小修订 `v0.24.1`，使 canonical `main` 最终 HEAD、package/VERSION/current、annotated tag、release.json、content-manifest.json、EdgeOne 部署和公网验证全部指向同一版本与最终 commit。

## 范围

- 保留 `v0.24.0` 和 `v0.23.0` tag，不移动、不覆盖、不重写历史；
- 将 current/history 的完整 v0.24.0 证据纳入 v0.24.1 收口，并补齐 v0.24.1 的版本记录；
- 更新 package/version/current/history、release manifest 和必要的统一版本校验；
- 运行 release:check、closeout、preflight、build、Sites、push、EdgeOne 和公网验证；
- 最终 `HEAD == origin/main == v0.24.1 tag`，线上两个 manifest 使用同一 v0.24.1/最终 SHA。

## 非目标

- 不移动任何既有 tag；
- 不改变页面、视觉、内容 schema、上游事实或内容数据；
- 不重复修改 v0.24.0 实现逻辑；
- 不创建第二套版本或仅修正文档而不打 tag 的 closeout 提交。

## 下一动作

归档结果：本候选已写入 current/history 并完成 v0.24.1 收口；后续只通过版本 history 追溯。
