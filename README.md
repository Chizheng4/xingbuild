# xingbuild

xingbuild 是金星（Xingjin）的作者型个人网站和持续演进的作品体系。

> 本文件只作项目入口说明，不是产品、迭代、问题或发布事实源；工作流以 `AGENTS.md`、`docs/rules/iteration-and-release.md`、产品总案和 `docs/iterations/current.md` 为准。

当前网站通过三个顶层栏目连接作者观察、持续构建的作品和职业信用：

```text
B端产品 / 经营观察 / 关于我
```

## 本地运行

标准入口：

```text
./start-xingbuild.command
```

固定预览地址：`http://localhost:4317/`

## 项目入口

- [文档索引](docs/README.md)
- [当前迭代](docs/iterations/current.md)
- [迭代与发布规则](docs/rules/iteration-and-release.md)
- [网站出版体系、品牌与视觉方向](docs/explorations/网站出版体系、品牌与视觉方向.md)
- [版本记录](VERSION.md)

## 发布边界

生产发布使用 `./publish-xingbuild.command`，只传输预生成且身份匹配的 `dist/client`，不执行 build 或业务 QA；目标是固定 EdgeOne Makers 项目 `xingbuild-nochina`。发布、域名、GitHub 推送和公网验证必须继续按照项目规则分别确认。
