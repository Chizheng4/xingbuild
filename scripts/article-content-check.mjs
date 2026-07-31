#!/usr/bin/env node
import { readPublishedArticles, validateEvergreenArticle } from "./lib/evergreen-article.mjs";

const articles = await readPublishedArticles();
if (!articles.length) throw new Error("No published evergreen articles found");
const errors = (await Promise.all(articles.map((article) => validateEvergreenArticle(article)))).flat();
if (errors.length) throw new Error(errors.map((error) => `- ${error}`).join("\n"));
console.log(`Evergreen article check passed: ${articles.length} published article(s)`);
