import { isPublicPracticeMedia } from "./practiceMediaLifecycle.js";

const contentBuildEnabled = typeof __XINGBUILD_CONTENT_BUILD__ !== "undefined" && __XINGBUILD_CONTENT_BUILD__;
const practiceModules = contentBuildEnabled
  ? import.meta.glob("../../.content-workspace/content/products/*.json", { eager: true, import: "default" })
  : {};
const mediaManifestModules = contentBuildEnabled
  ? import.meta.glob("../../.content-workspace/content/media/*/manifest.json", { eager: true, import: "default" })
  : {};

export function practiceIdForMediaManifest(manifest) {
  const match = /^\/media\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(manifest?.directory || "");
  return match?.[1];
}

const mediaManifestByPracticeId = new Map(
  Object.values(mediaManifestModules)
    .map((manifest) => [practiceIdForMediaManifest(manifest), manifest])
    .filter(([practiceId]) => practiceId),
);

export function projectPractice(practice, manifest) {
  const mediaById = new Map(manifest.assets
    .filter((asset) => isPublicPracticeMedia(manifest, asset))
    .map((asset) => [asset.id, asset]));
  return {
    ...practice,
    modules: practice.modules
      .map(({ mediaId, ...module }) => ({ ...module, media: mediaId ? mediaById.get(mediaId) : undefined })),
  };
}

export const practices = Object.values(practiceModules)
  .filter((practice) => practice && typeof practice.id === "string")
  .map((practice) => projectPractice(practice, mediaManifestByPracticeId.get(practice.id) || { assets: [] }));

export function findPractice(id) {
  return practices.find((item) => item.id === id);
}
