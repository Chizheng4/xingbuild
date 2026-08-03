const contentBuildEnabled = typeof __XINGBUILD_CONTENT_BUILD__ !== "undefined" && __XINGBUILD_CONTENT_BUILD__;
const productModules = contentBuildEnabled
  ? import.meta.glob("../../.content-workspace/content/products/*.json", { eager: true, import: "default" })
  : {};
const businessObservationModules = contentBuildEnabled
  ? import.meta.glob("../../.content-workspace/content/business-observations/*.json", { eager: true, import: "default" })
  : {};

export const products = Object.values(productModules);
export const businessObservations = Object.values(businessObservationModules);

export function latestProduct() {
  return products[0];
}

export function latestBusinessObservation() {
  return businessObservations[0];
}

export function findBusinessObservation(id) {
  return businessObservations.find((item) => item.id === id);
}
