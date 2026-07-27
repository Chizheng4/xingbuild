import { useMemo, useRef, useState } from "react";
import {
  architectures,
  connectedEdgeIds,
} from "../../content/frameworkModel";

function ArchitectureNode({
  architecture,
  item,
  selectedId,
  previewId,
  connectedNodeIds,
  onPreview,
  onSelect,
}) {
  const { desktop, mobile } = item.projection;
  const selected = selectedId === item.id;
  const previewed = previewId === item.id;
  const related = connectedNodeIds.has(item.id);
  const classNames = [
    "architecture-node",
    `is-${item.kind}`,
    selected ? "is-selected" : "",
    previewed ? "is-previewed" : "",
    related ? "is-related" : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classNames}
      style={{
        "--node-x-desktop": desktop.x,
        "--node-y-desktop": `${desktop.y}px`,
        "--node-width-desktop": desktop.width,
        "--node-x-mobile": mobile.x,
        "--node-y-mobile": `${mobile.y}px`,
        "--node-width-mobile": mobile.width,
      }}
      aria-pressed={selected}
      aria-label={`${item.name}，点击查看解释`}
      onMouseEnter={() => onPreview(item.id)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(item.id)}
      onBlur={() => onPreview(null)}
      onClick={() => onSelect(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(item.id);
        }
      }}
    >
      <strong>{item.name}</strong>
      <small>{item.caption}</small>
      {selected ? <span aria-hidden="true">当前</span> : null}
    </button>
  );
}

function ArchitectureLines({
  architecture,
  projection,
  selectedId,
  previewId,
}) {
  const activeNodeId = previewId ?? selectedId;
  const activeEdgeIds = new Set(connectedEdgeIds(architecture, activeNodeId));
  const markerId = `${architecture.id}-${projection}-arrow`;
  const markerActiveId = `${architecture.id}-${projection}-arrow-active`;

  return (
    <svg
      className={`architecture-lines is-${projection}`}
      viewBox={architecture.viewBox[projection]}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7Z" className="architecture-arrow" />
        </marker>
        <marker id={markerActiveId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8Z" className="architecture-arrow is-active" />
        </marker>
      </defs>
      {architecture.tracks.map((track) => {
        const highlighted = track.relatedEdgeIds.some((id) => activeEdgeIds.has(id));
        return (
          <path
            key={track.id}
            className={`architecture-track${highlighted ? " is-active" : ""}`}
            d={track.projection[projection].path}
          />
        );
      })}
      {architecture.edges.map((item) => {
        const geometry = item.projection[projection];
        const highlighted = activeEdgeIds.has(item.id);
        return (
          <g
            key={item.id}
            className={`architecture-edge is-${item.kind}${highlighted ? " is-active" : ""}`}
            data-edge-id={item.id}
          >
            <path
              d={geometry.path}
              markerEnd={`url(#${highlighted ? markerActiveId : markerId})`}
            />
            <text x={geometry.label.x} y={geometry.label.y}>{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function NodeExplanation({ architecture, selectedNode }) {
  const directRelations = architecture.edges.filter(
    (item) => item.from === selectedNode.id || item.to === selectedNode.id,
  );

  return (
    <aside
      className="architecture-explanation"
      aria-labelledby={`${architecture.id}-${selectedNode.id}-title`}
    >
      <p className="architecture-explanation__label">当前节点</p>
      <h3 id={`${architecture.id}-${selectedNode.id}-title`}>{selectedNode.name}</h3>
      <p className="architecture-explanation__definition">{selectedNode.definition}</p>
      <p className="architecture-explanation__role">{selectedNode.role}</p>
      <div className="architecture-explanation__relations">
        <h4>直接关系</h4>
        <ul>
          {directRelations.map((relation) => {
            const from = architecture.nodes.find((item) => item.id === relation.from);
            const to = architecture.nodes.find((item) => item.id === relation.to);
            return (
              <li key={relation.id}>
                <span>{from.name}</span>
                <strong>{relation.label}</strong>
                <span>{to.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function ArchitectureSection({ architecture }) {
  const [selectedId, setSelectedId] = useState(architecture.defaultNodeId);
  const [previewId, setPreviewId] = useState(null);
  const liveRef = useRef(null);
  const selectedNode = architecture.nodes.find((item) => item.id === selectedId);
  const connectedNodeIds = useMemo(() => {
    const ids = new Set([selectedId]);
    for (const item of architecture.edges) {
      if (item.from === selectedId) ids.add(item.to);
      if (item.to === selectedId) ids.add(item.from);
    }
    return ids;
  }, [architecture, selectedId]);

  const selectNode = (id) => {
    setSelectedId(id);
    const name = architecture.nodes.find((item) => item.id === id)?.name;
    if (liveRef.current) liveRef.current.textContent = `已选择${name}`;
  };

  return (
    <section className="architecture-section" aria-labelledby={`${architecture.id}-question`}>
      <header className="architecture-section__header">
        <p className="architecture-section__kicker">{architecture.kicker}</p>
        <div>
          <h2 id={`${architecture.id}-question`}>{architecture.question}</h2>
          <p>{architecture.intro}</p>
        </div>
      </header>
      <div className="architecture-stage">
        <div
          className="architecture-diagram"
          data-architecture={architecture.id}
          style={{
            "--diagram-height-desktop": `${architecture.height.desktop}px`,
            "--diagram-height-mobile": `${architecture.height.mobile}px`,
          }}
        >
          {architecture.boundary ? (
            <div
              className="architecture-system-boundary"
              style={{
                "--boundary-top-desktop": `${architecture.boundary.desktop.top}px`,
                "--boundary-bottom-desktop": `${architecture.boundary.desktop.bottom}px`,
                "--boundary-top-mobile": `${architecture.boundary.mobile.top}px`,
                "--boundary-bottom-mobile": `${architecture.boundary.mobile.bottom}px`,
              }}
              aria-hidden="true"
            >
              <span>{architecture.boundary.label}</span>
            </div>
          ) : null}
          <ArchitectureLines
            architecture={architecture}
            projection="desktop"
            selectedId={selectedId}
            previewId={previewId}
          />
          <ArchitectureLines
            architecture={architecture}
            projection="mobile"
            selectedId={selectedId}
            previewId={previewId}
          />
          {architecture.nodes.map((item) => (
            <ArchitectureNode
              key={item.id}
              architecture={architecture}
              item={item}
              selectedId={selectedId}
              previewId={previewId}
              connectedNodeIds={connectedNodeIds}
              onPreview={setPreviewId}
              onSelect={selectNode}
            />
          ))}
        </div>
        <NodeExplanation architecture={architecture} selectedNode={selectedNode} />
      </div>
      <p className="sr-only" aria-live="polite" ref={liveRef} />
    </section>
  );
}

export function FrameworkExplorer() {
  return (
    <div className="architecture-page-flow">
      {architectures.map((architecture) => (
        <ArchitectureSection key={architecture.id} architecture={architecture} />
      ))}
    </div>
  );
}
