# 当前迭代

## 当前唯一版本：`v0.24.38`

## 本版本目标

修正内容 deployment 恢复与传播验证：持久化 deploymentId，resume 只做 verify/finalize，不重复部署；公网传播采用有界退避窗口。

## 正式设计与父版本

- 正式设计：`docs/design/v0.24.38 内容 deployment 恢复与传播验证方案.md`。
- 继承设计：`docs/design/v0.24.37 内容 transport 当前产品基座绑定方案.md`。
- 继承设计：`docs/design/v0.24.36 首次候选合并快照修正方案.md`。
- 继承设计：`docs/design/v0.24.35 合并快照公网验证修正方案.md`。
- 继承设计：`docs/design/v0.24.34 内容恢复 CLI 暴露方案.md`。
- 继承设计：`docs/design/v0.24.33 内容增量 transport 接口方案.md`。
- 继承设计：`docs/design/v0.24.31 内容生命周期事实源读取修正方案.md`、`docs/design/v0.24.30 统一站点发布快照与内容保留方案.md`。
- 继承设计：`docs/design/v0.24.29 产品发布门禁与内容基座解耦方案.md`、`docs/design/v0.24.28 持续自动闭环与协作身份治理方案.md`、`docs/design/v0.24.27 内容发布状态机与幂等恢复方案.md`。
- 产品候选：`XBUILD-CONTENT-RELEASE-003`（已纳入 v0.24.27，保留历史证据）。
- 父版本：`v0.24.37` / `bd97ed78b8cb30cb906689a131a8c612890bdc69`；既有 tag/history 不修改。

## 本版本范围

- 继承 v0.24.28 的 task 身份、Xing 称呼、图形优先输出和持续自动闭环规则。
- 产品确定性发布门禁与环境型浏览器 QA 分层；不删除 QA，不绕过身份/clean/manifest/公网门禁。
- 产品与内容继续通过统一 sitePublication 快照合并部署，保留 active content。
- 内容新增/恢复必须通过标准 `--resume --package` CLI 调用 incremental transport，合并当前 active 集合后生成新 deployment；verifier 按合并 manifest 合同验证 active 集合。
- EdgeOne deployment 使用持久状态与 resume，不以固定 30 秒执行窗口判定失败；上传前执行文件数、最大单文件和总大小配额预检。
- active 生命周期只读 content-release.json；dist manifest 只做身份/hash/目标证据。
- deployment JSON 与公网 product/content verify 均为 released 必需证据。

## 明确不做

- 不修改上游事实、已发布 v0.24.34 或内容正文/来源/status/publishedAt。
- 不让内容 task 修改 `src/`、产品版本、current/history、commit/tag。
- 不创建并行 task、branch、worktree 或 automation。

## 验收合同

- 内容 A 经产品发布 B 后仍可公网访问；产品 B 经内容 C 后仍可公网访问。
- 缺 deployment JSON 或公网双验证时，发布绝不进入 released。
- 长部署超出单次执行窗口时，必须保存 deploymentId 并可继续查询同一 deployment；禁止重复创建。
- 资源超限必须在上传前明确报告配额阻断。
- 失败可恢复、不重复部署、不污染产品版本或既有内容事实。
- `npm run check`、内容发布专项、release prepare/closeout/preflight、diff-check 通过。
- `npm run check`、相关内容/发布专项、`release:prepare`、closeout、preflight、`git diff --check` 通过；既有环境 I/O 单独记录。

责任 task：产品与视觉主线负责方案和验收；Engineering 主线 `019fc263-abf9-7732-84ef-73914e6e0a85` 负责实现、自 QA、本地版本收口。
