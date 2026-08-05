const APPROVED_ROBOTAXI_MEDIA_ID = "robotaxi-evidence-fleet-operations-console-v1";

export function projectRobotaxiVisualQaFixture(practice, manifest) {
  if (practice?.id !== "robotaxi" || !manifest?.assets?.length) return practice;
  const approvedMedia = manifest.assets.find((asset) => asset.id === APPROVED_ROBOTAXI_MEDIA_ID);
  if (!approvedMedia) return practice;
  return {
    ...practice,
    modules: (practice.modules || []).map((module) => ({
      ...module,
      mediaId: approvedMedia.id,
      media: approvedMedia,
    })),
  };
}

export { APPROVED_ROBOTAXI_MEDIA_ID };
