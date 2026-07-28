function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

export function validateBriefDefinition(observation) {
  if (observation.brief === undefined) return [];
  const errors = [];
  const brief = observation.brief;
  if (!brief || typeof brief !== "object" || Array.isArray(brief)) return ["brief must be an object"];

  const allowed = new Set(["subject", "statement", "isOpinion", "articleHref"]);
  for (const key of Object.keys(brief)) if (!allowed.has(key)) errors.push(`brief.${key} is not allowed`);
  for (const field of ["subject", "statement"]) {
    if (!hasText(brief[field])) errors.push(`brief.${field} must be a non-empty string`);
  }
  if (typeof brief.isOpinion !== "boolean") errors.push("brief.isOpinion must be boolean");
  if (brief.articleHref !== undefined && brief.articleHref !== `/observations/${observation.slug}`) {
    errors.push("brief.articleHref must be this observation's site-relative detail path");
  }
  return errors;
}

export function projectObservationBrief(observation) {
  if (observation.status !== "published" || !observation.brief) return null;
  return {
    id: `brief-${observation.slug}`,
    publishedAt: observation.publishedAt,
    subject: observation.brief.subject,
    primaryDimension: observation.primaryDimension,
    statement: observation.brief.statement,
    isOpinion: observation.brief.isOpinion,
    articleHref: observation.brief.articleHref,
    relatedWorks: observation.relatedWorks,
  };
}
