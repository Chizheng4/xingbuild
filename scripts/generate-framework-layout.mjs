#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import ELK from "elkjs/lib/elk.bundled.js";
import { architectures } from "../src/content/frameworkModel.js";
import {
  FRAMEWORK_LAYOUT_TARGETS,
  frameworkPresentation,
  frameworkRouting,
} from "../src/components/framework/frameworkPresentation.js";

const elk = new ELK();
const architectureById = new Map(architectures.map((architecture) => [architecture.id, architecture]));

function graphFor(architecture, projection) {
  const presentation = frameworkPresentation[projection];
  const feedbackEdgeIds = new Set(frameworkRouting[architecture.id]?.feedbackEdgeIds ?? []);
  return {
    id: `${architecture.id}-${projection}`,
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": presentation.direction,
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": `[top=${presentation.padding},left=${presentation.padding},bottom=${presentation.padding},right=${presentation.padding}]`,
      "elk.spacing.nodeNode": String(presentation.spacing),
      "elk.spacing.edgeLabel": "4",
      "elk.layered.spacing.nodeNodeBetweenLayers": String(presentation.layerSpacing),
      "elk.layered.spacing.edgeNodeBetweenLayers": "8",
      "elk.edgeLabels.inline": "true",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.crossingMinimization.forceNodeModelOrder": "false",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",
      "elk.layered.feedbackEdges": "true",
      ...(projection === "desktop" ? {
        "elk.aspectRatio": "1.7",
        "elk.layered.wrapping.strategy": "MULTI_EDGE",
        "elk.layered.wrapping.cutting.strategy": "ARD",
        "elk.layered.wrapping.additionalEdgeSpacing": "16",
      } : {}),
    },
    children: architecture.nodes.map((node, index) => ({
      id: node.id,
      width: presentation.nodeWidth,
      height: presentation.nodeHeight,
      layoutOptions: {
        "elk.layered.priority": String(architecture.nodes.length - index),
      },
    })),
    edges: architecture.edges.filter((edge) => !feedbackEdgeIds.has(edge.id)).map((edge) => ({
      id: edge.id,
      sources: [edge.from],
      targets: [edge.to],
    })),
  };
}

function routedFeedbackEdge(edge, nodeMap, lane) {
  const source = nodeMap.get(edge.from);
  const target = nodeMap.get(edge.to);
  if (!source || !target) throw new Error(`Missing feedback endpoint: ${edge.id}`);
  const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  const laneX = Math.max(6, Math.min(source.x, target.x) - 14 - lane * 12);
  const sameLayer = Math.abs(sourceCenter.y - targetCenter.y) < Math.max(source.height, target.height);
  const points = sameLayer
    ? [
        { x: source.x, y: sourceCenter.y },
        { x: laneX, y: sourceCenter.y },
        { x: laneX, y: targetCenter.y },
        { x: target.x + target.width, y: targetCenter.y },
      ]
    : [
        { x: sourceCenter.x, y: source.y },
        { x: sourceCenter.x, y: source.y - 12 - lane * 8 },
        { x: laneX, y: source.y - 12 - lane * 8 },
        { x: laneX, y: target.y + target.height + 12 + lane * 8 },
        { x: targetCenter.x, y: target.y + target.height + 12 + lane * 8 },
        { x: targetCenter.x, y: target.y + target.height },
      ];
  return {
    source: edge.from,
    target: edge.to,
    points: points.map(({ x, y }) => ({ x: rounded(x), y: rounded(y) })),
    label: null,
  };
}

function rounded(value) {
  return Math.round(Number(value) * 100) / 100;
}

function edgePoints(edge) {
  const section = edge.sections?.[0];
  if (!section) throw new Error(`ELK did not route edge ${edge.id}`);
  return [
    section.startPoint,
    ...(section.bendPoints ?? []),
    section.endPoint,
  ].map(({ x, y }) => ({ x: rounded(x), y: rounded(y) }));
}

function overlaps(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function placeRelationshipLabels(architecture, generatedEdges, nodeMap, width, height) {
  const placed = [];
  for (const edge of architecture.edges) {
    const source = nodeMap.get(edge.from);
    const target = nodeMap.get(edge.to);
    const labelWidth = Math.max(32, edge.label.length * 10 + 8);
    const labelHeight = 14;
    const centerX = (source.x + source.width / 2 + target.x + target.width / 2) / 2;
    const centerY = (source.y + source.height / 2 + target.y + target.height / 2) / 2;
    const candidates = [
      { x: centerX, y: Math.min(source.y, target.y) - 10 },
      { x: centerX, y: Math.max(source.y + source.height, target.y + target.height) + 10 },
      { x: Math.max(source.x + source.width, target.x + target.width) + labelWidth / 2 + 8, y: centerY },
      { x: Math.min(source.x, target.x) - labelWidth / 2 - 8, y: centerY },
    ];
    const chosen = candidates.find((candidate) => {
      const box = {
        x: candidate.x - labelWidth / 2,
        y: candidate.y - labelHeight / 2,
        width: labelWidth,
        height: labelHeight,
      };
      return box.x >= 0
        && box.y >= 0
        && box.x + box.width <= width
        && box.y + box.height <= height
        && [...nodeMap.values()].every((node) => !overlaps(box, node))
        && placed.every((label) => !overlaps(box, label));
    });
    if (!chosen) throw new Error(`No collision-free relationship label position: ${edge.id}`);
    const box = {
      x: chosen.x - labelWidth / 2,
      y: chosen.y - labelHeight / 2,
      width: labelWidth,
      height: labelHeight,
    };
    placed.push(box);
    generatedEdges[edge.id].label = { x: rounded(chosen.x), y: rounded(chosen.y) };
  }
}

function normalizeLayout(architecture, projection, layout) {
  const presentation = frameworkPresentation[projection];
  const width = rounded(layout.width);
  const height = rounded(layout.height);
  if (width > presentation.maxWidth) throw new Error(`${architecture.id}/${projection} width ${width} exceeds ${presentation.maxWidth}`);
  if (height > presentation.maxHeight) throw new Error(`${architecture.id}/${projection} height ${height} exceeds ${presentation.maxHeight}`);
  const nodeMap = new Map(layout.children.map((node) => [node.id, node]));
  const generatedEdges = Object.fromEntries(layout.edges.map((edge) => {
    const points = edgePoints(edge);
    const source = nodeMap.get(edge.sources[0]);
    const target = nodeMap.get(edge.targets[0]);
    return [
      edge.id,
      {
        source: edge.sources[0],
        target: edge.targets[0],
        points,
        label: null,
      },
    ];
  }));
  for (const [lane, edgeId] of (frameworkRouting[architecture.id]?.feedbackEdgeIds ?? []).entries()) {
    const edge = architecture.edges.find((item) => item.id === edgeId);
    generatedEdges[edgeId] = routedFeedbackEdge(edge, nodeMap, lane);
  }
  if (projection === "desktop") placeRelationshipLabels(architecture, generatedEdges, nodeMap, width, height);
  return {
    width,
    height,
    nodes: Object.fromEntries(layout.children.map((node) => [
      node.id,
      {
        x: rounded(node.x),
        y: rounded(node.y),
        width: rounded(node.width),
        height: rounded(node.height),
      },
    ])),
    edges: generatedEdges,
  };
}

export async function generateFrameworkLayouts() {
  const generated = {};
  for (const architectureId of FRAMEWORK_LAYOUT_TARGETS) {
    const architecture = architectureById.get(architectureId);
    if (!architecture) throw new Error(`Missing architecture: ${architectureId}`);
    generated[architectureId] = {};
    for (const projection of ["desktop", "mobile"]) {
      const layout = await elk.layout(graphFor(architecture, projection));
      generated[architectureId][projection] = normalizeLayout(architecture, projection, layout);
    }
  }
  return generated;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = new URL("../src/generated/frameworkLayouts.js", import.meta.url);
  await mkdir(new URL("../src/generated/", import.meta.url), { recursive: true });
  const layouts = await generateFrameworkLayouts();
  await writeFile(output, `// Generated by scripts/generate-framework-layout.mjs. Do not edit.\nexport const frameworkLayouts = ${JSON.stringify(layouts, null, 2)};\n`);
  console.log(`Generated deterministic framework layouts: ${FRAMEWORK_LAYOUT_TARGETS.join(", ")}`);
}
