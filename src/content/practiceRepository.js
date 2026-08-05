import { isPublicPracticeMedia } from "./practiceMediaLifecycle.js";
import { projectRobotaxiVisualQaFixture } from "./visualQaFixture.js";

const contentBuildEnabled = typeof __XINGBUILD_CONTENT_BUILD__ !== "undefined" && __XINGBUILD_CONTENT_BUILD__;
const visualQaEnabled = typeof __XINGBUILD_VISUAL_QA__ !== "undefined" && __XINGBUILD_VISUAL_QA__;
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
  const mediaById = new Map((manifest?.assets || [])
    .filter((asset) => isPublicPracticeMedia(manifest, asset))
    .map((asset) => [asset.id, asset]));
  const projected = {
    ...practice,
    modules: practice.modules
      .map((module) => ({
        ...module,
        mediaId: module.mediaId || null,
        media: module.mediaId ? mediaById.get(module.mediaId) : undefined,
      })),
  };
  return visualQaEnabled ? projectRobotaxiVisualQaFixture(projected, manifest) : projected;
}

export const practices = Object.values(practiceModules)
  .filter((practice) => practice && typeof practice.id === "string")
  .map((practice) => projectPractice(practice, mediaManifestByPracticeId.get(practice.id) || { assets: [] }));

export function findPractice(id) {
  return practices.find((item) => item.id === id);
}
