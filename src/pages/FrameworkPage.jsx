import { FrameworkExplorer } from "../components/framework/FrameworkExplorer";
import { FRAMEWORK_SOURCE, FRAMEWORK_VERSION } from "../content/frameworkModel";
import { Link } from "../lib/navigation";
import { useEffect } from "react";

export function FrameworkPage({ search, navigationState }) {
  const params = new URLSearchParams(search);
  const viewId = params.get("view") ?? "overview";
  const selectedId = params.get("concept") ?? "";
  useEffect(() => {
    if (typeof navigationState?.restoreScrollY === "number") {
      window.requestAnimationFrame(() => window.scrollTo({ top: navigationState.restoreScrollY, behavior: "auto" }));
    }
  }, [navigationState]);
  return (
    <article className="framework-page framework-section-flow">
      <header className="framework-header object-stack">
        <Link className="back-link" href="/works/enterprise-operating-framework">← 返回作品</Link>
        <p className="eyebrow">认知框架浏览器</p>
        <h1>企业经营体系：从整体进入局部、概念、底层与应用</h1>
        <p>
          先理解四个平面的责任与反馈关系，再进入数字化实现、企业业务架构和概念定义。
          所有页面都从同一模型读取，不在视图中复制第二份定义。
        </p>
        <aside className="framework-reading-hint">
          <strong>如何阅读</strong>
          <span>桌面可悬停或聚焦快速预览，点击保留稳定详情；手机点击后进入独立概念页。</span>
        </aside>
      </header>
      <FrameworkExplorer viewId={viewId} selectedId={selectedId} search={search} />
      <aside className="framework-evidence-note">
        <strong>来源与版本</strong>
        <p>{FRAMEWORK_SOURCE} · {FRAMEWORK_VERSION}。xingbuild 只组织当前版本快照，不取代 career 上游权威。</p>
      </aside>
    </article>
  );
}
