const sourceRoot = "src/architecture/";

export function diagramFigureAssets(sourcePath) {
  if (typeof sourcePath !== "string" || !sourcePath.startsWith(sourceRoot)) return null;
  const relative = sourcePath.slice(sourceRoot.length).replace(/\.(?:mmd|c4)$/, "");
  if (!relative || relative.includes("..")) return null;
  return {
    desktop: `/figures/${relative}.svg`,
    mobile: `/figures/${relative}-mobile.svg`,
  };
}
