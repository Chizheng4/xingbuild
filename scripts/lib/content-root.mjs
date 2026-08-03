import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const contentRootRelative = path.join(".content-workspace", "content");

export function contentRootDirectory({ sourceRoot = projectRoot } = {}) {
  return process.env.XINGBUILD_CONTENT_ROOT
    ? path.join(path.resolve(process.env.XINGBUILD_CONTENT_ROOT), "content")
    : path.join(sourceRoot, contentRootRelative);
}

export function contentRelativePath(kind, target) {
  if (kind === "content") return path.posix.join("observations", `${target}.json`);
  if (kind === "article") return path.posix.join("articles", `${target}.json`);
  if (kind === "profile") return path.posix.join("profile", `${target}.json`);
  if (kind === "businessObservation") return path.posix.join("business-observations", `${target}.json`);
  return path.posix.join("products", `${target}.json`);
}

export function contentFilePath(kind, target, { sourceRoot = projectRoot } = {}) {
  return path.join(contentRootDirectory({ sourceRoot }), contentRelativePath(kind, target));
}

export function contentMediaManifestPath(practiceId, { sourceRoot = projectRoot } = {}) {
  return path.join(contentRootDirectory({ sourceRoot }), "media", practiceId, "manifest.json");
}

export function logicalContentPath(relativePath) {
  return path.posix.join("content", relativePath.split(path.sep).join("/"));
}
