import { architectureExplorerProjection } from "./architectureExplorerProjection";

const pointString = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");

export function ArchitectureExplorer({ architecture, projection, selectedId, previewId, onPreview, onSelect }) {
  const mobile = projection !== "desktop";
  const layout = architectureExplorerProjection[mobile ? "mobile" : "desktop"];
  const activeId = previewId ?? selectedId;
  const related = new Set([activeId]);
  architecture.edges.forEach((edge) => { if (edge.from === activeId) related.add(edge.to); if (edge.to === activeId) related.add(edge.from); });
  const layers = [...new Map(architecture.nodes.map((node) => [node.layer, node.layerLabel])).entries()];
  return <div className="architecture-explorer" data-projection={mobile ? "mobile" : "desktop"} style={{ "--architecture-ratio": `${layout.width} / ${layout.height}` }}>
    <svg className="architecture-explorer__lines" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
      <defs>
        <marker id="architecture-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" /></marker>
        <marker id="architecture-arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" /></marker>
      </defs>
      {architecture.edges.map((edge) => {
        const route = layout.routes[edge.id];
        const active = edge.from === activeId || edge.to === activeId;
        return <g key={edge.id} className={active ? "is-active" : ""}>
          <polyline points={pointString(route.points)} markerEnd={`url(#architecture-arrow${active ? "-active" : ""})`} />
          <text x={route.label[0]} y={route.label[1]}>{edge.label}</text>
        </g>;
      })}
    </svg>
    {layers.map(([id, label]) => { const [x,y,w,h] = layout.layers[id]; return <div key={id} className="architecture-explorer__layer" style={{ left:`${x/layout.width*100}%`, top:`${y/layout.height*100}%`, width:`${w/layout.width*100}%`, height:`${h/layout.height*100}%` }}><span>{label}</span></div>; })}
    {architecture.nodes.map((node) => { const [x,y,w,h] = layout.nodes[node.id]; const selected=node.id===selectedId; const previewed=node.id===previewId; return <button key={node.id} type="button" className={`architecture-explorer__node${selected?" is-selected":""}${previewed?" is-previewed":""}${related.has(node.id)?" is-related":""}`} style={{ left:`${x/layout.width*100}%`, top:`${y/layout.height*100}%`, width:`${w/layout.width*100}%`, height:`${h/layout.height*100}%` }} aria-pressed={selected} onMouseEnter={()=>!mobile&&onPreview(node.id)} onMouseLeave={()=>!mobile&&onPreview(null)} onFocus={()=>onPreview(node.id)} onBlur={()=>onPreview(null)} onClick={()=>onSelect(node.id)}>{node.name}</button>; })}
  </div>;
}
