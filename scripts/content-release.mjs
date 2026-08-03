#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { access, appendFile, cp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  assertFixedPublishTarget,
  assertPublishAuthorization,
  publicUrl,
  readDeploymentResult,
  readFixedEdgeoneTarget,
} from "./lib/publish-target.mjs";
import {
  assertValidObservation,
  hashFile,
  isFile,
  projectRoot,
} from "./lib/observation-content.mjs";
import { finalizeReleasedContent } from "./lib/content-finalize.mjs";
import { assertPracticeContent, validatePublishablePracticeBundle } from "./lib/practice-content.mjs";
import { readBaseSiteArtifact, validateBaseSiteArtifact } from "./lib/base-site-artifact.mjs";
import {
  applyContentChangeSet,
  hashValue,
  linkContentChangeSetRelease,
  readContentChangeSet,
  readFieldValue,
  writeFieldValue,
} from "./lib/content-targets.mjs";

export const root = projectRoot;
const edgeone = path.join(root, "node_modules", ".bin", "edgeone");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kinds = new Set(["content", "article", "practice"]);

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? "unknown"}`);
}

function runCapture(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  process.stdout.write(output);
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? "unknown"}`);
  return output;
}

function targetPath(kind, target) {
  if (kind === "content") return path.join("content", "observations", `${target}.json`);
  if (kind === "article") return path.join("content", "articles", `${target}.json`);
  return path.join("content", "products", `${target}.json`);
}

function publicPath(kind, target) {
  if (kind === "content") return `/observations/${target}`;
  if (kind === "article") return "/business-observations";
  return "/products";
}

async function readTarget({ kind, target, sourceRoot }) {
  if (!kinds.has(kind) || !slugPattern.test(target)) throw new Error("content release requires one explicit valid target");
  const relative = targetPath(kind, target);
  const file = path.join(sourceRoot, relative);
  if (!(await isFile(file))) throw new Error(`content target is missing: ${relative}`);
  const value = JSON.parse(await readFile(file, "utf8"));
  if (kind === "content") {
    assertValidObservation(value, { expectedStatus: "published" });
    if (value.slug !== target) throw new Error(`content target slug mismatch: ${target}`);
  } else if (kind === "article") {
    if (value.slug !== target || value.status !== "published") throw new Error(`article target is not published: ${target}`);
  } else {
    const bundle = await assertPracticeContent(target, { rootDirectory: sourceRoot, publishable: true });
    if (bundle.practice.id !== target) throw new Error(`practice target mismatch: ${target}`);
    return { relative, file, value, practiceBundle: bundle };
  }
  return { relative, file, value };
}

async function readReview({ kind, target, sourceRoot, content }) {
  const reviewFile = path.join(sourceRoot, ".content-workspace", "reviews", `${target}.json`);
  if (!(await isFile(reviewFile))) {
    if (kind === "content") throw new Error(`approved review is required for content target: ${target}`);
    return { reviewedAt: content.value.reviewedAt || content.value.updatedAt || null, review: null };
  }
  const review = JSON.parse(await readFile(reviewFile, "utf8"));
  if (review.status !== "approved") throw new Error(`content target is not approved: ${target}`);
  if (kind === "content") {
    const draftFile = path.join(sourceRoot, ".content-workspace", "drafts", `${target}.json`);
    const recoveryFile = path.join(sourceRoot, ".content-workspace", "recoveries", `${target}.json`);
    for (const file of [draftFile, recoveryFile]) if (!(await isFile(file))) throw new Error(`content lifecycle file is missing: ${path.relative(sourceRoot, file)}`);
    const expectedHash = await hashFile(draftFile);
    if (review.contentHash !== expectedHash || await hashFile(recoveryFile) !== expectedHash) {
      throw new Error(`content lifecycle hash mismatch: ${target}`);
    }
  }
  return { reviewedAt: review.reviewedAt || null, review };
}

function sourceIds(value) {
  return Array.isArray(value?.sources) ? value.sources.map((source) => typeof source === "string" ? source : source.id).filter(Boolean) : [];
}

export async function prepareContentRelease({ kind, target, changeSetPath, baseSiteArtifact, artifactPath, sourceRoot = root } = {}) {
  const content = await readTarget({ kind, target, sourceRoot });
  const changeSet = changeSetPath
    ? await readContentChangeSet(changeSetPath, { rootDirectory: sourceRoot })
    : null;
  if (changeSet && (kind !== "practice" || target !== "robotaxi" || ![content.relative, "content/media/robotaxi/manifest.json"].includes(changeSet.sourcePath))) {
    throw new Error("Robotaxi field ChangeSet can only overlay the registered Practice or media target");
  }
  if (changeSet) {
    const targetDocument = changeSet.sourcePath === "content/media/robotaxi/manifest.json"
      ? content.practiceBundle?.manifest
      : content.value;
    if (!targetDocument) throw new Error("Robotaxi media ChangeSet requires the approved media manifest");
    if (changeSet.rollbackOf) {
      const canonicalValue = readFieldValue(targetDocument, changeSet.fieldPath);
      if (canonicalValue !== changeSet.rollbackOf.originalBefore || hashValue(canonicalValue) !== hashValue(changeSet.rollbackOf.originalBefore)) {
        throw new Error(`rollback canonical baseline drift for ${changeSet.targetId}`);
      }
      if (changeSet.sourcePath === "content/media/robotaxi/manifest.json") {
        content.practiceBundle.manifest = writeFieldValue(content.practiceBundle.manifest, changeSet.fieldPath, changeSet.rollbackOf.originalAfter);
      } else {
        content.value = writeFieldValue(content.value, changeSet.fieldPath, changeSet.rollbackOf.originalAfter);
      }
    }
    if (changeSet.sourcePath === "content/media/robotaxi/manifest.json") {
      content.practiceBundle.manifest = applyContentChangeSet(content.practiceBundle.manifest, changeSet);
    } else {
      content.value = applyContentChangeSet(content.value, changeSet);
    }
    if (content.practiceBundle) {
      const errors = validatePublishablePracticeBundle(content.value, content.practiceBundle.manifest, { expectedId: target });
      if (errors.length) throw new Error(`Practice ChangeSet validation failed: ${errors.join("; ")}`);
    }
  }
  const review = await readReview({ kind, target, sourceRoot, content });
  const contentHash = changeSet
    ? hashValue({ value: content.value, media: content.practiceBundle?.manifest || null })
    : await hashFile(content.file);
  const immutableArtifact = validateBaseSiteArtifact(await readBaseSiteArtifact({ sourceRoot, baseSiteArtifact, artifactPath }));
  const baseProductVersion = immutableArtifact.productVersion;
  const baseProductCommit = immutableArtifact.productCommit;
  const contentReleaseId = `${kind}-${target}-${contentHash.slice(0, 16)}`;
  const packageDirectory = path.join(sourceRoot, ".content-workspace", "releases", contentReleaseId);
  const manifest = {
    contentReleaseId,
    kind,
    target,
    contentHash,
    sources: sourceIds(content.value),
    sourceRefs: changeSet?.sourceRefs || sourceIds(content.value),
    reviewedAt: review.reviewedAt,
    publishedAt: content.value.publishedAt || content.value.updatedAt || null,
    deploymentId: null,
    publicVerify: null,
    baseSiteArtifactId: immutableArtifact.baseSiteArtifactId,
    baseSiteArtifact: immutableArtifact,
    baseProductVersion,
    baseProductCommit,
    targetPath: publicPath(kind, target),
    changeSetId: changeSet?.changeId || null,
    changedTargets: changeSet ? [changeSet.targetId] : [],
    releasePackage: path.posix.join(".content-workspace/releases", contentReleaseId),
    rollbackOf: changeSet?.rollbackOf || null,
  };
  await mkdir(packageDirectory, { recursive: true });
  const manifestPath = path.join(packageDirectory, "content-release.json");
  if (await exists(manifestPath)) {
    const existing = JSON.parse(await readFile(manifestPath, "utf8"));
    if (existing.contentHash !== contentHash || existing.target !== target || existing.kind !== kind) {
      throw new Error(`content release package identity conflict: ${contentReleaseId}`);
    }
  } else {
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  if (changeSet) {
    await linkContentChangeSetRelease(changeSet.file, {
      contentReleaseId,
      releasePackage: manifest.releasePackage,
      rootDirectory: sourceRoot,
    });
  }
  const sourceDirectory = path.join(packageDirectory, "source");
  const sourceFile = path.join(sourceDirectory, content.relative);
  await mkdir(path.dirname(sourceFile), { recursive: true });
  if (changeSet && changeSet.sourcePath === content.relative) await writeFile(sourceFile, `${JSON.stringify(content.value, null, 2)}\n`);
  else await cp(content.file, sourceFile);
  if (kind === "practice") {
    const mediaManifest = path.join(sourceDirectory, "content", "media", target, "manifest.json");
    if (content.practiceBundle?.manifest && changeSet?.sourcePath === "content/media/robotaxi/manifest.json") {
      await mkdir(path.dirname(mediaManifest), { recursive: true });
      await writeFile(mediaManifest, `${JSON.stringify(content.practiceBundle.manifest, null, 2)}\n`);
    } else if (await exists(path.join(sourceRoot, "content", "media", target, "manifest.json"))) {
      await mkdir(path.dirname(mediaManifest), { recursive: true });
      await cp(path.join(sourceRoot, "content", "media", target, "manifest.json"), mediaManifest);
    }
  }
  if (kind === "content" || kind === "practice") {
    const mediaRoot = path.join(sourceRoot, "content", "media", target);
    const publicMediaRoot = path.join(sourceRoot, "public", "media", target);
    if (await exists(mediaRoot)) await cp(mediaRoot, path.join(sourceDirectory, "content", "media", target), { recursive: true });
    if (await exists(publicMediaRoot)) await cp(publicMediaRoot, path.join(sourceDirectory, "public", "media", target), { recursive: true });
  }
  if (kind === "practice" && content.practiceBundle?.manifest && changeSet?.sourcePath === "content/media/robotaxi/manifest.json") {
    const mediaManifest = path.join(sourceDirectory, "content", "media", target, "manifest.json");
    await mkdir(path.dirname(mediaManifest), { recursive: true });
    await writeFile(mediaManifest, `${JSON.stringify(content.practiceBundle.manifest, null, 2)}\n`);
  }
  await appendContentReleaseLog({ sourceRoot, contentReleaseId, event: "prepared", data: { baseSiteArtifactId: immutableArtifact.baseSiteArtifactId, changeSetId: changeSet?.changeId || null } });
  return { ...manifest, packageDirectory, manifestPath, sourceDirectory, sourceFile, sourceRoot };
}

async function appendContentReleaseLog({ sourceRoot, contentReleaseId, event, data = {} }) {
  const logDirectory = path.join(sourceRoot, ".content-workspace", "logs");
  await mkdir(logDirectory, { recursive: true });
  await appendFile(path.join(logDirectory, `${contentReleaseId}.jsonl`), `${JSON.stringify({ event, contentReleaseId, at: new Date().toISOString(), ...data })}\n`);
}

async function stageRepository({ packageInfo, sourceRoot }) {
  const staging = await fsMkdtemp("xingbuild-content-stage-");
  await cp(sourceRoot, staging, {
    recursive: true,
    filter: (source) => ![".git", "node_modules", "dist", ".content-workspace"].some((name) => source === path.join(sourceRoot, name) || source.startsWith(`${path.join(sourceRoot, name)}${path.sep}`)),
  });
  await symlink(path.join(sourceRoot, "node_modules"), path.join(staging, "node_modules"), "dir");
  for (const entry of await readdir(packageInfo.sourceDirectory, { withFileTypes: true })) {
    await cp(path.join(packageInfo.sourceDirectory, entry.name), path.join(staging, entry.name), { recursive: true, force: true });
  }
  return staging;
}

async function fsMkdtemp(prefix) {
  const { mkdtemp } = await import("node:fs/promises");
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function buildContentRelease({ packageInfo, sourceRoot = root } = {}) {
  if (!packageInfo?.packageDirectory) throw new Error("content build requires a prepared content package");
  const staging = await stageRepository({ packageInfo, sourceRoot });
  try {
    run("npm", ["run", "build"], staging, {
      ...process.env,
      XINGBUILD_PRODUCT_COMMIT: packageInfo.baseSiteArtifact.productCommit,
      XINGBUILD_PRODUCT_VERSION: packageInfo.baseSiteArtifact.productVersion,
      XINGBUILD_CONTENT_BUILD: "1",
    });
    const client = path.join(staging, "dist", "client");
    const manifest = {
      ...JSON.parse(await readFile(packageInfo.manifestPath, "utf8")),
      publishedSlugs: packageInfo.kind === "content" ? [packageInfo.target] : [],
      publishedArticleSlugs: packageInfo.kind === "article" ? [packageInfo.target] : [],
      practiceIds: packageInfo.kind === "practice" ? [packageInfo.target] : [],
    };
    await writeFile(path.join(client, "content-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const packageClient = path.join(packageInfo.packageDirectory, "dist", "client");
    await mkdir(path.dirname(packageClient), { recursive: true });
    await cp(client, packageClient, { recursive: true });
    await writeFile(packageInfo.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await appendContentReleaseLog({ sourceRoot, contentReleaseId: packageInfo.contentReleaseId, event: "built", data: { baseSiteArtifactId: packageInfo.baseSiteArtifactId } });
    return { ...packageInfo, client: packageClient, manifest };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

export async function verifyContentPackageOnce({ baseUrl = publicUrl, manifest, fetchImpl = fetch } = {}) {
  const publicBase = new URL(baseUrl);
  const [pageResponse, releaseResponse, manifestResponse, targetResponse] = await Promise.all([
    fetchImpl(publicBase, { redirect: "follow", cache: "no-store" }),
    fetchImpl(new URL("/release.json", publicBase), { redirect: "follow", cache: "no-store" }),
    fetchImpl(new URL("/content-manifest.json", publicBase), { redirect: "follow", cache: "no-store" }),
    fetchImpl(new URL(manifest.targetPath, publicBase), { redirect: "follow", cache: "no-store" }),
  ]);
  if (![pageResponse, releaseResponse, manifestResponse, targetResponse].every((response) => response.ok)) {
    throw new Error(`content public verification HTTP page=${pageResponse.status} release=${releaseResponse.status} manifest=${manifestResponse.status} target=${targetResponse.status}`);
  }
  const publicManifest = await manifestResponse.json();
  if (publicManifest.contentReleaseId !== manifest.contentReleaseId || publicManifest.target !== manifest.target || publicManifest.contentHash !== manifest.contentHash) {
    throw new Error("public content manifest does not match the prepared content identity");
  }
  if (manifest.baseSiteArtifactId && publicManifest.baseSiteArtifactId !== manifest.baseSiteArtifactId) {
    throw new Error("public content manifest does not match the immutable baseSiteArtifact");
  }
  if (manifest.baseSiteArtifact) {
    const publicRelease = await releaseResponse.json();
    if (publicRelease.version !== manifest.baseSiteArtifact.productVersion || publicRelease.commit !== manifest.baseSiteArtifact.productCommit) {
      throw new Error("public release does not match the immutable baseSiteArtifact");
    }
  }
  const page = await pageResponse.text();
  const target = await targetResponse.text();
  if (!page.includes("<title>xingbuild") || !target.includes("<title>xingbuild")) throw new Error("public content pages do not identify xingbuild");
  return { contentReleaseId: manifest.contentReleaseId, target: manifest.target, publicUrl: new URL(manifest.targetPath, publicBase).href };
}

export async function transportContentRelease({ packageInfo, argv = process.argv.slice(2), env = process.env } = {}) {
  assertFixedPublishTarget(env);
  assertPublishAuthorization({ argv, env });
  if (!(await exists(packageInfo?.client))) throw new Error("content release package dist/client is missing; publish will not build");
  if (!(await exists(edgeone))) throw new Error("EdgeOne CLI is not installed in the project");
  const manifest = JSON.parse(await readFile(packageInfo.manifestPath, "utf8"));
  if (manifest.contentReleaseId !== packageInfo.contentReleaseId || manifest.contentHash !== packageInfo.contentHash) throw new Error("content release package identity mismatch");
  validateBaseSiteArtifact(manifest.baseSiteArtifact);
  if (manifest.baseSiteArtifactId !== manifest.baseSiteArtifact.baseSiteArtifactId) throw new Error("content release baseSiteArtifact identity mismatch");
  if (manifest.baseSiteArtifact.productVersion !== packageInfo.baseSiteArtifact.productVersion || manifest.baseSiteArtifact.productCommit !== packageInfo.baseSiteArtifact.productCommit) {
    throw new Error("content release baseSiteArtifact version/commit mismatch");
  }
  const edgeoneTarget = await readFixedEdgeoneTarget(root);
  run(edgeone, ["whoami"], root, env);
  const deployment = readDeploymentResult(runCapture(edgeone, ["makers", "deploy", packageInfo.client, "--name", edgeoneTarget.name, "--env", "production", "--json"], root, env));
  const deployed = { ...manifest, deploymentId: deployment.deploymentId || deployment.id || null, publishedAt: new Date().toISOString() };
  await writeFile(packageInfo.manifestPath, `${JSON.stringify(deployed, null, 2)}\n`);
  const publicVerify = await verifyContentPackageOnce({ manifest: deployed });
  const completed = { ...deployed, publicVerify: { ...publicVerify, verifiedAt: new Date().toISOString() } };
  await writeFile(packageInfo.manifestPath, `${JSON.stringify(completed, null, 2)}\n`);
  await appendContentReleaseLog({ sourceRoot: packageInfo.sourceRoot || root, contentReleaseId: packageInfo.contentReleaseId, event: "transported", data: { deploymentId: completed.deploymentId } });
  await appendContentReleaseLog({ sourceRoot: packageInfo.sourceRoot || root, contentReleaseId: packageInfo.contentReleaseId, event: "public-verify", data: { publicUrl: completed.publicVerify.publicUrl } });
  if (packageInfo.kind === "content") {
    await finalizeReleasedContent(packageInfo.target, { rootDirectory: root });
    await appendContentReleaseLog({ sourceRoot: packageInfo.sourceRoot || root, contentReleaseId: packageInfo.contentReleaseId, event: "finalized", data: { target: packageInfo.target } });
  }
  return { ...completed, deployment, edgeoneTarget, publicVerify };
}

export async function publishContent({ kind, target, changeSetPath, baseSiteArtifact, artifactPath, argv = process.argv.slice(2), env = process.env } = {}) {
  const prepared = await prepareContentRelease({ kind, target, changeSetPath, baseSiteArtifact, artifactPath });
  const built = await buildContentRelease({ packageInfo: prepared });
  return transportContentRelease({ packageInfo: built, argv, env });
}

async function main(argv = process.argv.slice(2)) {
  const kind = argv[argv.indexOf("--kind") + 1] || "content";
  const target = argv[argv.indexOf("--slug") + 1] || argv[argv.indexOf("--id") + 1];
  const changeSetPath = argv.includes("--change-set") ? argv[argv.indexOf("--change-set") + 1] : null;
  const artifactPath = argv.includes("--base-site-artifact") ? argv[argv.indexOf("--base-site-artifact") + 1] : null;
  if (!kinds.has(kind) || !target || !slugPattern.test(target)) throw new Error("Usage: node scripts/content-release.mjs [--prepare|--build] --kind <content|article|practice> --slug <slug>|--id <id> [--change-set <ignored ChangeSet>] [--authorize-publish]");
  if (argv.includes("--prepare")) {
    const result = await prepareContentRelease({ kind, target, changeSetPath, artifactPath });
    console.log(`Content release prepared: ${result.contentReleaseId}`);
    return;
  }
  if (argv.includes("--build")) {
    const result = await buildContentRelease({ packageInfo: await prepareContentRelease({ kind, target, changeSetPath, artifactPath }) });
    console.log(`Content release built: ${result.contentReleaseId}`);
    return;
  }
  const result = await publishContent({ kind, target, changeSetPath, artifactPath, argv });
  console.log(`Content release completed: ${result.contentReleaseId} ${result.target}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try { await main(); } catch (error) {
    console.error(`内容发布已停止：${error.message}`);
    process.exitCode = 1;
  }
}
