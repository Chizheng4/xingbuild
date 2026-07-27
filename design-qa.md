# v0.9.0 Design QA

## QA 结论

Engineering 设计 QA 与结构视觉专业验收：通过。全站内容主轴、共享卡片、语义空间、响应式、交互和 v0.8.0 回归均达到 `v0.9.0` 本地稳定版本标准。

## 事实源

- 产品与结构合同：`docs/design/v0.9.0 全站内容卡片与页面结构收敛方案.md`
- 视觉基线：`docs/design/xingbuild Visual System v1.md`
- 内容事实：`src/content/siteContent.js`

## 结构结果

- 首页、观察、作品、About 的 Intro、集合和正文首字使用同一内容主轴。
- 删除 Page Intro 桌面 rail、单一年份 rail 和 About 常驻目录 rail。
- 首页与观察页共同消费 ObservationCard；首页与作品页共同消费 WorkCard。
- 卡片统一为唯一整体链接，字段顺序固定为 Title → Summary → Metadata。
- 删除 ObservationFeature、ObservationRow、“继续阅读”、远端箭头、作品关键词与列表详情投影。
- About 章节保持普通正文结构，没有卡片化。

## 视觉与空间

- 新增独立 card surface、hover surface、border、radius、shadow、focus 与 transition token，不复用 `surface-subtle`。
- Page Intro → 集合、Section → Section、Section Intro → Grid、Card → Card、卡片内部和 About 章节分别由明确父级 flow 拥有。
- 静态卡片使用克制暖色表面和 1px 边界；hover 合同最多上移 2px，focus-visible 为 2px 赭色轮廓。
- `prefers-reduced-motion` 下取消位移，只保留颜色与边界反馈。

## 真实浏览器结果

- 视口：`1440×1000`、`1024×768`、`768×1024`、`557×816`、`520×816`、`390×844`、`320×568`。
- 首页、观察、作品、About 在全部视口保持同一主轴，无整页横向滚动。
- 1440/1024 使用两列 CardGrid；768 及以下使用同源单列卡片。
- 每张卡片只有一个链接，实际 DOM 字段顺序均为 title、summary、metadata。
- 1440px Page Intro → 首集合约 72px、Section Intro → Grid 40px、Card gap 32px；390/320px 分别收敛到 40px、24px、16px。
- 390px 全屏菜单覆盖完整视口，打开时锁定正文，Escape 正常关闭；557/520 保留行内导航。
- 焦点实际命中整卡链接，`focus-visible` 为 2px `#7D2F19` 轮廓、4px offset；点击进入详情正常。
- `企业数字化`、`需要`、`同时` 在 390px 实际字符坐标中保持完整词组。
- v0.8.0 企业认知架构在 1440/390/320px 节点数仍为 7/10/9/10，桌面/手机投影正确，无节点越界、无横向滚动，routing track 无箭头。
- 浏览器控制台 warning/error 为 0。
- 结构视觉 task 已独立复验七档视口、卡片一致性、页面主轴、菜单、焦点与企业认知架构回归，专业验收通过。

## 自动验证

- `npm run test:sites`：32/32 通过。
- `npm run build`：通过，Sites 构建合同保持完整。
- `npm run release:check`：通过；项目检查、生产构建与 32 项测试全部成功。
- `git diff --check`：通过。

## 已知边界

- 浏览器自动化可以确认 hover CSS 合同，但受控指针在本地页面没有触发 `:hover` 伪类；该状态交由结构视觉 task 在独立真实浏览器验收。
- 当前只有两个观察和两个作品，因此桌面等高主要由同一网格行验证；未来内容长度显著增加时仍需保持 schema，不通过截断制造等高。
- 线上网站仍是此前生产版本；本轮未提交、未推送、未发布、未修改域名。
