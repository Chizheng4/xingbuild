# 当前迭代

## 当前版本

`v0.1.3`

## 当前状态

`v0.1.3` 正在固定已上线的 EdgeOne 生产项目目标。

## 当前目标

- 固定 xingbuild 的轻量迭代规则。
- 建立一键本地启动入口。
- 建立统一发布前检查。
- 建立面向 EdgeOne Makers 的生产发布入口。
- 固定 `xingbuild.top` 与 `robotaxi.xingbuild.top` 的项目边界。
- 建立本地 Git 首次提交和版本标签。
- 固定“本地提交默认执行、线上发布必须单独授权”的权限边界。
- 建立 GitHub 远程仓库并推送稳定版本。
- 将 EdgeOne CLI 锁定为项目开发依赖，避免依赖系统管理员权限。
- 将一次 `publish` 固定为 GitHub 同步、EdgeOne 生产部署和公网版本验证。
- 将发布目标固定为实际生产项目 `xingbuild-nochina`，避免误发到同名错误项目。

## 本轮不做

- 不修改网站视觉和内容。
- 不创建或修改其他 EdgeOne 线上项目。
- 不修改 DNS 和域名证书。
- 不替 Robotaxi 项目建立发布流程。

## 验收标准

- `./start-xingbuild.command` 能启动固定地址的本地网站。
- `npm run release:check` 能完成结构、构建和 Worker 兼容检查。
- `./publish-xingbuild.command` 在未安装或未登录 EdgeOne CLI 时安全停止，不伪装成发布成功。
- 发布和域名状态在规则中具有可追溯的明确边界。
