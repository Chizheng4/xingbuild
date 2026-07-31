import { useEffect, useMemo, useRef, useState } from "react";
import { MarkerType } from "@xyflow/react";
import { architectureById } from "../../content/frameworkModel";
import { frameworkLayouts } from "../../generated/frameworkLayouts";
import { navigate, useLocation } from "../../lib/navigation";
import { DIGITAL_IMPLEMENTATION_VIEW, FRAMEWORK_OVERVIEW_VIEW, frameworkViewPath, resolveFrameworkView } from "./frameworkView";
import { FrameworkGraphRuntime } from "./FrameworkGraphRuntime";
import { ShowcaseLayout } from "../site/LayoutShell";
import { SystemStage } from "../showcase/SystemStage";
import { ReturnNavigation } from "../navigation/ReturnNavigation";

const overview = architectureById.get("enterprise-operation");
const digitalImplementation = architectureById.get("digital-implementation");
const drilldownNodeId = "digital-implementation";

function FrameworkDescription({ architecture, selectedNode, headingLevel = 2, descriptionRef, returnNavigation }) {
  const Heading = `h${headingLevel}`;
  const Subheading = `h${headingLevel + 1}`;
  const directRelations = architecture.edges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id);
  return (
    <section ref={descriptionRef} className="framework-description" aria-labelledby={`framework-node-${selectedNode.id}`} tabIndex="-1">
      {returnNavigation}
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
      <div className="framework-description__all-relations">
        <Subheading>完整关系</Subheading>
        <ul>{architecture.edges.map((edge) => {
          const from = architecture.nodes.find((node) => node.id === edge.from);
          const to = architecture.nodes.find((node) => node.id === edge.to);
          return <li key={edge.id}>{from.name} <strong>{edge.label}</strong> {to.name}</li>;
        })}</ul>
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
  const [projection, setProjection] = useState(() => window.matchMedia("(max-width: 519px)").matches ? "mobile" : window.matchMedia("(max-width: 639px)").matches ? "compact" : "desktop");
  const liveRef = useRef(null);
  const returnNodeRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 519px)");
    const compactQuery = window.matchMedia("(max-width: 639px)");
    const update = () => setProjection(mobileQuery.matches ? "mobile" : compactQuery.matches ? "compact" : "desktop");
    update();
    mobileQuery.addEventListener("change", update);
    compactQuery.addEventListener("change", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      compactQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const isExplicitReturn = activeViewId === FRAMEWORK_OVERVIEW_VIEW && location.state?.frameworkReturnFocus;
    let focusTimer;
    setSelectedId(isExplicitReturn ? drilldownNodeId : activeArchitecture.defaultNodeId);
    setPreviewId(null);
    if (isExplicitReturn) focusTimer = window.setTimeout(() => returnNodeRef.current?.focus(), 80);
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
  const layoutProjection = activeArchitecture.id === digitalImplementation.id || projection !== "compact" ? projection : "desktop";
  const layout = frameworkLayouts[activeArchitecture.id]?.[layoutProjection];
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
      data: { ...geometry, text: edge.label, active, showLabel: activeViewId === DIGITAL_IMPLEMENTATION_VIEW || active },
    };
  }) : [], [activeArchitecture, activeNodeId, layout, ready]);

  const stage = (
    <SystemStage>
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
          />
        ) : <FrameworkTextFallback architecture={activeArchitecture} onSelect={selectNode} />}
      </div>
    </SystemStage>
  );

  return (
    <section className="framework-explorer" data-active-view={activeViewId} aria-label={activeViewId === FRAMEWORK_OVERVIEW_VIEW ? "企业经营体系总览" : "数字化实现"}>
      <ShowcaseLayout
        description={<FrameworkDescription
          architecture={activeArchitecture}
          selectedNode={selectedNode}
          headingLevel={descriptionHeadingLevel}
          descriptionRef={descriptionRef}
          returnNavigation={activeViewId === DIGITAL_IMPLEMENTATION_VIEW ? (
            <ReturnNavigation
              href={frameworkViewPath(FRAMEWORK_OVERVIEW_VIEW)}
              destination="企业经营体系"
              returnTo={frameworkViewPath(FRAMEWORK_OVERVIEW_VIEW)}
              focusTarget={drilldownNodeId}
              state={{ frameworkReturnFocus: true }}
              replace
            />
          ) : null}
        />}
        stage={stage}
      />
      <p className="sr-only" aria-live="polite" ref={liveRef} />
    </section>
  );
}
