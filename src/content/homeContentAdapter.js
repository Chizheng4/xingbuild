import { homeContent as fallbackHomeContent } from "./siteContent.js";

const contentBuildEnabled = typeof __XINGBUILD_CONTENT_BUILD__ !== "undefined" && __XINGBUILD_CONTENT_BUILD__;
const homeModules = contentBuildEnabled
  ? import.meta.glob("../../.content-workspace/content/home.json", { eager: true, import: "default" })
  : {};

function validHomeContent(value) {
  const empty = value?.emptyStates?.observations;
  return typeof value?.description === "string"
    && typeof value?.homeTitle === "string"
    && typeof empty?.message === "string"
    && typeof empty?.description === "string";
}

const activeHomeContent = Object.values(homeModules).find(validHomeContent) || null;

/**
 * Product-only builds use the frozen legacy copy as a safe fallback. A
 * content-enabled SiteSnapshot replaces it with the active ContentSet home
 * entry copied into the staging workspace.
 */
export function resolveHomeContent() {
  return activeHomeContent || fallbackHomeContent;
}

export const home = resolveHomeContent();
