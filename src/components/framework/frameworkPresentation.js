export const FRAMEWORK_LAYOUT_TARGETS = ["enterprise-operation", "digital-implementation"];

export const frameworkPresentation = {
  desktop: {
    direction: "RIGHT",
    padding: 28,
    spacing: 24,
    layerSpacing: 18,
    nodeWidth: 118,
    nodeHeight: 78,
    maxWidth: 2600,
    maxHeight: 1800,
  },
  compact: {
    direction: "RIGHT",
    padding: 18,
    spacing: 16,
    layerSpacing: 12,
    nodeWidth: 72,
    nodeHeight: 52,
    maxWidth: 2600,
    maxHeight: 1800,
  },
  mobile: {
    direction: "DOWN",
    padding: 18,
    spacing: 16,
    layerSpacing: 8,
    nodeWidth: 180,
    nodeHeight: 56,
    maxWidth: 2600,
    maxHeight: 2200,
    viewportWidth: 356,
    maxRenderedHeight: 760,
  },
};

export const frameworkRouting = {
  "enterprise-operation": {
    feedbackEdgeIds: ["op-decision-design", "op-decision-operation"],
  },
  "digital-implementation": {
    feedbackEdgeIds: ["di-data-product", "di-decision-business"],
  },
};

export function presentationFor(projection) {
  const presentation = frameworkPresentation[projection];
  if (!presentation) throw new Error(`Unknown framework projection: ${projection}`);
  return presentation;
}
