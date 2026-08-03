import { slugPattern } from "./observation-content.mjs";

export function evaluateContentCommitReadiness({
  slug,
  files,
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

  if (!normalized.includes(contentFile)) errors.push(`content package must contain ${contentFile}`);
  if (rejected.length) errors.push(`content package contains forbidden files: ${rejected.join(", ")}`);
  if (allowedMedia.some((file) => file !== mediaManifest) && !normalized.includes(mediaManifest)) {
    errors.push(`approved media files require ${mediaManifest}`);
  }
  return {
    ready: errors.length === 0,
    errors,
    contentFile,
    mediaManifest: normalized.includes(mediaManifest) ? mediaManifest : undefined,
    phase: "content-prepare",
  };
}
