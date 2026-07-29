const tokenPattern = /([MHV])|(-?\d+(?:\.\d+)?)/g;

export function pathSegments(path) {
  const segments = [];
  let cursor = { x: 0, y: 0 };
  let match;
  let command = null;
  let pendingMoveX = null;
  while ((match = tokenPattern.exec(path))) {
    if (match[1]) {
      command = match[1];
      continue;
    }
    const value = Number(match[2]);
    if (command === "M") {
      if (pendingMoveX === null) pendingMoveX = value;
      else {
        cursor = { x: pendingMoveX, y: value };
        pendingMoveX = null;
      }
    } else if (command === "H") {
      const next = { x: value, y: cursor.y };
      segments.push({ from: cursor, to: next });
      cursor = next;
    } else if (command === "V") {
      const next = { x: cursor.x, y: value };
      segments.push({ from: cursor, to: next });
      cursor = next;
    }
  }
  tokenPattern.lastIndex = 0;
  return segments;
}

function viewBoxSize(architecture, projection) {
  const [, , width, height] = architecture.viewBox[projection].split(" ").map(Number);
  return { width, height };
}

function lastPoint(path) {
  const segments = pathSegments(path);
  return segments.at(-1)?.to ?? null;
}

function nodeBounds(node, architecture, projection) {
  const position = node.projection[projection];
  const { width, height } = viewBoxSize(architecture, projection);
  const nodeHeight = projection === "mobile"
    ? Math.min(62, Math.max(42, height * 0.06))
    : Math.min(76, Math.max(48, height * 0.12));
  return {
    left: (position.x / 100) * width,
    top: position.y,
    right: ((position.x + position.width) / 100) * width,
    bottom: position.y + nodeHeight,
  };
}

function overlaps(first, second) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
}

function inside(point, bounds) {
  const tolerance = 1;
  return point.x >= bounds.left - tolerance && point.x <= bounds.right + tolerance && point.y >= bounds.top - tolerance && point.y <= bounds.bottom + tolerance;
}

function crossesInterior(segment, bounds) {
  const { from, to } = segment;
  if (from.x === to.x) {
    return from.x > bounds.left && from.x < bounds.right && Math.max(from.y, to.y) > bounds.top && Math.min(from.y, to.y) < bounds.bottom;
  }
  if (from.y === to.y) {
    return from.y > bounds.top && from.y < bounds.bottom && Math.max(from.x, to.x) > bounds.left && Math.min(from.x, to.x) < bounds.right;
  }
  return false;
}

export function isLabelSafe(architecture, edge, projection = "desktop") {
  const { x, y } = edge.projection[projection].label;
  const { width: viewWidth, height: viewHeight } = viewBoxSize(architecture, projection);
  const labelWidth = projection === "mobile" ? Math.max(18, edge.label.length * 5.8) : Math.max(28, edge.label.length * 10);
  const label = { left: x - labelWidth / 2, right: x + labelWidth / 2, top: y - 11, bottom: y + 4 };
  if (label.left < 0 || label.right > viewWidth || label.top < 0 || label.bottom > viewHeight) return false;
  return architecture.nodes.every((node) => {
    const bounds = nodeBounds(node, architecture, projection);
    return label.right < bounds.left || label.left > bounds.right || label.bottom < bounds.top || label.top > bounds.bottom;
  });
}

export function validateGraphGeometry(architecture, projection = "desktop") {
  const errors = [];
  const { width, height } = viewBoxSize(architecture, projection);
  const nodeMap = new Map(architecture.nodes.map((node) => [node.id, node]));
  const bounds = new Map(architecture.nodes.map((node) => [node.id, nodeBounds(node, architecture, projection)]));
  for (const node of architecture.nodes) {
    const current = bounds.get(node.id);
    if (current.left < 0 || current.top < 0 || current.right > width || current.bottom > height) errors.push(`node is clipped: ${node.id}`);
    for (const other of architecture.nodes) {
      if (node.id >= other.id) continue;
      if (overlaps(current, bounds.get(other.id))) errors.push(`nodes overlap: ${node.id}/${other.id}`);
    }
  }
  for (const edge of architecture.edges) {
    const target = nodeMap.get(edge.to);
    const endpoint = lastPoint(edge.projection[projection].path);
    if (!endpoint || !target || !inside(endpoint, bounds.get(target.id))) errors.push(`edge endpoint misses target: ${edge.id}`);
    for (const node of architecture.nodes) {
      if (node.id === edge.from || node.id === edge.to) continue;
      if (pathSegments(edge.projection[projection].path).some((segment) => crossesInterior(segment, bounds.get(node.id)))) {
        errors.push(`edge crosses unrelated node: ${edge.id}/${node.id}`);
      }
    }
  }
  return errors;
}

export function clampGraphPan(transform, canvas, architecture, projection = "desktop") {
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  if (architecture?.id === "digital-implementation" && projection === "mobile") {
    const { width: worldWidth, height: worldHeight } = viewBoxSize(architecture, projection);
    const scale = canvas.width / worldWidth;
    const verticalTravel = Math.max(0, worldHeight * scale - canvas.height);
    return { x: 0, y: clamp(transform.y, -verticalTravel, 0) };
  }
  const limitFor = (size) => Math.min(72, Math.max(24, Math.round(size * 0.08)));
  return {
    x: clamp(transform.x, -limitFor(canvas.width), limitFor(canvas.width)),
    y: clamp(transform.y, -limitFor(canvas.height), limitFor(canvas.height)),
  };
}
