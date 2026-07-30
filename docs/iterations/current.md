# 当前迭代

## 当前目标版本

`v0.15.8`

## 已批准问题

轻量访问概览接入：在不建立网站分析系统、不关联两站匿名身份的前提下，为 Robotaxi 管理端提供 xingbuild 正式站的大致有效访问事实。

## 本轮范围

- `xingbuild.top` 正式页面 visible 累计 15 秒后触发一次同源 `POST /api/visits/qualify`；隐藏期间暂停累计。
- 使用本站 origin 的独立 `visitor_seed` 和 `site_code=XINGBUILD`；父域排除 Cookie、本地、preview、webdriver/自动 QA、非正式域名不调用。
- Worker 实现正式域名校验、HMAC-SHA-256 匿名标识、Asia/Shanghai 自然日幂等、七字段白名单和 30 天有界清理。
- 复用 EdgeOne 绑定名 `visitKv` 与 Secret `visitHashSecret`；补齐项目规则、版本记录、自动化测试、构建和真实加载验证。

## 明确不做

- 不修改 Robotaxi 工程、业务数据或管理页面，不新增 xingbuild 访问管理页面。
- 不记录 IP、地区、路径、点击、来源、输入、业务数据、精确时长、会话心跳或结束事件。
- 不关联 xingbuild 与 Robotaxi 匿名身份；不夹带内容发布、页面视觉或其他 backlog。
- 外部 KV/Secret 未配置，本轮不 stage、commit、tag、push、deploy 或声称公网能力可用。

## 验收标准

- 桌面与手机正式域模拟加载均在 visible 累计 15 秒后只请求一次；hidden 时间不累计。
- localhost、preview、webdriver/自动 QA、非正式域名和排除 Cookie 均不调用。
- 同一 visitor、站点、Asia/Shanghai 自然日只保留一个 key；重复调用保持 first 并更新 last。
- KV key、HMAC 截断、`qualified_date=YYYYMMDD`、`device_type=MOBILE|DESKTOP`、七字段白名单与 30 天有界清理均须与共享合同一致；缺少绑定或 Secret 时硬失败。
- 现有页面、移动导航、构建和 Worker fallback 不回退；专项测试与 `npm run release:check` 通过。
- 完成后停在未暂存、未提交状态，等待产品独立验收和外部配置。

## 当前状态

v0.15.8 Engineering 实现、本地验证与产品验收已完成：访问/Worker 专项 11/11、完整 `npm run release:check` 76/76、生产构建 19 条既有 published Observation；1440×900 首页与 390×844 B端产品页真实加载、visible 15 秒、横向溢出和 console 均通过。用户已确认 EdgeOne 外部配置完成，进入正式收口与发布。

## 外部配置状态

- EdgeOne 生产项目 `xingbuild-nochina` 已绑定共享 KV，变量名为 `visitKv`。
- EdgeOne 生产项目已配置与 Robotaxi 相同的 `visitHashSecret`；Secret 不进入仓库、日志或交接。
- 真实 XINGBUILD 写入与 Robotaxi 管理页联查保留为用户人工验收，自动化 QA 不制造访问记录。
