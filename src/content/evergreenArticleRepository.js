const contentBuildEnabled = typeof __XINGBUILD_CONTENT_BUILD__ !== "undefined" && __XINGBUILD_CONTENT_BUILD__;
const articleModules = contentBuildEnabled
  ? import.meta.glob("../../.content-workspace/content/articles/*.json", { eager: true, import: "default" })
  : {};

export const evergreenArticles = Object.values(articleModules);

export function findEvergreenArticle(slug) {
  return evergreenArticles.find((article) => article.slug === slug && article.status === "published");
}
