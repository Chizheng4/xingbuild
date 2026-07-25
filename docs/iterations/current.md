# 当前迭代

## 当前稳定版本

`v0.4.1`

## 目标版本

`v0.5.0`

## 要解决的问题

- 桌面首页 Hero 起点过低、标题列过窄，横向空间和首屏阅读效率不足。
- 衬线字体承担过多解释和系统信息角色，标题、说明、元数据之间缺少清楚分工。
- 手机 Hero 说明偏弱，SectionIntro 与第一项内容之间仍有无效空白。

## 本轮范围

- 调整首页 Hero 网格、标题宽度和垂直位置。
- 固定衬线内容角色与无衬线解释、状态和操作角色。
- 优化手机 Hero 说明及最新观察首项进入节奏。
- 固定 `xingbuild` 全小写品牌和 wordmark 排版。
- 回归 Visual System v1、导航断点与核心阅读页面。

设计事实源：

- `docs/design/xingbuild Visual System v1.md`
- `docs/design/v0.5.0 根本视觉构图优化方案.md`

## 明确不做

- 不改变网站名称、作者身份、一级导航和内容事实。
- 不增加新颜色、图形 Logo、深色主题、CMS、搜索、筛选、Build Log 或自动分发。
- 不复制 Maggie Appleton 的字体和视觉资产。
- 不推送 GitHub、不发布 EdgeOne、不修改域名。

## 涉及对象和文件

- 视觉对象：Hero 构图、字体角色、wordmark、SectionIntro 与首项内容节奏。
- 页面：首页为主；观察、正文、作品、关于我做必要回归。
- 工程责任：既有视觉 token、Hero/SectionIntro/ObservationFeature/SiteHeader 组件及视觉合同测试。

## 验收标准

- 1440px 主标题位置、宽度和中文换行达到方案目标，首屏进入最新观察内容。
- 标题、长文、解释、元数据和操作具有稳定字体分工。
- 390px Hero 说明清楚，首屏看到第一项观察标题的开始。
- 1024、768、557、520、390、320 无结构回退和横向溢出。
- `xingbuild` 名称和 wordmark 写法全站一致。
- 自动检查、设计 QA 和 `npm run release:check` 通过。

## 当前状态

根本视觉构图优化已完成工程实现、Chrome 浅色模式七档视觉验证、必要页面回归与 `npm run release:check`；本轮本地稳定版本已关闭，未推送 GitHub、未发布 EdgeOne。
