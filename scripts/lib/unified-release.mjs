import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const expectedOrigin = "https://github.com/Chizheng4/xingbuild.git";

function parseVersion(value) {
  const match = String(value || "").replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  return match ? match.slice(1).map(Number) : null;
}

export function formatVersion(value) {
  const parsed = parseVersion(value);
  if (!parsed) throw new Error(`invalid semantic version: ${value}`);
  return `v${parsed.join(".")}`;
}

export function incrementPatch(value) {
  const [major, minor, patch] = parseVersion(value) || [];
  if (major === undefined) throw new Error(`invalid semantic version: ${value}`);
  return `v${major}.${minor}.${patch + 1}`;
}

export function isNextPatchVersion(parentVersion, currentVersion) {
  const parent = parseVersion(parentVersion);
  const current = parseVersion(currentVersion);
  return Boolean(
    parent && current
    && current[0] === parent[0]
    && current[1] === parent[1]
    && current[2] === parent[2] + 1,
  );
}

export function parseCurrentVersion(currentText = "") {
  return currentText.match(/## 当前(?:唯一|目标)版本[：:]?\s*(?:\n\s*)?`(v\d+\.\d+\.\d+)`/)?.[1];
}

export function unifiedReleaseRecordFiles(version) {
  const normalized = formatVersion(version);
  return new Set([
    "package.json",
    "package-lock.json",
    "VERSION.md",
    "docs/iterations/current.md",
    `docs/iterations/history/${normalized}.md`,
  ]);
}

export function evaluateUnifiedReleaseReadiness({
  files = [],
  targetFile,
  currentVersion,
  parentVersion,
  head,
  parent,
  originMain,
  originMainIsAncestor = false,
  headTags = [],
  kind = "content",
  extraAllowedFiles = [],
} = {}) {
  const errors = [];
  const current = formatVersion(currentVersion);
  const parentFormatted = formatVersion(parentVersion);
  const normalized = files.filter(Boolean).map((file) => file.replaceAll("\\", "/"));
  const releaseFiles = unifiedReleaseRecordFiles(current);
  const allowed = new Set([...releaseFiles, targetFile, ...extraAllowedFiles].filter(Boolean));

  if (current === parentFormatted) errors.push("unified release must advance the version");
  if (kind !== "product" && !isNextPatchVersion(parentFormatted, current)) {
    errors.push("content release must use the next patch version");
  }
  if (targetFile && !normalized.includes(targetFile)) {
    errors.push(`${kind} release must contain ${targetFile}`);
  }
  const rejected = normalized.filter((file) => !allowed.has(file));
  if (rejected.length) errors.push(`${kind} release contains forbidden files: ${rejected.join(", ")}`);
  if (headTags.some((tag) => tag !== current)) {
    errors.push(`release commit has a tag for a different version: ${headTags.join(", ")}`);
  }
  if (originMain !== undefined && originMain !== parent && originMain !== head && !originMainIsAncestor) {
    errors.push("origin/main must equal HEAD^ before push or HEAD for same-commit deployment retry");
  }

  return {
    ready: errors.length === 0,
    errors,
    phase: originMain === parent ? "pre-push" : originMain === head ? "post-push-retry" : "blocked",
    releaseFiles,
  };
}

export async function updateUnifiedVersionFiles(root, version, { historyText } = {}) {
  const normalized = formatVersion(version);
  const number = normalized.slice(1);
  const packagePath = path.join(root, "package.json");
  const lockPath = path.join(root, "package-lock.json");
  const versionPath = path.join(root, "VERSION.md");
  const currentPath = path.join(root, "docs/iterations/current.md");

  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  packageJson.version = number;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const packageLock = JSON.parse(await readFile(lockPath, "utf8"));
  packageLock.version = number;
  if (packageLock.packages?.[""]) packageLock.packages[""].version = number;
  await writeFile(lockPath, `${JSON.stringify(packageLock, null, 2)}\n`);

  const versionText = await readFile(versionPath, "utf8");
  const title = `## ${normalized}`;
  const nextEntry = historyText || `\n- 状态：统一版本发布；内容、产品、Git、tag 与公网 manifest 共用同一版本身份。\n`;
  const withoutExisting = versionText.replace(new RegExp(`^## ${normalized.replaceAll(".", "\\.")}[^\\n]*\\n(?:[\\s\\S]*?)(?=^## |$)`, "m"), "");
  await writeFile(versionPath, `${title} — 统一版本发布\n${nextEntry.trim()}\n\n${withoutExisting.trimStart()}`);

  const currentText = await readFile(currentPath, "utf8");
  const replaced = currentText.replace(
    /## 当前(?:唯一|目标)版本[：:]?\s*`v\d+\.\d+\.\d+`/,
    `## 当前唯一版本：\`${normalized}\``,
  );
  if (replaced === currentText && !currentText.includes(normalized)) {
    throw new Error(`current.md does not expose a replaceable version heading for ${normalized}`);
  }
  await writeFile(currentPath, replaced);
}
