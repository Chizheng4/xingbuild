import robotaxiPractice from "../../.content-workspace/content/products/robotaxi.json" with { type: "json" };
import robotaxiMediaManifest from "../../.content-workspace/content/media/robotaxi/manifest.json" with { type: "json" };
import { isPublicPracticeMedia } from "./practiceMediaLifecycle.js";

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

export const practices = [projectPractice(robotaxiPractice, robotaxiMediaManifest)];

export function findPractice(id) {
  return practices.find((item) => item.id === id);
}
