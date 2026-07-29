import { useEffect, useMemo, useRef, useState } from "react";
import { architectureById, connectedEdgeIds } from "../../content/frameworkModel";
import { navigate, useLocation } from "../../lib/navigation";
import { clampGraphPan, isLabelSafe } from "./frameworkGeometry";
import { DIGITAL_IMPLEMENTATION_VIEW, FRAMEWORK_OVERVIEW_VIEW, frameworkViewPath, resolveFrameworkView } from "./frameworkView";
import { ShowcaseLayout } from "../site/LayoutShell";
import { SystemStage } from "../showcase/SystemStage";

const overview = architectureById.get("enterprise-operation");
const digitalImplementation = architectureById.get("digital-implementation");
const drilldownNodeId = "digital-implementation";

function GraphNode({
  architecture,
  activeViewId,
  item,
  selectedId,
  previewId,
  connectedNodeIds,
  onPreview,
  onSelect,
  onEnterView,
  suppressClickRef,
  nodeRef,
}) {
  const selected = selectedId === item.id;
  const previewed = previewId === item.id;
  const related = connectedNodeIds.has(item.id);
  const isDrilldown = activeViewId === FRAMEWORK_OVERVIEW_VIEW && item.id === drilldownNodeId;
  const { desktop, mobile } = item.projection;
  const activate = () => {
    if (!suppressClickRef.current) {
      if (isDrilldown) onEnterView();
      else onSelect(item.id);
    }
  };
  return (
    <button
      ref={nodeRef}
      type="button"
      className={[
        "graph-node",
        `is-${item.kind}`,
        isDrilldown && "is-drilldown",
        selected && "is-selected",
        previewed && "is-previewed",
        related && "is-related",
      ].filter(Boolean).join(" ")}
      style={{
        "--graph-node-x": `${desktop.x}%`,
        "--graph-node-y": `${(desktop.y / architecture.height.desktop) * 100}%`,
        "--graph-node-width": `${desktop.width}%`,
        "--graph-node-mobile-x": `${mobile.x}%`,
        "--graph-node-mobile-y": `${(mobile.y / architecture.height.mobile) * 100}%`,
        "--graph-node-mobile-width": `${mobile.width}%`,
      }}
      aria-pressed={selected}
      aria-label={isDrilldown ? `${item.name}，进入数字化实现` : `${item.name}，点击查看解释`}
      onMouseEnter={() => onPreview(item.id)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(item.id)}
      onBlur={() => onPreview(null)}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      }}
    >
      <span>{item.name}</span>
      {isDrilldown ? <small>进入数字化实现</small> : null}
    </button>
  );
}

function GraphEdges({ architecture, selectedId, previewId, projection, className }) {
  const activeNodeId = previewId ?? selectedId;
  const activeEdgeIds = new Set(connectedEdgeIds(architecture, activeNodeId));
  const markerId = `framework-${architecture.id}-${projection}-arrow`;
  return (
    <svg className={["graph-canvas__edges", className].filter(Boolean).join(" ")} viewBox={architecture.viewBox[projection]} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7Z" />
        </marker>
      </defs>
      {architecture.tracks.map((track) => <path key={track.id} className="graph-track" d={track.projection[projection].path} />)}
      {architecture.edges.map((edge) => {
        const active = activeEdgeIds.has(edge.id);
        const safe = isLabelSafe(architecture, edge, projection);
        return (
          <g key={edge.id} className={`graph-edge${active ? " is-active" : ""}`} data-edge-id={edge.id}>
            <path d={edge.projection[projection].path} markerEnd={`url(#${markerId})`} />
            {safe ? <text x={edge.projection[projection].label.x} y={edge.projection[projection].label.y}>{edge.label}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

function FrameworkDescription({ architecture, selectedNode, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  const Subheading = `h${headingLevel + 1}`;
  const directRelations = architecture.edges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id);
  return (
    <section className="framework-description" aria-labelledby={`framework-node-${selectedNode.id}`}>
      <p className="framework-description__status">当前节点</p>
      <Heading id={`framework-node-${selectedNode.id}`}>{selectedNode.name}</Heading>
      <div className="framework-description__body">
        <div><Subheading>定义</Subheading><p>{selectedNode.definition}</p></div>
        <div><Subheading>作用</Subheading><p>{selectedNode.role}</p></div>
        <div><Subheading>直接关系</Subheading><ul>{directRelations.map((edge) => {
          const from = architecture.nodes.find((node) => node.id === edge.from);
          const to = architecture.nodes.find((node) => node.id === edge.to);
          return <li key={edge.id}>{from.name} <strong>{edge.label}</strong> {to.name}</li>;
        })}</ul></div>
      </div>
    </section>
  );
}

export function FrameworkExplorer({ descriptionHeadingLevel = 2 }) {
  const location = useLocation();
  const activeViewId = resolveFrameworkView(location.search);
  const activeArchitecture = activeViewId === digitalImplementation.id ? digitalImplementation : overview;
  const [selectedId, setSelectedId] = useState(activeArchitecture.defaultNodeId);
  const [previewId, setPreviewId] = useState(null);
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0 });
  const startRef = useRef(null);
  const suppressClickRef = useRef(false);
  const liveRef = useRef(null);
  const returnNodeRef = useRef(null);

  useEffect(() => {
    const isExplicitReturn = activeViewId === FRAMEWORK_OVERVIEW_VIEW && location.state?.frameworkReturnFocus;
    setSelectedId(isExplicitReturn ? drilldownNodeId : activeArchitecture.defaultNodeId);
    setPreviewId(null);
    setViewportTransform({ x: 0, y: 0 });
    if (isExplicitReturn) {
      window.requestAnimationFrame(() => returnNodeRef.current?.focus());
    }
  }, [activeArchitecture.defaultNodeId, activeViewId, location.state]);

  const selectedNode = activeArchitecture.nodes.find((item) => item.id === selectedId) ?? activeArchitecture.nodes.find((item) => item.id === activeArchitecture.defaultNodeId);
  const connectedNodeIds = useMemo(() => {
    const ids = new Set([selectedNode.id]);
    for (const edge of activeArchitecture.edges) {
      if (edge.from === selectedNode.id) ids.add(edge.to);
      if (edge.to === selectedNode.id) ids.add(edge.from);
    }
    return ids;
  }, [activeArchitecture, selectedNode.id]);

  const selectNode = (id) => {
    const node = activeArchitecture.nodes.find((item) => item.id === id);
    if (!node) return;
    setSelectedId(id);
    if (liveRef.current) liveRef.current.textContent = `已选择${node.name}`;
  };

  const reset = () => {
    setViewportTransform({ x: 0, y: 0 });
    setSelectedId(activeArchitecture.defaultNodeId);
    setPreviewId(null);
    if (liveRef.current) liveRef.current.textContent = `已复位${activeViewId === FRAMEWORK_OVERVIEW_VIEW ? "企业经营体系总览" : "数字化实现"}`;
  };

  const enterDigitalImplementation = () => {
    navigate(frameworkViewPath(DIGITAL_IMPLEMENTATION_VIEW), { scroll: false });
  };

  const returnToOverview = () => {
    navigate(frameworkViewPath(FRAMEWORK_OVERVIEW_VIEW), {
      replace: true,
      scroll: false,
      state: { frameworkReturnFocus: true },
    });
  };

  const pointerDown = (event) => {
    if (event.target.closest(".graph-node, button, a, input, select, textarea")) return;
    startRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      origin: viewportTransform,
      canvas: { width: event.currentTarget.clientWidth, height: event.currentTarget.clientHeight },
      dragged: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event) => {
    const start = startRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.hypot(x, y) > 4) start.dragged = true;
    if (start.dragged) {
      setViewportTransform(clampGraphPan(
        { x: start.origin.x + x, y: start.origin.y + y },
        start.canvas,
        activeArchitecture,
        window.matchMedia("(max-width: 519px)").matches ? "mobile" : "desktop",
      ));
    }
  };
  const pointerUp = (event) => {
    const start = startRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (start.dragged) {
      suppressClickRef.current = true;
      event.preventDefault();
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    startRef.current = null;
  };

  const stage = (
    <SystemStage>
      <div className="framework-explorer__tools">
        <p>{activeViewId === FRAMEWORK_OVERVIEW_VIEW ? "企业经营体系总览" : "数字化实现"}</p>
        <div>
          {activeViewId !== FRAMEWORK_OVERVIEW_VIEW ? <button type="button" onClick={returnToOverview}>返回总览</button> : null}
          <button type="button" onClick={reset}>复位视图</button>
        </div>
      </div>
      <div
        className="graph-canvas"
        data-mobile-world={activeViewId === digitalImplementation.id ? "true" : undefined}
        data-active-view={activeViewId}
        style={{ "--graph-mobile-world-height": activeArchitecture.height.mobile }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <div className="graph-canvas__viewport" style={{ "--graph-pan-x": `${viewportTransform.x}px`, "--graph-pan-y": `${viewportTransform.y}px` }}>
          {activeArchitecture.boundary ? <div className="graph-canvas__boundary" aria-hidden="true"><span>{activeArchitecture.boundary.label}</span></div> : null}
          <GraphEdges architecture={activeArchitecture} selectedId={selectedNode.id} previewId={previewId} projection="desktop" className="graph-canvas__edges--desktop" />
          {activeViewId === digitalImplementation.id ? <GraphEdges architecture={activeArchitecture} selectedId={selectedNode.id} previewId={previewId} projection="mobile" className="graph-canvas__edges--mobile" /> : null}
          {activeArchitecture.nodes.map((item) => <GraphNode
            key={item.id}
            architecture={activeArchitecture}
            activeViewId={activeViewId}
            item={item}
            selectedId={selectedNode.id}
            previewId={previewId}
            connectedNodeIds={connectedNodeIds}
            onPreview={setPreviewId}
            onSelect={selectNode}
            onEnterView={enterDigitalImplementation}
            suppressClickRef={suppressClickRef}
            nodeRef={item.id === drilldownNodeId && activeViewId === FRAMEWORK_OVERVIEW_VIEW ? returnNodeRef : undefined}
          />)}
        </div>
      </div>
    </SystemStage>
  );

  return (
    <section className="framework-explorer" data-active-view={activeViewId} aria-label={activeViewId === FRAMEWORK_OVERVIEW_VIEW ? "企业经营体系总览" : "数字化实现"}>
      <ShowcaseLayout
        description={<FrameworkDescription architecture={activeArchitecture} selectedNode={selectedNode} headingLevel={descriptionHeadingLevel} />}
        stage={stage}
      />
      <p className="sr-only" aria-live="polite" ref={liveRef} />
    </section>
  );
}
