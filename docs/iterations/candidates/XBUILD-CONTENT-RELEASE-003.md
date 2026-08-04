# XBUILD-CONTENT-RELEASE-003

候选 ID：XBUILD-CONTENT-RELEASE-003  
类型：独立内容发布能力候选  
状态：pending  
executionAuthorization：pending  
责任：产品/视觉评估架构方案；Engineering 实现与验证；内容 task 提供运行事实  
来源：内容独立发布运行记录（2026-08-04）

## 用户含义与目标

用户要求经营观察、B 端产品内容、企业经营体系长文和关于我等内容能够作为网站的独立日常运营持续更新。内容确定后，应通过标准化 CLI 随时发布，不等待产品版本，不修改产品代码、IA、视觉、VERSION、current、history 或 tag。发布工具必须像可靠的运营基础设施一样：失败可恢复、重试幂等、身份可证明，不能因为一次网络传播或中间状态失败而丢失发布证据，更不能把“已部署”误报为“已发布”。

## 已验证事实

1. v0.24.26 基座已上线，产品与独立内容边界已建立。
2. `/about`、`/products`、`/`、`/business-observations` 四类独立内容已成功发布，说明账号、EdgeOne 项目和基础 transport 可用。
3. 经营观察首条 `baidu-apollo-go-q1-2026-update`：首次部署 `dphmsf1y4l1k` 成功，但公网校验失败：`public content manifest does not match the prepared content identity`。
4. 沿用同一 slug/package 重试，第二次部署 `dpnfh7m8jcfu` 成功，但 finalize 失败：`publication file is missing`；package 最终仅保留 `content-release.json`，无法证明完整发布生命周期。
5. EdgeOne `whoami` 已成功，故当前证据不支持“账号身份失效”结论。
6. 内容 task 已按门禁停止后续 29 条，保留 recovery/package/log；未修改产品代码、版本、tag 或 current。

## 根因待评估（不得直接当作已确认事实）

- transport 完成后，公网 manifest 传播与本地 prepared identity 的校验时序可能未建模为可重试状态。
- finalize 可能在失败重试时删除、覆盖或依赖未持久化的 publication 文件，导致 package 不再是完整的可恢复状态。
- release package、deployment、publicVerify、finalize 之间缺少明确且不可变的状态机和幂等键，导致同一 slug 重试不能安全恢复。
- 产品基座、内容 release 和 EdgeOne deployment 的身份关联可能只在文件约定中存在，未形成可验证的统一 release manifest。

以上均需产品/视觉与 Engineering 读取代码和运行证据后确认，内容 task 不自行定性或修补。

## 目标能力

```text
prepare → build → immutable package
       → transport(deploymentId)
       → publicVerify(retryable, identity-bound)
       → finalize(atomic, idempotent)
       → released(contentReleaseId/hash/baseArtifact/deployment/publicVerify)
```

- 每个阶段均有持久化状态和不可变输入 hash。
- publicVerify 暂时失败时，允许对同一 deployment/package 重试，不重新生成内容、不产生重复 release。
- finalize 只能在 publication 文件、manifest、deployment 和 publicVerify 证据齐全时原子完成。
- 任意失败都保留完整 package、publication、recovery、日志和状态；重试不得出现 `publication file is missing`。
- 已发布、失败、可恢复、已回滚状态必须可区分，部署成功不得自动等于发布成功。
- 内容 release 与产品版本/tag 完全解耦；产品 build 不消费独立内容 root。

## 验收标准

1. 用一个新 slug 完成独立发布，产生并可验证 `contentReleaseId`、content hash、`baseSiteArtifactId`、deployment、publicVerify。
2. 在公网传播延迟/首次 manifest 不匹配场景下，等待或重试同一 release 可成功收口，不重建内容、不改变 release ID。
3. 在 transport 成功、finalize 中断后重试，publication 文件和 recovery 仍完整存在，不出现 `publication file is missing`。
4. 同一 slug 重试不产生重复公开对象、重复 release 或错误覆盖；失败后可明确继续、回滚或人工停止。
5. 产品发布的 dist、release manifest 不携带独立内容正文、媒体或 content release 身份。
6. 30 条经营观察可按单 slug 串行执行，任一失败只阻断当前 slug，不污染其他 slug 或产品版本。
7. 产品版本/tag、current/history、UI/视觉和上游内容事实保持不变。

## 非目标

- 不修改经营观察正文、来源、status、publishedAt 或媒体。
- 不新增人工后台，不把内容发布改造成产品页面功能。
- 不改变产品 IA、视觉、路由或公开内容模型，除非产品/视觉评估确认其为必要的发布边界修复。
- 不绕过 CLI，不以公网“看到了正文”替代 release 证据。

## 下一动作

产品/视觉 task：审查本候选，定位真实状态机、持久化与幂等根因，确定是否纳入正式产品方案。  
Engineering：仅在产品/视觉确认并写入 current 后实现、测试、提交和发布能力。  
内容 task：保持当前 package/recovery/log，暂停后续内容 transport，待能力验收后继续原批次。
