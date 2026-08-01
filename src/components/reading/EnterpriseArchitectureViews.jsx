import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { navigate, useLocation } from "../../lib/navigation";
import { enterpriseArchitectureView, enterpriseArchitectureViewIds, isEnterpriseArchitectureViewId } from "./enterpriseArchitectureViews";

const LikeC4Reader = lazy(() => import("../../generated/enterpriseArchitectureViews.jsx").then((module) => ({ default: module.LikeC4View })));
const articleAnchor = "digital-implementation";

class RuntimeBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {}
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function relationText(edge, nodes) {
  const from = nodes.find((node) => node.id === edge.from);
  const to = nodes.find((node) => node.id === edge.to);
  return `${from?.name ?? edge.from} ${edge.label} ${to?.name ?? edge.to}`;
}

function ArchitectureTextFallback({ view, selectedId, onSelect, visible = false }) {
  const selected = view.nodes.find((node) => node.id === selectedId) ?? view.nodes[0];
  return <div className={`enterprise-architecture__fallback${visible ? " is-visible" : ""}`} role="status">
    <p>以同源关系清单阅读当前视图。</p>
    <ul className="enterprise-architecture__nodes">
      {view.nodes.map((node) => <li key={node.id}><button type="button" aria-pressed={node.id === selected.id} onClick={() => onSelect(node.id)}>{node.name}</button></li>)}
    </ul>
    <section className="enterprise-architecture__selection" aria-live="polite">
      <p>当前节点</p>
      <h3>{selected.name}</h3>
      <p>{selected.definition}</p>
      <p>{selected.role}</p>
    </section>
    <section className="enterprise-architecture__relations" aria-label={`${view.title}关系`}>
      <h3>关系</h3>
      <ul>{view.edges.map((edge) => <li key={edge.id}>{relationText(edge, view.nodes)}</li>)}</ul>
    </section>
  </div>;
}

function ArchitectureRuntime({ viewId, onSelect, fallback }) {
  return <RuntimeBoundary key={viewId} fallback={fallback}>
    <Suspense fallback={<p className="enterprise-architecture__loading" role="status">正在载入架构视图…</p>}>
      <LikeC4Reader
        viewId={viewId}
        controls={false}
        pannable={false}
        zoomable={false}
        background="transparent"
        enableElementDetails={false}
        enableRelationshipDetails={false}
        enableRelationshipBrowser={false}
        enableNotes={false}
        onNodeClick={(node) => onSelect(node.id)}
      />
    </Suspense>
  </RuntimeBoundary>;
}

export function EnterpriseArchitectureViews() {
  const location = useLocation();
  const entryRef = useRef(null);
  const titleRef = useRef(null);
  const requestedView = new URLSearchParams(location.search).get("architecture-view");
  const activeViewId = isEnterpriseArchitectureViewId(requestedView) ? requestedView : null;
  const activeView = enterpriseArchitectureView(activeViewId ?? "landscape");
  const [selectedId, setSelectedId] = useState(activeView?.nodes[0]?.id);

  useEffect(() => {
    setSelectedId(activeView?.nodes[0]?.id);
    if (activeViewId) window.setTimeout(() => titleRef.current?.focus(), 0);
    if (!activeViewId && location.state?.architectureReturnFocus) window.setTimeout(() => entryRef.current?.focus(), 0);
  }, [activeView?.id, activeViewId, location.state]);

  const activeSelection = useMemo(() => activeView?.nodes.find((node) => node.id === selectedId)?.id ?? activeView?.nodes[0]?.id, [activeView, selectedId]);
  if (!activeView) return null;

  const setView = (viewId) => {
    navigate(`/business-observations?architecture-view=${viewId}#${articleAnchor}`, { state: { architectureView: viewId }, scroll: false });
  };
  const enter = () => setView("landscape");
  const returnToArticle = () => navigate(`/business-observations#${articleAnchor}`, { state: { architectureReturnFocus: true }, scroll: false });
  const fallback = <ArchitectureTextFallback view={activeView} selectedId={activeSelection} onSelect={setSelectedId} visible />;

  return <section className="enterprise-architecture" id="enterprise-architecture-views" aria-labelledby="enterprise-architecture-views-title">
    {!activeViewId ? <div className="enterprise-architecture__entry">
      <p>从总览进入，按业务、数字化与产品层级阅读同源架构。</p>
      <button ref={entryRef} type="button" onClick={enter}>打开架构视图</button>
    </div> : <>
      <nav className="enterprise-architecture__navigation" aria-label="企业经营体系架构视图">
        <button type="button" onClick={returnToArticle}>← 返回企业经营体系正文</button>
        <ol>{enterpriseArchitectureViewIds.map((viewId) => {
          const view = enterpriseArchitectureView(viewId);
          return <li key={viewId}><button type="button" aria-current={viewId === activeViewId ? "page" : undefined} onClick={() => setView(viewId)}>{view.title}</button></li>;
        })}</ol>
      </nav>
      <header className="enterprise-architecture__header">
        <p>架构视图</p>
        <h2 ref={titleRef} tabIndex="-1" id="enterprise-architecture-views-title">{activeView.title}</h2>
      </header>
      <div className="enterprise-architecture__runtime" aria-label={`${activeView.title}只读架构图`}>
        <ArchitectureRuntime viewId={activeViewId} onSelect={setSelectedId} fallback={fallback} />
      </div>
      <ArchitectureTextFallback view={activeView} selectedId={activeSelection} onSelect={setSelectedId} />
    </>}
  </section>;
}
