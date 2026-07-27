// Reading projections are intentionally independent from ObservationPublication.
// A publication becomes a brief only after an editor supplies this explicit,
// independently verifiable event summary. Existing analysis publications are not
// inferred, shortened, or included here.
export const observationBriefs = [];

export function validateObservationBrief(item) {
  const errors = [];
  for (const field of ["id", "publishedAt", "subject", "primaryDimension", "statement"]) {
    if (!item?.[field] || typeof item[field] !== "string") errors.push(`missing ${field}`);
  }
  if (item && typeof item.isOpinion !== "boolean") errors.push("isOpinion must be boolean");
  if (item?.articleHref !== undefined && (!item.articleHref.startsWith("/") || item.articleHref.startsWith("//"))) {
    errors.push("articleHref must be a site-relative path");
  }
  return errors;
}
