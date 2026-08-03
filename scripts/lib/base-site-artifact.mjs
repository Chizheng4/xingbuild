import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const sha256Pattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{7,64}$/;

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function canonical(value) {
  return JSON.stringify(value);
}

export function hashArtifactValue(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

export function validateBaseSiteArtifact(artifact) {
  if (!artifact || typeof artifact !== "object") throw new Error("immutable baseSiteArtifact is required");
  for (const field of ["baseSiteArtifactId", "productVersion", "productCommit", "releaseManifestHash", "artifactContentHash", "sourceDeploymentId"]) {
    if (!hasText(artifact[field])) throw new Error(`baseSiteArtifact.${field} is required`);
  }
  if (!commitPattern.test(artifact.productCommit)) throw new Error("baseSiteArtifact.productCommit is invalid");
  if (!sha256Pattern.test(artifact.releaseManifestHash)) throw new Error("baseSiteArtifact.releaseManifestHash must be SHA-256");
  if (!sha256Pattern.test(artifact.artifactContentHash)) throw new Error("baseSiteArtifact.artifactContentHash must be SHA-256");
  if (artifact.rootDirectory !== undefined && (!hasText(artifact.rootDirectory) || path.isAbsolute(artifact.rootDirectory) === false)) {
    throw new Error("baseSiteArtifact.rootDirectory must be an absolute directory when provided");
  }
  return artifact;
}

export async function readBaseSiteArtifact({ sourceRoot, baseSiteArtifact, artifactPath } = {}) {
  let selected = baseSiteArtifact;
  if (typeof selected === "string") selected = JSON.parse(await readFile(path.resolve(sourceRoot, selected), "utf8"));
  if (!selected && artifactPath) {
    const resolved = path.resolve(sourceRoot, artifactPath);
    const rootDirectory = path.resolve(sourceRoot);
    if (resolved !== rootDirectory && !resolved.startsWith(`${rootDirectory}${path.sep}`)) throw new Error("baseSiteArtifact path must stay inside source root");
    selected = JSON.parse(await readFile(resolved, "utf8"));
  }
  if (selected) return validateBaseSiteArtifact(selected);

  const releasePath = path.join(sourceRoot, "dist", "client", "release.json");
  const manifestPath = path.join(sourceRoot, "dist", "client", "content-manifest.json");
  try { await access(releasePath); } catch { throw new Error("immutable baseSiteArtifact is required; prepared dist/client/release.json is missing"); }
  const release = JSON.parse(await readFile(releasePath, "utf8"));
  const contentManifest = await access(manifestPath).then(() => readFile(manifestPath, "utf8")).catch(() => "{}");
  const releaseManifestHash = hashArtifactValue({ release, contentManifest: JSON.parse(contentManifest) });
  const artifactContentHash = hashArtifactValue({ release, contentManifest: JSON.parse(contentManifest), sourceRoot: "prepared-dist" });
  return validateBaseSiteArtifact({
    baseSiteArtifactId: `${release.version}-${release.commit.slice(0, 12)}`,
    productVersion: release.version,
    productCommit: release.commit,
    releaseManifestHash,
    artifactContentHash,
    sourceDeploymentId: "prepared-dist",
  });
}
