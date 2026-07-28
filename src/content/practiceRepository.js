import robotaxiPractice from "../../content/products/robotaxi.json" with { type: "json" };
import robotaxiMediaManifest from "../../content/media/robotaxi/manifest.json" with { type: "json" };

function resolvePractice(practice, manifest) {
  const mediaById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  return {
    ...practice,
    modules: practice.modules.map(({ mediaId, ...module }) => ({
      ...module,
      media: mediaById.get(mediaId),
    })),
  };
}

export const practices = [resolvePractice(robotaxiPractice, robotaxiMediaManifest)];

export function findPractice(id) {
  return practices.find((item) => item.id === id);
}
