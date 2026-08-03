import enterpriseOperatingSystem from "../../.content-workspace/content/articles/enterprise-operating-system.json" with { type: "json" };

export const evergreenArticles = [enterpriseOperatingSystem];

export function findEvergreenArticle(slug) {
  return evergreenArticles.find((article) => article.slug === slug && article.status === "published");
}
