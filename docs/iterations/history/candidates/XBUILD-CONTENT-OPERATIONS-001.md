# XBUILD-CONTENT-OPERATIONS-001：声明式内容定位与独立发布能力（归档）

> archiveStatus：`archived_transformed`
> 归档原因：用户已确认最小内容运营方向；内容定位、编辑白名单和快速方案写作已转入正式设计与机器注册表。
> 原候选：`docs/iterations/candidates/XBUILD-CONTENT-OPERATIONS-001.md`
> 正式设计：`docs/design/声明式内容定位与快速内容发布方案.md`
> 注册表：`content/registry/content-targets.json`

## 1. 转化结论

本候选成立的核心问题是：内容 task 需要稳定、确定性的页面/模块/字段定位，不能每次重新研究页面实现，也不能把普通文案工作升级为产品工程候选。

已确认采用：

```text
自然语言请求 → Content Target Registry → 一次定位卡
→ 用户确认 ChangeSet → 既有独立内容发布链路 → 内容公网验收
```

注册表只登记现有 JSON 内容对象的可编辑字段；`scope=page` 是明确字段批次，不是整文件覆盖。首页暂不登记，因为首页主文案仍在 `src/content/siteContent.js`，需产品工程先完成能力外部化。

## 2. 已确认范围

- B 端 Robotaxi：标题、简介、边界、已登记模块的 label、shortDescription、loopRelation 和 action.href；
- Article/About：现有 JSON 对象中已登记的标题、摘要和稳定文本字段；
- Observation：按 slug 模板定位已发布观察的标题、摘要和 evidenceBoundary；
- 现有内容对象、事实来源、批准媒体和独立内容身份保持不变；
- 内容 task 不修改产品 UI、IA、schema、组件、CSS、交互、上游事实、`current.md`、产品版本或产品 tag。

## 3. 未授权事项

- 未授权人工 CMS、账号/RBAC、实时数据库或任意源代码编辑器；
- 未先建第二套发布引擎；第一阶段复用既有 `content:prepare`、`content:build` 和独立 transport；
- Practice video 只作为兼容性验收项，不能绕过媒体审核、hash、provenance、事实边界和 public 门禁；
- `publish-practice --id` 当前代码路径与底层目标参数一致，保留回归测试要求，不形成新的参数修复授权；
- 未授权 Engineering 直接编码或产品版本推进；若注册表消费能力需要工具实现，必须由正式设计形成有界 Engineering 方案后再按产品工程协作流程执行。

## 4. 归档结果

本候选不再是活动输入。日常内容工作从 `content/registry/content-targets.json` 开始；未登记目标、页面能力变化、CLI/媒体合同故障或事实边界无法验证时，才重新登记新的候选并报告用户。

本次转化是独立内容运营治理，不创建产品 `v0.x`，不改变 v0.24.19 的产品版本事实。
