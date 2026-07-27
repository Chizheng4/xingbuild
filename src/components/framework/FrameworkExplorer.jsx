import { useMemo, useRef, useState } from "react";
import { architectureById, connectedEdgeIds } from "../../content/frameworkModel";
import { clampGraphPan, isLabelSafe } from "./frameworkGeometry";

const overview = architectureById.get("enterprise-operation");

function GraphNode({ item, selectedId, previewId, connectedNodeIds, onPreview, onSelect, suppressClickRef }) {
  const selected = selectedId === item.id;
  const previewed = previewId === item.id;
  const related = connectedNodeIds.has(item.id);
  const { desktop } = item.projection;
  return (
    <button
      type="button"
      className={["graph-node", `is-${item.kind}`, selected && "is-selected", previewed && "is-previewed", related && "is-related"].filter(Boolean).join(" ")}
      style={{
        "--graph-node-x": `${desktop.x}%`,
        "--graph-node-y": `${(desktop.y / overview.height.desktop) * 100}%`,
        "--graph-node-width": `${desktop.width}%`,
      }}
      aria-pressed={selected}
      aria-label={`${item.name}，点击查看解释`}
      onMouseEnter={() => onPreview(item.id)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(item.id)}
      onBlur={() => onPreview(null)}
      onClick={() => {
        if (!suppressClickRef.current) onSelect(item.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(item.id);
        }
      }}
    >
      {item.name}
    </button>
  );
}

function GraphEdges({ selectedId, previewId }) {
  const activeNodeId = previewId ?? selectedId;
  const activeEdgeIds = new Set(connectedEdgeIds(overview, activeNodeId));
  const markerId = "framework-overview-arrow";
  return (
    <svg className="graph-canvas__edges" viewBox={overview.viewBox.desktop} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7Z" />
        </marker>
      </defs>
      {overview.edges.map((edge) => {
        const active = activeEdgeIds.has(edge.id);
        const safe = isLabelSafe(overview, edge);
        return (
          <g key={edge.id} className={`graph-edge${active ? " is-active" : ""}`} data-edge-id={edge.id}>
            <path d={edge.projection.desktop.path} markerEnd={`url(#${markerId})`} />
            {safe ? <text x={edge.projection.desktop.label.x} y={edge.projection.desktop.label.y}>{edge.label}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

function ExplanationPanel({ selectedNode }) {
  const directRelations = overview.edges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id);
  return (
    <section className="framework-explanation" aria-labelledby={`framework-node-${selectedNode.id}`}>
      <h2 id={`framework-node-${selectedNode.id}`}>{selectedNode.name}</h2>
      <div className="framework-explanation__body">
        <div><h3>定义</h3><p>{selectedNode.definition}</p></div>
        <div><h3>作用</h3><p>{selectedNode.role}</p></div>
        <div><h3>直接关系</h3><ul>{directRelations.map((edge) => {
          const from = overview.nodes.find((node) => node.id === edge.from);
          const to = overview.nodes.find((node) => node.id === edge.to);
          return <li key={edge.id}>{from.name} <strong>{edge.label}</strong> {to.name}</li>;
        })}</ul></div>
      </div>
    </section>
  );
}

export function FrameworkExplorer() {
  const [activeViewId] = useState("overview");
  const [selectedId, setSelectedId] = useState(overview.defaultNodeId);
  const [previewId, setPreviewId] = useState(null);
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0 });
  const startRef = useRef(null);
  const suppressClickRef = useRef(false);
  const liveRef = useRef(null);
  const selectedNode = overview.nodes.find((item) => item.id === selectedId);
  const connectedNodeIds = useMemo(() => {
    const ids = new Set([selectedId]);
    for (const edge of overview.edges) {
      if (edge.from === selectedId) ids.add(edge.to);
      if (edge.to === selectedId) ids.add(edge.from);
    }
    return ids;
  }, [selectedId]);

  const selectNode = (id) => {
    setSelectedId(id);
    liveRef.current.textContent = `已选择${overview.nodes.find((item) => item.id === id)?.name}`;
  };

  const reset = () => {
    setViewportTransform({ x: 0, y: 0 });
    setSelectedId(overview.defaultNodeId);
    setPreviewId(null);
    liveRef.current.textContent = "已复位企业经营体系总览";
  };

  const pointerDown = (event) => {
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
    if (start.dragged) setViewportTransform(clampGraphPan({ x: start.origin.x + x, y: start.origin.y + y }, start.canvas));
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

  return (
    <section className="framework-explorer" data-active-view={activeViewId} aria-label="企业经营体系总览">
      <div className="framework-explorer__tools">
        <p>企业经营体系总览</p>
        <button type="button" onClick={reset}>复位视图</button>
      </div>
      <div
        className="graph-canvas"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <div className="graph-canvas__viewport" style={{ "--graph-pan-x": `${viewportTransform.x}px`, "--graph-pan-y": `${viewportTransform.y}px` }}>
          {overview.boundary ? <div className="graph-canvas__boundary" aria-hidden="true"><span>{overview.boundary.label}</span></div> : null}
          <GraphEdges selectedId={selectedId} previewId={previewId} />
          {overview.nodes.map((item) => <GraphNode key={item.id} item={item} selectedId={selectedId} previewId={previewId} connectedNodeIds={connectedNodeIds} onPreview={setPreviewId} onSelect={selectNode} suppressClickRef={suppressClickRef} />)}
        </div>
      </div>
      <ExplanationPanel selectedNode={selectedNode} />
      <p className="sr-only" aria-live="polite" ref={liveRef} />
    </section>
  );
}
