import {
  observationScopeLabel,
  selectObservationBriefs as selectBriefs,
  selectHomeObservations as selectHome,
} from "./observationQueries.js";
import { projectObservationBrief } from "./briefProjection.js";

const modules = import.meta.glob("../../.content-workspace/content/observations/*.json", {
  eager: true,
  import: "default",
});

export const observations = Object.values(modules)
  .filter((item) => item.status === "published")
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const publishedObservations = observations;
export const observationBriefs = observations
  .map(projectObservationBrief)
  .filter(Boolean);

export function findObservation(slug) {
  return observations.find((item) => item.slug === slug);
}

export { observationScopeLabel };

export function selectHomeObservations(items = observations) {
  return selectHome(items);
}

export function selectObservationBriefs({ scope } = {}) {
  return selectBriefs(observationBriefs, { scope });
}
