# Slug 级内容审核终端命令交接

状态：待 Engineering 实现。范围仅为日常经营观察内容运营能力；不改读者页面、视觉、内容对象或产品版本展示。

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
- 该命令不创建 Git commit、不 push、不部署、不修改 package/VERSION/tag。其后仍由独立内容提交与 `./publish-content.command --slug <slug>` 完成发布。

## 实现与验证边界

1. 在既有 content workflow 脚本中抽取共享校验，避免以子进程串接 npm 命令或复制审核逻辑。
2. 更新 `package.json`、`docs/rules/iteration-and-release.md` 与对应自动化测试；实现后把 AGENTS 中“目标”表述改为已交付合同。
3. 至少覆盖：正常目标、缺 slug/authority、已有 production、目标候选或草稿冲突、缺来源或证据、无关 workspace 草稿并存、失败不写 production。
4. 版本按产品串行规则由产品/视觉 task 开启并验收；本文件不授权发布。

## 不得扩展

- 不自动选题、写稿、审核或发布。
- 不让读者页面显示 candidate、审核者、来源等级或其他治理字段。
- 不改 Footer、页面结构、样式、产品版本或 tag。
