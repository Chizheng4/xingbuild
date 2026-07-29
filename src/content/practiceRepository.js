import robotaxiPractice from "../../content/products/robotaxi.json" with { type: "json" };
import robotaxiMediaManifest from "../../content/media/robotaxi/manifest.json" with { type: "json" };
import { isPublicPracticeMedia } from "./practiceMediaLifecycle.js";

export function projectPractice(practice, manifest) {
  const mediaById = new Map(manifest.assets
    .filter((asset) => isPublicPracticeMedia(manifest, asset))
    .map((asset) => [asset.id, asset]));
  return {
    ...practice,
    modules: practice.modules
      .filter((module) => mediaById.has(module.mediaId))
      .map(({ mediaId, ...module }) => ({ ...module, media: mediaById.get(mediaId) })),
  };
}

export const practices = [projectPractice(robotaxiPractice, robotaxiMediaManifest)];

export function findPractice(id) {
  return practices.find((item) => item.id === id);
}
