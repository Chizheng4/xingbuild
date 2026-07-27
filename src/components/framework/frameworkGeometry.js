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

function lastPoint(path) {
  const segments = pathSegments(path);
  return segments.at(-1)?.to ?? null;
}

function nodeBounds(node, architecture) {
  const position = node.projection.desktop;
  const [, , width, height] = architecture.viewBox.desktop.split(" ").map(Number);
  return {
    left: (position.x / 100) * width,
    top: position.y,
    right: ((position.x + position.width) / 100) * width,
    bottom: position.y + Math.min(76, Math.max(48, height * 0.12)),
  };
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

export function isLabelSafe(architecture, edge) {
  const { x, y } = edge.projection.desktop.label;
  const width = Math.max(28, edge.label.length * 10);
  const label = { left: x - width / 2, right: x + width / 2, top: y - 11, bottom: y + 4 };
  return architecture.nodes.every((node) => {
    const bounds = nodeBounds(node, architecture);
    return label.right < bounds.left || label.left > bounds.right || label.bottom < bounds.top || label.top > bounds.bottom;
  });
}

export function validateGraphGeometry(architecture) {
  const errors = [];
  const nodeMap = new Map(architecture.nodes.map((node) => [node.id, node]));
  for (const edge of architecture.edges) {
    const target = nodeMap.get(edge.to);
    const endpoint = lastPoint(edge.projection.desktop.path);
    if (!endpoint || !target || !inside(endpoint, nodeBounds(target, architecture))) {
      errors.push(`edge endpoint misses target: ${edge.id}`);
    }
    for (const node of architecture.nodes) {
      if (node.id === edge.from || node.id === edge.to) continue;
      if (pathSegments(edge.projection.desktop.path).some((segment) => crossesInterior(segment, nodeBounds(node, architecture)))) {
        errors.push(`edge crosses unrelated node: ${edge.id}/${node.id}`);
      }
    }
  }
  return errors;
}

export function clampGraphPan(transform, canvas) {
  const clamp = (value, limit) => Math.min(limit, Math.max(-limit, value));
  const limitFor = (size) => Math.min(72, Math.max(24, Math.round(size * 0.08)));
  return {
    x: clamp(transform.x, limitFor(canvas.width)),
    y: clamp(transform.y, limitFor(canvas.height)),
  };
}
