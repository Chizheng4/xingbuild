# 当前迭代

## 当前版本

`v0.1.4`

## 当前状态

`v0.1.4` 正在完善正式域名体系并接入 Robotaxi 独立部署。

## 当前目标

- 保持 `xingbuild.top` 为唯一主域名。
- 让 `www.xingbuild.top` 支持 HTTPS，并通过 301 永久跳转至 `xingbuild.top`。
- 保留访问路径和查询参数，避免旧链接或分享链接失效。
- 将 EdgeOne 重定向配置纳入版本、构建与自动检查。
- 保持 `robotaxi.xingbuild.top` 由 Robotaxi 独立项目发布，不进入 xingbuild 构建产物。

## 本轮不做

- 不修改网站视觉和内容。
- 不改变 `xingbuild.top` 的主域名地位。
- 不把 Robotaxi 构建产物或发布流程并入 xingbuild。
- 不删除旧 EdgeOne 项目或 GitHub Pages 备用地址。

## 验收标准

- `npm run release:check` 验证 `edgeone.json` 存在并进入 `dist/client`。
- `https://www.xingbuild.top/*` 返回 301，目标为 `https://xingbuild.top/*`。
- `https://xingbuild.top` 继续直接返回网站，不发生跳转循环。
- `robotaxi.xingbuild.top` 继续指向独立的 `robotaxi-nochina` 项目。
