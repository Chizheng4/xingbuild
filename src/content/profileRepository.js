const contentBuildEnabled = typeof __XINGBUILD_CONTENT_BUILD__ !== "undefined" && __XINGBUILD_CONTENT_BUILD__;
const profileModules = contentBuildEnabled
  ? import.meta.glob("../../.content-workspace/content/profile/*.json", { eager: true, import: "default" })
  : {};

export const profile = Object.values(profileModules).find((item) => item?.id === "about") || null;
