# Slug 级内容审核终端命令交接

状态：已交付，日常内容运营使用（v0.15.7 能力，v0.24.0 统一发布合同）。范围仅为日常经营观察内容运营能力；不改读者页面、视觉或内容对象字段。正式 publish 的版本展示必须服从统一版本合同。

## 目标

在内容 task 已完成选题、事实审核、公开文案和明确发布判断后，用一条显式 slug 命令完成既有 `content:review` 与 `content:promote` 的受控聚合，减少重复人工终端步骤和模型调用。

## 唯一命令合同

```bash
npm run content:approve -- --slug <slug> --authority <authority>
```

- `slug` 与 `authority` 都必填；缺失、空值或非单一 slug 必须失败。
- 只处理目标 slug，绝不扫描、提升、删除或阻断无关的 ignored candidate/draft。
- 复用既有审核、证据、来源、schema、Brief/Article 与重复生产对象校验；不新增内容判断规则，不生成公开文案。
- 成功后只产生该 slug 的审核记录、recovery 记录和 `content/observations/<slug>.json`；草稿、审核和 recovery 在公网验收前保留。
- 失败不得覆盖已有 production、审核记录或草稿；不得留下半成品 production 对象。目标已有审核、生产同 slug、来源/证据缺失、哈希不一致或目标冲突都应硬失败。
- 该命令只负责审核与 promote，不创建 Git commit、不 push、不部署；其后由 `./publish-content.command --slug <slug>` 完成统一版本提交、tag、push、部署和公网验证。

## 交付与验证边界

1. 交付实现复用既有 content workflow 校验，并覆盖正常目标、参数缺失、已有 production、目标冲突、来源/证据缺失、无关 workspace 并存和失败不写 production。
2. 命令作为独立运营能力交付；它本身不进入产品版本，但其成功后的正式 publish 必须进入当前统一版本流水线。发布工具能力改变时由产品候选和 Engineering 版本实现。
3. 后续若发现命令或发布工具缺陷，必须先停止该次运营操作并登记 `docs/iterations/candidates/` 候选；不得由内容 task 私自创建工程分支或修改 main。

## 不得扩展

- 不自动选题、写稿、审核或发布。
- 不让读者页面显示 candidate、审核者、来源等级或其他治理字段。
- 不直接改 Footer、页面结构、样式、产品版本或 tag；正式 publish 阶段必须遵守统一版本合同。
