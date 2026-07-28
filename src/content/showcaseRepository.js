import robotaxi from "../../content/products/robotaxi.json" with { type: "json" };
import framework from "../../content/business-observations/enterprise-operating-framework.json" with { type: "json" };

export const products = [robotaxi];
export const businessObservations = [framework];

export function latestProduct() {
  return products[0];
}

export function latestBusinessObservation() {
  return businessObservations[0];
}

export function findBusinessObservation(id) {
  return businessObservations.find((item) => item.id === id);
}
