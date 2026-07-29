export function isPublicPracticeMedia(manifest, asset) {
  return manifest.reviewStatus === "approved"
    && manifest.publicStatus === "public"
    && manifest.currentPublication?.status === "active"
    && asset.reviewStatus === "approved"
    && asset.provenance?.approvalStatus === "approved"
    && asset.publicStatus === "public"
    && typeof asset.src === "string"
    && asset.src.trim() !== "";
}
