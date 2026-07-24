# 当前迭代

## 当前版本

`v0.1.0`

## 当前状态

`v0.1.0` 基线、标准启动、验证和发布流程已经完成，等待本地稳定版本收口。

## 当前目标

- 固定 xingbuild 的轻量迭代规则。
- 建立一键本地启动入口。
- 建立统一发布前检查。
- 建立面向 EdgeOne Makers 的生产发布入口。
- 固定 `xingbuild.top` 与 `robotaxi.xingbuild.top` 的项目边界。
- 建立本地 Git 首次提交和版本标签。
- 固定“本地提交默认执行、线上发布必须单独授权”的权限边界。

## 本轮不做

- 不修改网站视觉和内容。
- 不创建或修改 EdgeOne 线上项目。
- 不修改 DNS 和域名证书。
- 不创建 GitHub 远程仓库或推送代码。
- 不替 Robotaxi 项目建立发布流程。

## 验收标准

- `./start-xingbuild.command` 能启动固定地址的本地网站。
- `npm run release:check` 能完成结构、构建和 Worker 兼容检查。
- `./publish-xingbuild.command` 在未安装或未登录 EdgeOne CLI 时安全停止，不伪装成发布成功。
- 发布和域名状态在规则中具有可追溯的明确边界。
