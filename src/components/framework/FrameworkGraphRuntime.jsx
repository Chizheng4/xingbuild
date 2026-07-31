import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

function pointsPath(points) {
  if (!points?.length) return "";
  return points.reduce((path, point, index) => `${path}${index ? " L" : "M"}${point.x} ${point.y}`, "");
}

function FrameworkEdge({ id, data, markerEnd }) {
  return (
    <>
      <BaseEdge
        id={id}
        path={pointsPath(data.points)}
        markerEnd={markerEnd}
        className={data.active ? "is-active" : "is-muted"}
      />
      {data.showLabel && data.label ? (
        <EdgeLabelRenderer>
          <span
            className={`framework-flow__edge-label${data.active ? " is-active" : ""}`}
            style={{ transform: `translate(-50%, -50%) translate(${data.label.x}px, ${data.label.y}px)` }}
          >
            {data.text}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function FrameworkNode({ data }) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="framework-flow__handle" />
      <button
        ref={data.nodeRef}
        type="button"
        className={[
          "framework-flow__node",
          `is-${data.kind}`,
          data.drilldown && "is-drilldown",
          data.selected && "is-selected",
          data.previewed && "is-previewed",
          data.related && "is-related",
          data.dimmed && "is-dimmed",
        ].filter(Boolean).join(" ")}
        aria-pressed={data.selected}
        aria-label={data.drilldown ? `${data.name}，进入数字化实现` : `${data.name}，查看定义、作用和直接关系`}
        onMouseEnter={() => data.onPreview(data.id)}
        onMouseLeave={() => data.onPreview(null)}
        onFocus={() => data.onPreview(data.id)}
        onBlur={() => data.onPreview(null)}
        onClick={(event) => {
          event.stopPropagation();
          data.onActivate();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            data.onActivate();
          }
        }}
      >
        <span>{data.name}</span>
        {data.drilldown ? <small>进入数字化实现</small> : null}
      </button>
      <Handle type="source" position={Position.Right} className="framework-flow__handle" />
    </>
  );
}

const nodeTypes = { frameworkNode: FrameworkNode };
const edgeTypes = { frameworkEdge: FrameworkEdge };

export function FrameworkGraphRuntime({
  nodes,
  edges,
  width,
  height,
  projection,
  ariaLabel,
}) {
  return (
    <div
      className="framework-flow"
      data-projection={projection}
      style={{ "--framework-layout-ratio": `${width} / ${height}` }}
      role="region"
      aria-label={ariaLabel}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        disableKeyboardA11y
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        fitView
        fitViewOptions={{ padding: projection === "mobile" ? 0.02 : 0.03, minZoom: 0.1, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={1}
        proOptions={{ hideAttribution: true }}
        ariaLabelConfig={{
          "node.a11yDescription.default": "只读业务架构节点。使用 Tab 移动到节点按钮，按 Enter 或空格查看权威解释。",
          "node.a11yDescription.keyboardDisabled": "只读业务架构节点。节点不可移动、删除或连接。",
          "edge.a11yDescription.default": "只读业务关系。关系不可选择、删除或编辑。",
        }}
      />
    </div>
  );
}
