import { access, readFile } from "node:fs/promises";
import path from "node:path";

export const edgeoneProject = "xingbuild-nochina";
export const edgeoneProjectId = "makers-ze0f6txvlhco";
export const edgeoneDomain = "xingbuild.top";
export const publicUrl = "https://xingbuild.top/";

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export function isPublishAuthorized({ argv = [], env = process.env } = {}) {
  return argv.includes("--authorize-publish") || env.XINGBUILD_PUBLISH_AUTHORIZATION === "confirmed";
}

export function assertPublishAuthorization(options = {}) {
  if (!isPublishAuthorized(options)) {
    throw new Error("publish authorization is required (--authorize-publish or XINGBUILD_PUBLISH_AUTHORIZATION=confirmed)");
  }
}

export function assertFixedPublishTarget(env = process.env) {
  const unsupportedOverrides = [
    "XINGBUILD_EDGEONE_PROJECT",
    "XINGBUILD_EDGEONE_PROJECT_ID",
    "XINGBUILD_PUBLIC_URL",
  ];
  const override = unsupportedOverrides.find((name) => env[name]);
  if (override) throw new Error(`${override} is not supported; publish target is fixed by the version contract`);
  if (new URL(publicUrl).hostname !== edgeoneDomain) throw new Error(`publish domain mismatch: ${publicUrl}`);
}

export async function readFixedEdgeoneTarget(sourceCwd) {
  const projectFile = path.join(sourceCwd, ".edgeone", "project.json");
  if (!(await exists(projectFile))) throw new Error("missing .edgeone/project.json for fixed EdgeOne target");
  const project = JSON.parse(await readFile(projectFile, "utf8"));
  if (project.Name !== edgeoneProject || project.ProjectId !== edgeoneProjectId) {
    throw new Error(`EdgeOne target mismatch: expected ${edgeoneProject}/${edgeoneProjectId}`);
  }
  return { name: edgeoneProject, projectId: edgeoneProjectId, domain: edgeoneDomain };
}

export function readDeploymentResult(output) {
  const line = output.split(/\r?\n/).map((value) => value.trim()).reverse().find((value) => value.startsWith("{") && value.endsWith("}"));
  if (!line) throw new Error("EdgeOne deployment did not return a machine-readable result");
  const result = JSON.parse(line);
  if (!result.deploymentId || !["success", "pending", "processing", "running"].includes(result.status) || result.projectId !== edgeoneProjectId) {
    throw new Error(`EdgeOne deployment identity mismatch: expected ${edgeoneProjectId}`);
  }
  return result;
}
