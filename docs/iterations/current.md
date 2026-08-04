# 当前迭代

## 当前唯一版本：`v0.25.4`

## 正式方案

`docs/design/v0.25.4 全站视觉结构与媒体交互方案.md`

## 目标

统一 Home、Products、Business Observations、About、Observations 五类页面组合的视觉结构，并建设 MediaAction：内容只更新字段；产品能力统一负责字体、段落、留白、媒体和响应式。图片/视频有登记 action 时，点击只跳转 Robotaxi 运营平台入口；视频不自动播放，不显示播放器控制，不执行播放/暂停。

## 产品—内容兼容声明

```yaml
contentImpact: compatible
affectedTargets: [practice-robotaxi]
affectedRoutes: [/, /products, /business-observations, /about, /observations]
affectedFields: [page compositions, visual primitives, media action]
compatibilityEvidence: v0.25.4-visual-structure-media-action-contract
```

## 范围

- 统一 `SiteShell → PageComposition → Visual primitives` 的排版、留白、层级、媒体比例、焦点、错误和空状态。
- 实现 MediaAction，复用现有 `media` 与已登记 `action.href`。
- 视频无 `autoplay`、无原生 `controls`（有 action 时）、点击不播放/暂停，只跳转。
- 覆盖桌面、窄屏、390px 移动、200% 缩放、键盘和 Reduced Motion。
- 使用 Playwright 截图/DOM 回归与 axe-core 辅助检查；不新增第二套样式系统。

## 明确不做

- 不修改内容正文、审核、媒体事实、content release、上游事实或产品/内容身份边界。
- 不新增页面、路由、业务 schema、Storybook、BackstopJS 或并行视觉系统。
- 不让内容 task 修改 `src/`、CSS、产品版本、current/history、commit/tag；不重发既有内容。
- 不创建 branch、worktree、替代 task 或并行发布。

## 验收合同

1. 五类页面组合视觉层级一致，主角、Proof 和 Action 清晰。
2. 内容字段增长不会破坏字体、段落、留白、阅读宽度和响应式结构。
3. `/products` 带 action 媒体点击只跳转 Robotaxi，不播放、不暂停、无原生 controls。
4. 视频 `autoplay=false`；链接、键盘、焦点、accessible name 和安全属性正确。
5. 五条核心路由在桌面、窄屏、390px、200% 缩放无横向溢出。
6. 空内容、媒体缺失、失败和 Reduced Motion 均有合法降级。
7. Playwright 截图/DOM、键盘、控制台、axe-core 辅助检查以及项目 release checks 全部通过。

责任 task：产品/视觉主线维护方案并验收；Engineering 主线 `019fcbf2-20e3-7d51-a4de-87ad7c94b190` 负责实现、自 QA、本地 commit/tag/clean 和发布；内容及发布主线只在产品上线后核验既有内容，不重发、不改产品文件。
