# 当前迭代

## 当前状态

当前没有正在实施的产品版本。`v0.21.0` 已完成实现、验证、commit/tag、push、EdgeOne 部署和公网验收，完整记录见 [`history/v0.21.0.md`](history/v0.21.0.md)。

下一版本不得仅因存在候选文档而自动开启；必须由产品与视觉 task 选择一个候选，形成正式方案并明确写入本文件后，Engineering 才能开始。

## 已发布基线

- 产品版本：`v0.21.0`
- commit/tag：`6493f43a7504a78113f2cd0c5dff2b2894a24e34` / `v0.21.0`
- 生产：`https://xingbuild.top/`
- EdgeOne deployment：`dp6rooguw0og`
- Practice 公开 modules：0；未执行 Practice 内容发布

## 下一步候选（不是当前授权）

- `v0.22.0+`：`CapabilityHost / VisualizationHost` 统一能力展示与受控互动；
- `v0.22.0+`：LikeC4 多视图、Robotaxi 受控 `/embed`、更多 Mermaid/LikeC4 renderer，以及更复杂的对象状态、流程和生命周期互动。

这些候选必须由真实使用证据触发，并分别形成 DRAFT、正式方案、独立验收和独立版本；不得打包成全能力平台，也不得自动进入 Engineering。

## 在途变更登记

当前没有正在实施的产品版本，因此没有可附着的版本内优化登记。新发现先进入路线图或独立 DRAFT；确认后才能成为下一版本 current。

### 登记模板

```text
ID：V021-OPT-xxx
发现时间：YYYY-MM-DD
发现事实/证据：路径或可复核说明
问题与用户影响：
分类/优先级：P0 当前阻断 | P1 当前范围内 | P2 后续候选 | 内容/运营
当前决定：adopt-current | defer-next | route-content-ops | reject | closed
是否改变当前范围/验收：
责任 task：
下一动作：
决定时间：
```

### 当前登记

| ID | 发现/证据 | 分类 | 当前决定 | 范围/验收影响 | 责任与下一动作 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| — | 当前暂无新增优化登记 | — | — | — | 选择下一版本后按项目规则登记 | open |

登记后必须遵循项目规则的“当前版本进行中的新优化”合同：只有 `adopt-current` 才能在补充当前方案和验收后进入本版本；`defer-next` 必须指向独立 DRAFT/路线图条目；内容/运营问题移交对应合同。
