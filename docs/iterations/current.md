# 当前迭代

## 当前唯一版本：`v0.24.18`

## 本版本目标

将产品工程迭代收敛为“正式方案 → Engineering 实现与自 QA → local commit/tag/clean → history → 产品/视觉验收 → 用户 publish”的单一闭环；current/history 不再承担生命周期状态管理。

## 本版本范围

- current 只保存当前可执行产品方案、范围、不做和验收合同，不保存 `localSubmission`、验收、publish 授权或线上状态字段。
- Engineering local commit/tag/clean 后一次性生成不可变 `docs/iterations/history/v0.24.18.md`，记录版本号、commit、annotated tag、clean、父版本、范围和验收合同。
- closeout/preflight/product publish 直接从 package、VERSION、current 版本号、Git HEAD、annotated tag 和 clean 工作区推导本地版本事实。
- 产品/视觉验收与公网发布只保留在 `docs/qa/`、release manifest、部署记录和公网验证中；验收问题启动下一版本，不回写旧 history。

## 非目标

- 不修改 v0.24.17 或更早版本的 tag/history。
- 不修改 UI、IA、schema、内容、上游事实或独立内容发布合同。
- 不创建并行 task、branch 或 worktree。

## 验收合同

- current/history 不包含生命周期状态字段。
- closeout/preflight 在无状态字段时仍能阻止版本号、HEAD、annotated tag、clean 不一致。
- publish 授权只存在于本次明确命令调用中，不写入版本文档。
- Engineering 完成本地 commit/tag/clean 与 history 后，交产品/视觉验收；本版本不 push、publish、部署。

父版本：`v0.24.17` / `647e2137ae56f9837cf3e40ee711431a926a392a`；该 tag 不修改。
责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
