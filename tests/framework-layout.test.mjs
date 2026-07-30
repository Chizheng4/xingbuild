import assert from "node:assert/strict";
import test from "node:test";
import { architectureById } from "../src/content/frameworkModel.js";
import { frameworkLayouts } from "../src/generated/frameworkLayouts.js";
import { generateFrameworkLayouts } from "../scripts/generate-framework-layout.mjs";
import { FRAMEWORK_LAYOUT_TARGETS, frameworkPresentation } from "../src/components/framework/frameworkPresentation.js";

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function pointOnBoundary(point, node) {
  const xBoundary = (Math.abs(point.x - node.x) < 0.01 || Math.abs(point.x - (node.x + node.width)) < 0.01)
    && point.y >= node.y - 0.01 && point.y <= node.y + node.height + 0.01;
  const yBoundary = (Math.abs(point.y - node.y) < 0.01 || Math.abs(point.y - (node.y + node.height)) < 0.01)
    && point.x >= node.x - 0.01 && point.x <= node.x + node.width + 0.01;
  return xBoundary || yBoundary;
}

test("ELK layout generation is byte-stable for the same ordered model", async () => {
  const first = await generateFrameworkLayouts();
  const second = await generateFrameworkLayouts();
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(JSON.stringify(first), JSON.stringify(frameworkLayouts));
});

test("generated layouts preserve every business edge direction and bounded geometry", () => {
  for (const architectureId of FRAMEWORK_LAYOUT_TARGETS) {
    const architecture = architectureById.get(architectureId);
    for (const projection of ["desktop", "mobile"]) {
      const layout = frameworkLayouts[architectureId][projection];
      const nodes = Object.values(layout.nodes);
      for (const [index, node] of nodes.entries()) {
        assert.ok(node.x >= 0 && node.y >= 0);
        assert.ok(node.x + node.width <= layout.width);
        assert.ok(node.y + node.height <= layout.height);
        for (const other of nodes.slice(index + 1)) assert.equal(overlaps(node, other), false);
      }
      for (const edge of architecture.edges) {
        const generated = layout.edges[edge.id];
        assert.equal(generated.source, edge.from);
        assert.equal(generated.target, edge.to);
        assert.ok(generated.points.length >= 2);
        assert.ok(pointOnBoundary(generated.points[0], layout.nodes[edge.from]), `${edge.id} source must terminate on node`);
        assert.ok(pointOnBoundary(generated.points.at(-1), layout.nodes[edge.to]), `${edge.id} target must terminate on node`);
        if (generated.label) {
          assert.ok(generated.label.x >= 0 && generated.label.x <= layout.width);
          assert.ok(generated.label.y >= 0 && generated.label.y <= layout.height);
        }
      }
      assert.ok(layout.width <= frameworkPresentation[projection].maxWidth);
      assert.ok(layout.height <= frameworkPresentation[projection].maxHeight);
    }
  }
  const mobile = frameworkLayouts["digital-implementation"].mobile;
  const renderedHeight = mobile.height * Math.min(1, frameworkPresentation.mobile.viewportWidth / mobile.width);
  assert.ok(renderedHeight >= 620 && renderedHeight <= frameworkPresentation.mobile.maxRenderedHeight);
});

test("desktop relationship labels do not expand ELK bounds and mobile keeps them hidden", async () => {
  const layouts = await generateFrameworkLayouts();
  for (const architectureId of FRAMEWORK_LAYOUT_TARGETS) {
    const architecture = architectureById.get(architectureId);
    const labelBoxes = [];
    for (const edge of architecture.edges) {
      const label = layouts[architectureId].desktop.edges[edge.id].label;
      assert.ok(label);
      assert.equal(layouts[architectureId].mobile.edges[edge.id].label, null);
      const box = {
        x: label.x - Math.max(32, edge.label.length * 10 + 8) / 2,
        y: label.y - 7,
        width: Math.max(32, edge.label.length * 10 + 8),
        height: 14,
      };
      for (const node of Object.values(layouts[architectureId].desktop.nodes)) assert.equal(overlaps(box, node), false);
      for (const placed of labelBoxes) assert.equal(overlaps(box, placed), false);
      labelBoxes.push(box);
    }
  }
  assert.ok(layouts["enterprise-operation"].desktop.width <= 850);
});

test("presentation config carries no duplicated business wording", () => {
  const serialized = JSON.stringify(frameworkPresentation);
  for (const architectureId of FRAMEWORK_LAYOUT_TARGETS) {
    const architecture = architectureById.get(architectureId);
    for (const node of architecture.nodes) {
      assert.equal(serialized.includes(node.name), false);
      assert.equal(serialized.includes(node.definition), false);
      assert.equal(serialized.includes(node.role), false);
    }
    for (const edge of architecture.edges) assert.equal(serialized.includes(edge.label), false);
  }
});
