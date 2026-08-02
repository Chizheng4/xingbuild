# XBUILD-CONTENT-RELEASE-002：内容发布与产品主线的隔离租约能力

## 状态

- `executionAuthorization: pending`
- 产品评审：`closed`（路由：`closed`）
- 评审结论：候选所描述的能力已由 `c49fab4031a4d166f472e9a6cb60f40291fcb7c` 实现并验证；不再开启重复 Engineering 工作。
- 评审责任：产品与视觉 task
- 候选类型：发布能力 / 内容运营基础设施
- 来源问题：`OPS-CONTENT-005`
- 责任 task：产品与视觉 task 评审是否需要保留为发布能力候选；Engineering task 仅在候选确认后评估

## 事实与证据

早期真实发布中，内容发布命令依赖共享 clean `main` checkout，并要求 `origin/main == HEAD^`（首次 push）或 `origin/main == HEAD`（同提交重试）。内容提交后若产品治理提交推进远端主线，原发布 checkout 会被门禁阻断。

已存在的能力修正事实：

- `c49fab4031a4d166f472e9a6cb60f40291fcb7c`：增加干净内容 worktree、短时 release lease、主线前进重建和部署前远端 HEAD 再确认；
- 专项测试：内容 33/33、lease 5/5、`release:check` 111/111；
- 该修正未改变产品版本/tag、UI、公开内容对象或产品部署。

## 影响与风险

若内容发布与共享产品 checkout 或产品主线时序耦合，日常内容运营可能因产品 task 的未提交改动、主线推进或部署窗口而等待；若简单放宽门禁，则可能把产品改动或旧构建误带入内容发布。

## 非目标与边界

- 不改变 Observation/Article/Practice 内容模型、页面结构、视觉或产品版本/tag。
- 不允许绕过 slug、scope、hash、版本、主线、build、Sites 和公网验收门禁。
- 不暂停日常内容采集、审核和单 slug 发布；不把本候选当作当前工程授权。

## 下一动作

保留本候选作为关闭记录；不编码、不进入 `current.md`、不创建产品版本、不 push/deploy。
