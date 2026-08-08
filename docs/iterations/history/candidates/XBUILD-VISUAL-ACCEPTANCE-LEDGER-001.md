# XBUILD-VISUAL-ACCEPTANCE-LEDGER-001

状态：confirmed / converted / archived
确认人：Xing
确认日期：2026-08-08
目标版本：v0.26.10

## 来源与转化

- 来源：design-ui 视觉探索 task `019fd068-cd5d-7f30-9642-32d0589a4953`；产品/视觉主线 `019fc260-e14e-7211-97f1-44e075d0cc0f` 评审。
- 原 reserve 文件：`.content-workspace/design-reserve/XBUILD-VISUAL-ACCEPTANCE-LEDGER-001.md`。
- 视觉原型：`/Users/kingjin/.codex/visualizations/2026/08/05/019fd068-cd5d-7f30-9642-32d0589a4953/spacing-candidate-v01/spacing-candidate-v01.html`。
- 正式方案：[`docs/design/v0.26.10 全站垂直节奏与 ProductHero 密度方案.md`](../../../design/v0.26.10%20全站垂直节奏与%20ProductHero%20密度方案.md)。
- 当前合同：[`docs/iterations/current.md`](../../current.md)。

## 最终确认

- 首页首屏内容带内光学居中：全局页眉→普通内容 `48/32px`；有效上方呼吸 `64/40px`；定位→CTA `40/24px`；CTA→最新作品 `64/40px`；最新作品→Robotaxi 标题 `4/4px`。不使用 `100vh`。
- `/business-observations`：H1→首内容行 `64/48px`；左 `最新经营观察`→文章标题与右 `最新简讯`→首张卡片均 `16/16px`；页面标题、双栏基线和文章标题层级保持。
- Home 与 `/products` 的 ClosingAction 上游统一 `96/56px`，与相邻完整 ShowcaseModule 间距相等；只共享 spacing primitive，不共享页面 IA、投影、CTA 或生命周期。
- `/products` LatestUpdateCard：字号 `13px`、高度 `40px`、上下 padding `8px`；卡片→ProductHero `24px`、标题→说明 `16px`、说明→CTA `24px`；真实 Robotaxi release 与外链保持。
- 现有内容事实、审核、媒体、ContentSet、发布工具和 SitePublication 边界不变。

## 归档原因

以上决策已转化为 v0.26.10 正式 design/current，候选不再作为活动输入；不得重新放回活动候选目录或绕过正式方案进入 Engineering。
