const RELEASE_VERSION_PATTERN = /^v\d+\.\d+\.\d+$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const ROBOTAXI_HOST = "robotaxi.xingbuild.top";

export const ROBOTAXI_RELEASE_ENDPOINT = "https://robotaxi.xingbuild.top/deployment-manifest.json";

export function projectRobotaxiRelease(payload, { verifiedAt = null, source = "live" } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const version = typeof payload.version === "string" && RELEASE_VERSION_PATTERN.test(payload.version)
    ? payload.version
    : null;
  const commit = typeof payload.commit === "string" && COMMIT_PATTERN.test(payload.commit)
    ? payload.commit
    : null;
  let productionUrl;
  try {
    const parsed = new URL(payload.production_url);
    if (parsed.protocol !== "https:" || parsed.hostname !== ROBOTAXI_HOST || parsed.username || parsed.password) return null;
    productionUrl = parsed.href;
  } catch {
    return null;
  }
  if (!version || !commit || productionUrl !== "https://robotaxi.xingbuild.top/") return null;
  return Object.freeze({
    version,
    commit,
    production_url: productionUrl,
    sourceEndpoint: ROBOTAXI_RELEASE_ENDPOINT,
    source,
    verifiedAt: typeof verifiedAt === "string" ? verifiedAt : null,
  });
}
