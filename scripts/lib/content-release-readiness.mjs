import { slugPattern } from "./observation-content.mjs";

export function evaluateContentCommitReadiness({
  slug,
  files,
  currentVersion,
  parentVersion,
  head,
  parent,
  originMain,
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
  const allowed = new Set([contentFile, ...allowedMedia]);
  const rejected = normalized.filter((file) => !allowed.has(file));

  if (!normalized.includes(contentFile)) errors.push(`content commit must contain ${contentFile}`);
  if (rejected.length) errors.push(`content commit contains forbidden files: ${rejected.join(", ")}`);
  if (allowedMedia.some((file) => file !== mediaManifest) && !normalized.includes(mediaManifest)) {
    errors.push(`approved media files require ${mediaManifest}`);
  }
  if (currentVersion !== undefined && currentVersion !== parentVersion) {
    errors.push("content publication must not change product version");
  }
  if (headTags.length) errors.push(`content commit must not create a product tag: ${headTags.join(", ")}`);
  if (originMain !== undefined && originMain !== parent && originMain !== head) {
    errors.push("origin/main must equal HEAD^ before push or HEAD for same-commit deployment retry");
  }

  return {
    ready: errors.length === 0,
    errors,
    contentFile,
    mediaManifest: normalized.includes(mediaManifest) ? mediaManifest : undefined,
    phase: originMain === parent ? "pre-push" : originMain === head ? "post-push-retry" : "blocked",
  };
}
