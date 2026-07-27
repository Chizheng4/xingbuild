export function observationScopeLabel(observation) {
  const namedScope = [...observation.companies, ...observation.regions];
  return namedScope.length ? namedScope.slice(0, 2).join(" · ") : null;
}

export function observationDimensionMetadata(observation) {
  const scopeLabel = observationScopeLabel(observation);
  return scopeLabel
    ? [scopeLabel, observation.primaryDimension]
    : [observation.primaryDimension];
}

export function selectHomeObservations(items) {
  const eligible = items
    .filter((item) => item.status === "published" && item.promoteToHome)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const selected = [];
  let briefCount = 0;

  for (const item of eligible) {
    if (selected.length >= 4) break;
    if (item.level === "brief" && briefCount >= 2) continue;
    selected.push(item);
    if (item.level === "brief") briefCount += 1;
  }

  const hasSubstantive = eligible.some((item) => item.level !== "brief");
  const selectedHasSubstantive = selected.some((item) => item.level !== "brief");
  if (hasSubstantive && !selectedHasSubstantive) {
    const substantive = eligible.find((item) => item.level !== "brief");
    const replaceAt = selected.findLastIndex((item) => item.level === "brief");
    if (replaceAt >= 0) selected.splice(replaceAt, 1, substantive);
    else if (selected.length < 4) selected.push(substantive);
  }

  return selected
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4);
}

export function selectObservationBriefs(items) {
  return items
    .filter((item) => validateObservationBrief(item).length === 0)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}
import { validateObservationBrief } from "./observationBriefs.js";
