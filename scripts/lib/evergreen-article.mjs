import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { diagramFigureAssets } from "../../src/content/diagramFigureAssets.js";

export const articleSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const articleDirectory = path.join(root, "content/articles");
const publicDirectory = path.join(root, "public");

export async function readPublishedArticles() {
  const files = (await readdir(articleDirectory)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(articleDirectory, file), "utf8"))));
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export async function validateEvergreenArticle(article, { expectedSlug } = {}) {
  const errors = [];
  if (!articleSlugPattern.test(article?.slug || "")) errors.push("article slug must be a valid single slug");
  if (expectedSlug && article.slug !== expectedSlug) errors.push(`article slug must be ${expectedSlug}`);
  for (const field of ["id", "title", "summary", "updatedAt"]) if (!article?.[field]) errors.push(`article ${field} is required`);
  if (article?.status !== "published") errors.push("article status must be published");
  if (!Array.isArray(article?.blocks) || !article.blocks.length) errors.push("article requires blocks");
  const headingIds = article?.blocks?.filter((block) => block.type === "heading" && [2, 3].includes(block.level)).map((block) => block.id) ?? [];
  if (!headingIds.length || headingIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))) errors.push("H2/H3 headings need stable anchor ids");
  if (new Set(headingIds).size !== headingIds.length) errors.push("article heading anchors must be unique");
  if (!Array.isArray(article?.sources) || !article.sources.length) errors.push("article requires reader-facing sources");
  const manifestPath = path.join(publicDirectory, "figures/diagram-manifest.json");
  const generatedManifest = await exists(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : { figures: {} };
  for (const figure of article?.blocks?.filter((block) => block.type === "figure") ?? []) {
    if (!figure.alt || !figure.caption || !figure.sourcePath || !figure.renderer || !figure.layoutPreset || figure.src || figure.mobileSrc) {
      errors.push("figure requires one sourcePath, renderer, layoutPreset, alt and caption only");
      continue;
    }
    if (!/\.(?:mmd|c4)$/.test(figure.sourcePath)) errors.push(`figure sourcePath has unsupported source: ${figure.sourcePath}`);
    const source = path.join(root, figure.sourcePath);
    if (!(await exists(source))) errors.push(`figure source is missing: ${figure.sourcePath}`);
    const assets = diagramFigureAssets(figure.sourcePath);
    if (!assets) { errors.push(`figure source path cannot derive assets: ${figure.sourcePath}`); continue; }
    const sourceHash = await exists(source) ? createHash("sha256").update(await readFile(source)).digest("hex") : "";
    const record = generatedManifest.figures?.[figure.sourcePath];
    if (!record || record.sourceHash !== sourceHash || record.renderer !== figure.renderer || record.layoutPreset !== figure.layoutPreset) {
      errors.push(`generated figure is stale or missing manifest record: ${figure.sourcePath}`);
    }
    for (const src of [assets.desktop, assets.mobile]) {
      const target = path.join(publicDirectory, src);
      if (!(await exists(target))) { errors.push(`generated figure is missing: ${src}`); continue; }
      const svg = await readFile(target, "utf8");
      if (!svg.includes("<svg") || /<(?:script|foreignObject|iframe|object|embed)\b/i.test(svg) || /(?:href|xlink:href)=["'](?:https?:|data:|javascript:)/i.test(svg)) {
        errors.push(`generated figure is unsafe or invalid: ${src}`);
      }
    }
  }
  return errors;
}
