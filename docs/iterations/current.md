# 当前迭代

## 当前目标版本

`v0.19.0`

## 主题

企业经营体系常青长文与图形内容能力

## 事实源

- `docs/design/v0.19.0 企业经营体系常青长文与图形内容方案.md`
- `docs/design/xingbuild Visual System v1.md`
- `docs/iterations/history/v0.18.0.md`
- career同步的企业经营概念与批准网站快照
- `docs/rules/iteration-and-release.md`

## 目标

- 将企业经营体系从页面专用交互架构图迁移为常青长文；
- 复用RichDocument和既有figure，新增共享桌面/手机目录；
- 图形由锁定版本的 Mermaid 或 LikeC4 开源CLI在内容准备阶段生成响应式SVG；D2 是未来可选 adapter，未纳入当前版本；
- 建立常青文章单slug内容更新与独立发布边界；
- 后续增加章节和图形不修改页面代码、产品版本或tag。

## 明确不做

- 不建设架构应用、画布、节点浏览器或自研图形运行时；
- 不继续维护手工节点坐标和关系路径；
- 不改写企业经营事实；
- 不修改Header、Footer、一级导航、Robotaxi或Observation Brief；
- 不夹带其他backlog。

## Engineering范围

- `EvergreenArticlePublication`与校验；
- 共享ReadingTOC；
- RichDocument响应式figure最小扩展；
- 首篇企业经营体系内容迁移；
- 旧 `view` URL到稳定锚点的兼容；
- 企业经营体系交互图运行时退出公开读取；
- 常青文章单slug内容检查与独立发布范围。

## 验收

- 1440/768/390真实页面通过；
- 目录sticky、手机details、锚点刷新与直接访问成立；
- 单一图源生成两档SVG产物、alt、caption、响应式与安全检查通过；
- 新增一张测试图只改source与内容对象、再增加一个H2，不修改React/CSS即可生成两档并显示；
- 企业经营事实逐项无改写；
- release:check、closeout、preflight、push、部署和公网验收分别报告。

## 当前状态

Engineering 已开始实现与本地验证；尚未暂存、提交、tag、推送、部署或修改生产环境。
