import { useEffect, useMemo, useRef, useState } from "react";
import { MarkerType } from "@xyflow/react";
import { architectureById } from "../../content/frameworkModel";
import { frameworkLayouts } from "../../generated/frameworkLayouts";
import { navigate, useLocation } from "../../lib/navigation";
import { DIGITAL_IMPLEMENTATION_VIEW, FRAMEWORK_OVERVIEW_VIEW, frameworkViewPath, resolveFrameworkView } from "./frameworkView";
import { FrameworkGraphRuntime } from "./FrameworkGraphRuntime";
import { ShowcaseLayout } from "../site/LayoutShell";
import { SystemStage } from "../showcase/SystemStage";

const overview = architectureById.get("enterprise-operation");
const digitalImplementation = architectureById.get("digital-implementation");
const drilldownNodeId = "digital-implementation";

function FrameworkDescription({ architecture, selectedNode, headingLevel = 2, descriptionRef }) {
  const Heading = `h${headingLevel}`;
  const Subheading = `h${headingLevel + 1}`;
  const directRelations = architecture.edges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id);
  return (
    <section ref={descriptionRef} className="framework-description" aria-labelledby={`framework-node-${selectedNode.id}`} tabIndex="-1">
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

function FrameworkTextFallback({ architecture, onSelect }) {
  return (
    <div className="framework-fallback" role="status">
      <p>架构图暂不可用，以下为同源节点与直接关系。</p>
      <ul>
        {architecture.nodes.map((node) => (
          <li key={node.id}>
            <button type="button" onClick={() => onSelect(node.id)}>{node.name}</button>
            <span>{node.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function usableLayout(layout, architecture) {
  if (!layout || !Number.isFinite(layout.width) || !Number.isFinite(layout.height)) return false;
  return architecture.nodes.every((node) => layout.nodes[node.id])
    && architecture.edges.every((edge) => layout.edges[edge.id]?.source === edge.from && layout.edges[edge.id]?.target === edge.to);
}

export function FrameworkExplorer({ descriptionHeadingLevel = 2 }) {
  const location = useLocation();
  const activeViewId = resolveFrameworkView(location.search);
  const activeArchitecture = activeViewId === digitalImplementation.id ? digitalImplementation : overview;
  const [selectedId, setSelectedId] = useState(activeArchitecture.defaultNodeId);
  const [previewId, setPreviewId] = useState(null);
  const [projection, setProjection] = useState(() => window.matchMedia("(max-width: 519px)").matches ? "mobile" : "desktop");
  const flowRef = useRef(null);
  const liveRef = useRef(null);
  const returnNodeRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 519px)");
    const update = () => setProjection(query.matches ? "mobile" : "desktop");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const isExplicitReturn = activeViewId === FRAMEWORK_OVERVIEW_VIEW && location.state?.frameworkReturnFocus;
    let focusTimer;
    setSelectedId(isExplicitReturn ? drilldownNodeId : activeArchitecture.defaultNodeId);
    setPreviewId(null);
    window.requestAnimationFrame(() => {
      flowRef.current?.fitView({ padding: projection === "mobile" ? 0.02 : 0.06, duration: 0 });
      if (isExplicitReturn) {
        focusTimer = window.setTimeout(() => returnNodeRef.current?.focus(), 80);
      }
    });
    return () => window.clearTimeout(focusTimer);
  }, [activeArchitecture.defaultNodeId, activeViewId, location.state, projection]);

  const selectedNode = activeArchitecture.nodes.find((item) => item.id === selectedId)
    ?? activeArchitecture.nodes.find((item) => item.id === activeArchitecture.defaultNodeId);
  const activeNodeId = previewId ?? selectedNode.id;
  const connectedNodeIds = useMemo(() => {
    const ids = new Set([activeNodeId]);
    for (const edge of activeArchitecture.edges) {
      if (edge.from === activeNodeId) ids.add(edge.to);
      if (edge.to === activeNodeId) ids.add(edge.from);
    }
    return ids;
  }, [activeArchitecture, activeNodeId]);

  const selectNode = (id, { reveal = true } = {}) => {
    const node = activeArchitecture.nodes.find((item) => item.id === id);
    if (!node) return;
    setSelectedId(id);
    if (liveRef.current) liveRef.current.textContent = `已选择${node.name}，下方说明已更新`;
    if (reveal && projection === "mobile") {
      window.requestAnimationFrame(() => {
        const rect = descriptionRef.current?.getBoundingClientRect();
        if (rect && (rect.top < 0 || rect.top > window.innerHeight - 80)) {
          descriptionRef.current.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          });
        }
      });
    }
  };

  const enterDigitalImplementation = () => navigate(frameworkViewPath(DIGITAL_IMPLEMENTATION_VIEW), { scroll: false });
  const returnToOverview = () => navigate(frameworkViewPath(FRAMEWORK_OVERVIEW_VIEW), {
    replace: true,
    scroll: false,
    state: { frameworkReturnFocus: true },
  });
  const reset = () => {
    selectNode(activeArchitecture.defaultNodeId, { reveal: false });
    setPreviewId(null);
    flowRef.current?.fitView({ padding: projection === "mobile" ? 0.02 : 0.06, duration: 0 });
    if (liveRef.current) liveRef.current.textContent = `已复位${activeViewId === FRAMEWORK_OVERVIEW_VIEW ? "企业经营体系总览" : "数字化实现"}`;
  };

  const layout = frameworkLayouts[activeArchitecture.id]?.[projection];
  const ready = usableLayout(layout, activeArchitecture);
  const graphNodes = useMemo(() => ready ? activeArchitecture.nodes.map((node) => {
    const geometry = layout.nodes[node.id];
    const drilldown = activeViewId === FRAMEWORK_OVERVIEW_VIEW && node.id === drilldownNodeId;
    const selected = selectedNode.id === node.id;
    const previewed = previewId === node.id;
    return {
      id: node.id,
      type: "frameworkNode",
      position: { x: geometry.x, y: geometry.y },
      style: { width: geometry.width, height: geometry.height },
      data: {
        id: node.id,
        name: node.name,
        kind: node.kind,
        drilldown,
        selected,
        previewed,
        related: connectedNodeIds.has(node.id),
        dimmed: !connectedNodeIds.has(node.id),
        onPreview: setPreviewId,
        onActivate: drilldown ? enterDigitalImplementation : () => selectNode(node.id),
        nodeRef: drilldown ? returnNodeRef : undefined,
      },
    };
  }) : [], [activeArchitecture, activeViewId, connectedNodeIds, layout, previewId, ready, selectedNode.id]);
  const graphEdges = useMemo(() => ready ? activeArchitecture.edges.map((edge) => {
    const geometry = layout.edges[edge.id];
    const active = edge.from === activeNodeId || edge.to === activeNodeId;
    return {
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: "frameworkEdge",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      data: { ...geometry, text: edge.label, active },
    };
  }) : [], [activeArchitecture, activeNodeId, layout, ready]);

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
        data-active-view={activeViewId}
        data-projection={projection}
        style={ready ? { "--framework-layout-ratio": `${layout.width} / ${layout.height}` } : undefined}
      >
        {activeArchitecture.boundary ? <p className="graph-canvas__boundary-label">{activeArchitecture.boundary.label}</p> : null}
        {ready ? (
          <FrameworkGraphRuntime
            nodes={graphNodes}
            edges={graphEdges}
            width={layout.width}
            height={layout.height}
            projection={projection}
            ariaLabel={activeViewId === FRAMEWORK_OVERVIEW_VIEW ? "企业经营体系总览，只读架构图" : "数字化实现，只读架构图"}
            onInit={(instance) => { flowRef.current = instance; }}
          />
        ) : <FrameworkTextFallback architecture={activeArchitecture} onSelect={selectNode} />}
      </div>
    </SystemStage>
  );

  return (
    <section className="framework-explorer" data-active-view={activeViewId} aria-label={activeViewId === FRAMEWORK_OVERVIEW_VIEW ? "企业经营体系总览" : "数字化实现"}>
      <ShowcaseLayout
        description={<FrameworkDescription architecture={activeArchitecture} selectedNode={selectedNode} headingLevel={descriptionHeadingLevel} descriptionRef={descriptionRef} />}
        stage={stage}
      />
      <p className="sr-only" aria-live="polite" ref={liveRef} />
    </section>
  );
}
