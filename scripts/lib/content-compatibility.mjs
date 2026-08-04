/**
 * Product/content compatibility is a product contract, not an operational
 * guess.  The coordinator reads the explicit declaration from current.md
 * before assembling a site publication.
 */
export function readContentImpact(currentText = "") {
  const value = currentText.match(/^contentImpact:\s*([^\n#]+)/m)?.[1]?.trim() || null;
  const affectedTargets = currentText.match(/^affectedTargets:\s*(.*)$/m)?.[1]?.trim() || "[]";
  const affectedRoutes = currentText.match(/^affectedRoutes:\s*(.*)$/m)?.[1]?.trim() || "[]";
  const affectedFields = currentText.match(/^affectedFields:\s*(.*)$/m)?.[1]?.trim() || "[]";
  const compatibilityEvidence = currentText.match(/^compatibilityEvidence:\s*([^\n#]+)/m)?.[1]?.trim() || null;
  return { contentImpact: value, affectedTargets, affectedRoutes, affectedFields, compatibilityEvidence };
}

export function assertProductContentCompatibility({ currentText = "", activeContentReleaseIds = [] } = {}) {
  const impact = readContentImpact(currentText);
  if (!impact.contentImpact || !impact.compatibilityEvidence) {
    throw new Error("Product Incident: current.md must declare contentImpact and compatibilityEvidence before site publication");
  }
  if (!["compatible", "none"].includes(impact.contentImpact)) {
    const incident = new Error(`Product Incident: content compatibility is ${impact.contentImpact}`);
    incident.code = "PRODUCT_CONTENT_INCOMPATIBLE";
    incident.affectedContentReleaseIds = activeContentReleaseIds;
    throw incident;
  }
  return { ...impact, activeContentReleaseIds };
}
