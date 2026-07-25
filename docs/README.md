# xingbuild 文档索引

这个目录保存网站的长期规则、产品设计、上游事实、迭代历史和验证证据。根目录只保留日常启动、构建、发布和版本识别所需的直接入口。

## 目录责任

| 目录 | 责任 | 是否可直接修改 |
| --- | --- | --- |
| `rules/` | 迭代、发布和工程协作规则 | 规则变化时修改 |
| `product/` | 已形成基线的产品定位与内容模型 | 经确认后修改 |
| `design/` | 已确认的视觉与交互原则 | 经确认后修改 |
| `explorations/` | 尚在分析、比较和确认中的方案 | 可以持续迭代 |
| `iterations/current.md` | 当前唯一正式迭代指针 | 只由实施迭代更新 |
| `iterations/history/` | 已完成版本的计划和结果 | 只追加，不回写 |
| `upstream/` | career、Robotaxi 等上游事实快照与同步说明 | 按上游同步规则修改 |
| `qa/` | 按版本保存的设计验证结论和必要证据 | 完成验证时追加 |

## 根目录保留原则

以下文件留在根目录，因为它们需要被人或脚本直接发现和执行：

- `README.md`
- `AGENTS.md`
- `VERSION.md`
- `start-xingbuild.command`
- `publish-xingbuild.command`
- `package.json` 与 `package-lock.json`
- `index.html`
- `vite.config.mjs`
- `edgeone.json`

页面实现只进入 `src/`；构建与发布辅助进入 `scripts/`；Worker 和兼容测试分别进入 `worker/` 与 `tests/`。

## 当前设计探索

- [网站出版体系、品牌与视觉方向](explorations/网站出版体系、品牌与视觉方向.md)
