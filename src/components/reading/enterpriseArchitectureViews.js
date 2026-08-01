import { architectureById } from "../../content/frameworkModel.js";

const viewDefinitions = Object.freeze({
  landscape: Object.freeze({
    title: "企业经营体系总览",
    architectureId: "enterprise-operation",
  }),
  business: Object.freeze({
    title: "企业业务架构",
    architectureId: "business-design",
  }),
  digital: Object.freeze({
    title: "数字化实现",
    architectureId: "digital-implementation",
  }),
  product: Object.freeze({
    title: "B 端产品架构",
    architectureId: "digital-implementation",
    nodeIds: Object.freeze([
      "enterprise-business-architecture",
      "b2b-product-architecture",
      "data-architecture",
      "technical-architecture",
      "engineering",
      "enterprise-digital-system",
    ]),
  }),
});

export const enterpriseArchitectureViewIds = Object.freeze(Object.keys(viewDefinitions));

export function isEnterpriseArchitectureViewId(value) {
  return enterpriseArchitectureViewIds.includes(value);
}

export function enterpriseArchitectureView(viewId) {
  const definition = viewDefinitions[viewId];
  if (!definition) return null;
  const architecture = architectureById.get(definition.architectureId);
  if (!architecture) return null;
  const nodeIds = definition.nodeIds ?? architecture.nodes.map((node) => node.id);
  const nodes = architecture.nodes.filter((node) => nodeIds.includes(node.id));
  const edges = architecture.edges.filter((edge) => nodeIds.includes(edge.from) && nodeIds.includes(edge.to));
  return { ...definition, id: viewId, nodes, edges };
}
