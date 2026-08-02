# 当前迭代

## 当前唯一版本：`v0.24.9`

状态：Engineering 已完成 v0.24.9 状态机与收口事实治理实现、自 QA，并形成 local commit/tag；产品/视觉验收待确认。尚未 push、publish、部署或公网验收。
localSubmission: complete
productVisualAcceptance: pending
publishAuthorization: pending
onlineRelease: pending
发布授权：未授权线上 publish、push 或部署。
父版本：`v0.24.8` / `4bf4c137d355d32e096cbf152308461343a0adab`。
责任 task：产品与视觉主线负责合同与验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。

## 本版本目标

消除 current/history 自然语言状态与真实 commit/tag/publish 事实不一致的根因，建立可检验的版本状态机。

## 本版本范围

- 更新 `current.md`、版本 history 与规则，加入四个状态字段。
- 为 closeout/preflight/产品验收增加状态一致性门禁与测试。
- 修正 v0.24.8 已提交事实的状态表达，不回写或移动 v0.24.8/v0.24.7 tag。
- 正式方案：`docs/design/v0.24.9 版本状态机与收口事实治理方案.md`。

## 明确不做

- 不移动、删除、覆盖或 push `v0.24.7` 异常 tag。
- 不修改 UI、IA、schema、内容、上游事实或线上状态。
- 不创建 branch、worktree、替代 task 或第二套版本身份。

## 验收与状态

- 必须验证四个状态字段与 Git/线上事实一致。
- 本地 URL：`http://127.0.0.1:4317/`（未启动）。
- 线上 URL：`https://xingbuild.top/`；线上继续 `v0.24.1`。
- 活动候选仅保留未确认 DRAFT/pending。
- 下一动作：Engineering 本地提交后产品/视觉验收；通过后等待用户明确 publish。
