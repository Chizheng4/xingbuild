import {
  observationScopeLabel,
  selectHomeObservations as selectHome,
} from "./observationQueries";

const modules = import.meta.glob("../../content/observations/*.json", {
  eager: true,
  import: "default",
});

export const observations = Object.values(modules)
  .filter((item) => item.status === "published")
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const publishedObservations = observations;

export function findObservation(slug) {
  return observations.find((item) => item.slug === slug);
}

export { observationScopeLabel };

export function selectHomeObservations(items = observations) {
  return selectHome(items);
}
