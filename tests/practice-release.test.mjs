import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  evaluatePracticeCommitReadiness,
  mediaPathsForPractice,
  assertPracticeContent,
  validatePracticeMediaFiles,
  validatePublishablePracticeBundle,
} from "../scripts/lib/practice-content.mjs";
import { checkPracticeCommit } from "../scripts/practice-scope-check.mjs";
import { verifyPracticeReleaseOnce } from "../scripts/verify-practice-release.mjs";

const mediaBytes = Buffer.from("approved-practice-media");
const assetSha256 = createHash("sha256").update(mediaBytes).digest("hex");
const practice = {
  id: "robotaxi", route: "/products", navLabel: "Robotaxi运营平台", title: "Robotaxi运营平台", intro: "说明", boundary: "边界", modules: [{
    id: "robotaxi-module", group: "运营中控台", label: "模块", shortDescription: "说明", loopRelation: "运营中控台", mediaId: "robotaxi-media", action: { href: "https://robotaxi.xingbuild.top/" },
  }],
};
const manifest = {
  id: "robotaxi-approved-media", version: "v1", directory: "/media/robotaxi", reviewStatus: "approved", publicStatus: "public",
  approvalRecord: { approvalId: "approval-1", approvalStatus: "approved", authority: "user", approvedAt: "2026-08-01", scope: "test" },
  currentPublication: { status: "active", effectiveAt: "2026-08-01", authority: "user", reason: "test" },
  provenance: { repository: "Robotaxi", manifestPath: "manifest.json", version: "v1", commit: "abcdef0", sourceDraftManifestSha256: "a".repeat(64) },
  assets: [{
    id: "robotaxi-media", type: "image", src: "/media/robotaxi/approved.png", altZh: "已批准媒体", ratio: "16:10", assetSha256,
    reviewStatus: "approved", publicStatus: "public", provenance: { mediaRole: "current_system_evidence", stateBoundary: "测试边界", robotaxiVersion: "v1", commit: "abcdef0", approvalStatus: "approved" },
  }],
};
const practicePath = "content/products/robotaxi.json";
const manifestPath = "content/media/robotaxi/manifest.json";
const mediaPath = "public/media/robotaxi/approved.png";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));

function readiness(overrides = {}) {
  return evaluatePracticeCommitReadiness({
    practiceId: "robotaxi", files: [practicePath, manifestPath, mediaPath], currentVersion: "0.21.0", parentVersion: "0.21.0",
    head: "head", parent: "parent", originMain: "parent", headTags: [], practice, manifest, ...overrides,
  });
}

test("Practice scope accepts exactly one approved target package and rejects mixed version or tag changes", () => {
  assert.deepEqual(readiness().errors, []);
  for (const overrides of [
    { files: [practicePath, manifestPath, mediaPath, "src/pages/ProductsPage.jsx"] },
    { files: [practicePath, mediaPath] },
    { currentVersion: "0.21.1" },
    { headTags: ["v0.21.0"] },
    { originMain: "other" },
  ]) assert.ok(readiness(overrides).errors.length);
});

test("Practice scope requires one explicit, non-empty target id", () => {
  for (const args of [[], ["--id", ""], ["--id", "robotaxi", "--id", "robotaxi"], ["--id", "robotaxi", "--unexpected", "x"]]) {
    const result = spawnSync(process.execPath, ["scripts/practice-scope-check.mjs", ...args], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /Usage:/);
  }
});

test("Practice publication reuses lifecycle and hash validation without altering its schema", async () => {
  assert.deepEqual(validatePublishablePracticeBundle(practice, manifest, { expectedId: "robotaxi" }), []);
  assert.deepEqual(await validatePracticeMediaFiles(manifest, { practice, readBytes: async () => mediaBytes }), []);
  assert.match((await validatePracticeMediaFiles(manifest, { practice, readBytes: async () => Buffer.from("wrong") }))[0], /hash mismatch/);
  assert.ok(validatePublishablePracticeBundle(practice, { ...manifest, reviewStatus: "superseded" }, { expectedId: "robotaxi" }).length);
});

test("Practice publication ignores unreferenced internal media but rejects unsafe media path mappings", async () => {
  const internalAsset = {
    id: "robotaxi-archived-media", type: "image", archivePath: "content/media/robotaxi/archive/old.png", altZh: "归档媒体", ratio: "16:10", assetSha256,
    reviewStatus: "revoked", publicStatus: "internal", provenance: { mediaRole: "current_system_evidence", stateBoundary: "归档", robotaxiVersion: "v1", commit: "abcdef0", approvalStatus: "revoked" },
  };
  const mixedManifest = { ...manifest, assets: [...manifest.assets, internalAsset] };
  assert.deepEqual(validatePublishablePracticeBundle(practice, mixedManifest, { expectedId: "robotaxi" }), []);
  assert.deepEqual(await validatePracticeMediaFiles(mixedManifest, { practice, readBytes: async (file) => {
    assert.equal(file, mediaPath);
    return mediaBytes;
  } }), []);
  assert.deepEqual(mediaPathsForPractice(practice, mixedManifest), [mediaPath]);
  const unsafeAssets = [
    { ...manifest.assets[0], src: "/media/robotaxi/../outside.png" },
    { ...manifest.assets[0], src: undefined, archivePath: "content/media/robotaxi/archive/../../outside.png" },
    { ...manifest.assets[0], src: undefined, archivePath: "/tmp/outside.png" },
  ];
  for (const asset of unsafeAssets) {
    const unsafeManifest = { ...manifest, assets: [asset] };
    assert.ok(validatePublishablePracticeBundle(practice, unsafeManifest, { expectedId: "robotaxi" }).length);
    assert.deepEqual(mediaPathsForPractice(practice, unsafeManifest), []);
    assert.ok(readiness({ manifest: unsafeManifest, files: [practicePath, manifestPath, "public/media/outside.png"] }).errors.some((error) => error.includes("forbidden files")));
  }
});

test("unsafe Practice paths never reach the scope or local file readers", async () => {
  const unsafeManifest = { ...manifest, assets: [{ ...manifest.assets[0], src: "/media/robotaxi/../outside.png" }] };
  let directReads = 0;
  const directErrors = await validatePracticeMediaFiles(unsafeManifest, { practice, readBytes: async () => {
    directReads += 1;
    return mediaBytes;
  } });
  assert.equal(directReads, 0);
  assert.match(directErrors[0], /unsafe public src path/);

  const json = new Map([
    ["HEAD:content/products/robotaxi.json", JSON.stringify(practice)],
    ["HEAD:content/media/robotaxi/manifest.json", JSON.stringify(unsafeManifest)],
    ["HEAD:package.json", JSON.stringify({ version: "0.21.0" })],
    ["HEAD^:package.json", JSON.stringify({ version: "0.21.0" })],
  ]);
  const gitImpl = (args) => {
    const key = args[0] === "show" ? args[1] : args.join(" ");
    if (json.has(key)) return json.get(key);
    if (args[0] === "rev-parse" && args[1] === "HEAD^") return "parent";
    if (args[0] === "rev-parse" && args[1] === "HEAD") return "head";
    if (args[0] === "rev-parse" && args[1] === "origin/main") return "parent";
    if (args[0] === "diff-tree") return [practicePath, manifestPath].join("\n");
    if (args[0] === "tag") return "";
    throw new Error(`unexpected git call: ${args.join(" ")}`);
  };
  let scopeReads = 0;
  const scopeResult = await checkPracticeCommit({ practiceId: "robotaxi", gitImpl, readBytes: async () => {
    scopeReads += 1;
    return mediaBytes;
  } });
  assert.equal(scopeReads, 0);
  assert.ok(scopeResult.errors.some((error) => /unsafe public src path/.test(error)));

  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "xingbuild-practice-unsafe-"));
  try {
    await mkdir(path.join(fixtureRoot, "content/products"), { recursive: true });
    await mkdir(path.join(fixtureRoot, "content/media/robotaxi"), { recursive: true });
    await writeFile(path.join(fixtureRoot, practicePath), JSON.stringify(practice));
    await writeFile(path.join(fixtureRoot, manifestPath), JSON.stringify(unsafeManifest));
    await assert.rejects(
      () => assertPracticeContent("robotaxi", { rootDirectory: fixtureRoot, publishable: true }),
      (error) => /unsafe public src path/.test(error.message) && !/file is missing|hash mismatch/.test(error.message),
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("Practice scope reads one target commit, including manifest media, without scanning workspace", async () => {
  const json = new Map([
    ["HEAD:content/products/robotaxi.json", JSON.stringify(practice)],
    ["HEAD:content/media/robotaxi/manifest.json", JSON.stringify(manifest)],
    ["HEAD:package.json", JSON.stringify({ version: "0.21.0" })],
    ["HEAD^:package.json", JSON.stringify({ version: "0.21.0" })],
  ]);
  const gitImpl = (args) => {
    const key = args[0] === "show" ? args[1] : args.join(" ");
    if (json.has(key)) return json.get(key);
    if (args[0] === "rev-parse" && args[1] === "HEAD^") return "parent";
    if (args[0] === "rev-parse" && args[1] === "HEAD") return "head";
    if (args[0] === "rev-parse" && args[1] === "origin/main") return "parent";
    if (args[0] === "diff-tree") return [practicePath, manifestPath, mediaPath].join("\n");
    if (args[0] === "tag") return "";
    throw new Error(`unexpected git call: ${args.join(" ")}`);
  };
  const result = await checkPracticeCommit({ practiceId: "robotaxi", gitImpl, readBytes: async (file) => {
    assert.equal(file, mediaPath);
    return mediaBytes;
  } });
  assert.deepEqual(result.errors, []);
});

test("public Practice verification aligns release, manifest, target modules and approved media", async () => {
  const responses = (projection) => new Map([
    ["https://xingbuild.top/", new Response("<title>xingbuild</title>")],
    ["https://xingbuild.top/release.json", new Response(JSON.stringify({ version: "v0.21.0", commit: "commit" }))],
    ["https://xingbuild.top/content-manifest.json", new Response(JSON.stringify({ version: "v0.21.0", commit: "commit" }))],
    ["https://xingbuild.top/products", new Response('<title>xingbuild</title><script type="module" src="/assets/products.js"></script>')],
    ["https://xingbuild.top/assets/products.js", new Response(projection)],
    ["https://xingbuild.top/media/robotaxi/approved.png", new Response("asset")],
  ]);
  const publicProjection = responses("robotaxi robotaxi-module /media/robotaxi/approved.png");
  const result = await verifyPracticeReleaseOnce({
    baseUrl: "https://xingbuild.top/", expectedVersion: "v0.21.0", expectedCommit: "commit", practiceId: "robotaxi",
    bundle: { practice, manifest }, fetchImpl: async (url) => publicProjection.get(String(url)) || new Response("missing", { status: 404 }),
  });
  assert.deepEqual(result, { practiceId: "robotaxi", productUrl: "https://xingbuild.top/products", moduleCount: 1, publicMediaCount: 1 });
  const missingProjection = responses("unrelated public bundle");
  await assert.rejects(() => verifyPracticeReleaseOnce({
    baseUrl: "https://xingbuild.top/", expectedVersion: "v0.21.0", expectedCommit: "commit", practiceId: "robotaxi",
    bundle: { practice, manifest }, fetchImpl: async (url) => missingProjection.get(String(url)) || new Response("missing", { status: 404 }),
  }), /target Practice public projection/);
});

test("v0.21 product records are synchronized while Practice publishing remains version-neutral", async () => {
  const [packageJson, packageLock, versionRecord] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
    readFile(new URL("../VERSION.md", import.meta.url), "utf8"),
  ]);
  assert.equal(JSON.parse(packageJson).version, "0.21.0");
  assert.equal(JSON.parse(packageLock).version, "0.21.0");
  assert.match(versionRecord, /## v0\.21\.0/);
  assert.ok(readiness({ currentVersion: "0.21.1" }).errors.includes("Practice publication must not change product version"));
});

test("Practice publish command remains separate from product versions and tags", async () => {
  const [packageJson, command, verify] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../publish-practice.command", import.meta.url), "utf8"),
    readFile(new URL("../scripts/verify-practice-release.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(packageJson, /practice:scope-check/);
  assert.match(command, /practice:scope-check -- --id/);
  assert.match(command, /npm run build[\s\S]*npm run test:sites/);
  assert.doesNotMatch(command, /git tag|VERSION\.md/);
  assert.match(verify, /content-manifest\.json/);
  assert.match(verify, /referencedPracticeMediaAssets/);
  assert.match(verify, /target Practice public projection/);
});
