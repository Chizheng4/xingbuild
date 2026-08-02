import { slugPattern } from "./observation-content.mjs";
import { evaluateUnifiedReleaseReadiness, unifiedReleaseRecordFiles } from "./unified-release.mjs";

export function evaluateContentCommitReadiness({
  slug,
  files,
  currentVersion,
  parentVersion,
  head,
  parent,
  originMain,
  originMainIsAncestor = false,
  headTags = [],
}) {
  const errors = [];
  if (!slugPattern.test(slug || "")) errors.push("content release requires a valid explicit slug");

  const normalized = files.filter(Boolean).map((file) => file.replaceAll("\\", "/"));
  const contentFile = `content/observations/${slug}.json`;
  const mediaManifest = `content/media/${slug}/manifest.json`;
  const allowedMedia = normalized.filter((file) =>
    file === mediaManifest ||
    file.startsWith(`public/media/${slug}/`)
  );
  const releaseFiles = currentVersion ? [...unifiedReleaseRecordFiles(currentVersion)] : [];
  const allowed = new Set([contentFile, ...allowedMedia, ...releaseFiles]);
  const rejected = normalized.filter((file) => !allowed.has(file));

  if (!normalized.includes(contentFile)) errors.push(`content commit must contain ${contentFile}`);
  if (rejected.length) errors.push(`content commit contains forbidden files: ${rejected.join(", ")}`);
  if (allowedMedia.some((file) => file !== mediaManifest) && !normalized.includes(mediaManifest)) {
    errors.push(`approved media files require ${mediaManifest}`);
  }
  const unified = currentVersion === undefined || parentVersion === undefined
    ? { errors: [] }
    : evaluateUnifiedReleaseReadiness({
      files: normalized,
      targetFile: contentFile,
      currentVersion,
      parentVersion,
      head,
      parent,
      originMain,
      originMainIsAncestor,
      headTags,
      kind: "content",
      extraAllowedFiles: [...allowedMedia],
    });
  errors.push(...(unified.errors || []).filter((error) => !errors.includes(error)));

  return {
    ready: errors.length === 0,
    errors,
    contentFile,
    mediaManifest: normalized.includes(mediaManifest) ? mediaManifest : undefined,
    phase: unified.phase || (originMain === parent ? "pre-push" : originMain === head ? "post-push-retry" : "blocked"),
  };
}
