import assert from "node:assert/strict";
import { mkdir, readFile, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertProductContentCompatibility } from "../scripts/lib/content-compatibility.mjs";
import { transportSitePublication, waitForPublicSitePublication } from "../scripts/lib/site-publication-coordinator.mjs";

const compatibleCurrent = [
  "# current",
  "contentImpact: compatible",
  "affectedTargets: []",
  "affectedRoutes: []",
  "compatibilityEvidence: coordinator-contract",
].join("\n");

async function rootFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "xingbuild-coordinator-"));
  await mkdir(path.join(root, ".edgeone"), { recursive: true });
  await mkdir(path.join(root, "docs", "iterations"), { recursive: true });
  await writeFile(path.join(root, ".edgeone", "project.json"), JSON.stringify({ Name: "xingbuild-nochina", ProjectId: "makers-ze0f6txvlhco" }));
  await writeFile(path.join(root, "docs", "iterations", "current.md"), compatibleCurrent);
  return root;
}

function publicFetch({ version = "v0.25.0", commit = "a".repeat(40), active = [] } = {}) {
  return async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/release.json") return new Response(JSON.stringify({ version, commit }), { status: 200 });
    if (pathname === "/content-manifest.json") return new Response(JSON.stringify({ version, commit, activeContentReleaseIds: active }), { status: 200 });
    return new Response("<title>xingbuild</title>", { status: 200 });
  };
}

test("product content impact is a hard compatibility gate", () => {
  assert.throws(() => assertProductContentCompatibility({ currentText: "contentImpact: breaking\ncompatibilityEvidence: test" }), /Product Incident/);
  assert.doesNotThrow(() => assertProductContentCompatibility({ currentText: compatibleCurrent }));
});

test("coordinator waits for propagation without changing publication identity", async () => {
  let calls = 0;
  const publication = { sitePublicationId: "pub-1", productVersion: "v0.25.0", productCommit: "a".repeat(40), contentReleaseIds: [] };
  const fetchImpl = async (url) => {
    calls += 1;
    if (calls < 3) return new Response("propagating", { status: 503 });
    return publicFetch({})(url);
  };
  const verified = await waitForPublicSitePublication({ publication, fetchImpl, maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, sleepImpl: async () => {} });
  assert.equal(verified.sitePublicationId, "pub-1");
  assert.ok(verified.attempts <= 3);
});

test("public verification includes declared media evidence", async () => {
  const publication = {
    sitePublicationId: "pub-media",
    productVersion: "v0.25.0",
    productCommit: "a".repeat(40),
    contentReleaseIds: ["content-media"],
    candidateContentReleaseId: "content-media",
    contentManifest: { mediaPaths: ["/media/robotaxi/evidence.mp4"] },
  };
  const verified = await waitForPublicSitePublication({
    publication,
    fetchImpl: publicFetch({ active: ["content-media"] }),
    maxAttempts: 1,
  });
  assert.deepEqual(Object.keys(verified.media), ["/media/robotaxi/evidence.mp4"]);
});

test("resume reuses the persisted deployment and returns success only after public evidence", async () => {
  const root = await rootFixture();
  const client = path.join(root, "publication");
  await mkdir(client, { recursive: true });
  const publication = { sitePublicationId: "pub-resume", productVersion: "v0.25.0", productCommit: "a".repeat(40), contentReleaseIds: [], client };
  let deployCalls = 0;
  const runCaptureImpl = (_command, args) => {
    if (args[0] === "whoami") return "authenticated";
    deployCalls += 1;
    return JSON.stringify({ status: "success", deploymentId: "dep-resume", projectId: "makers-ze0f6txvlhco" });
  };
  const first = await transportSitePublication({ publication, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl: publicFetch(), maxAttempts: 1 });
  assert.equal(first.state, "released");
  assert.equal(deployCalls, 1);
  const persisted = JSON.parse(await readFile(path.join(client, "site-publication.json"), "utf8"));
  const second = await transportSitePublication({ publication: { ...persisted, client }, sourceRoot: root, argv: ["--authorize-publish"], edgeonePath: "edgeone", runCaptureImpl, fetchImpl: publicFetch(), maxAttempts: 1 });
  assert.equal(second.state, "released");
  assert.equal(deployCalls, 1);
});
