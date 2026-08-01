import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateApprovedMedia, validateContentScope } from "../scripts/content-scope-check.mjs";
import { evaluateContentCommitReadiness } from "../scripts/lib/content-release-readiness.mjs";
import { readPublishedObservations } from "../scripts/lib/observation-content.mjs";
import { verifyContentReleaseOnce } from "../scripts/verify-content-release.mjs";
import { verifyAndFinalizeContentRelease } from "../scripts/verify-content-release.mjs";
import {
  evaluateCloseoutReadiness,
  evaluateProductReleaseReadiness,
  expectedOrigin,
  parseCurrentIterationVersion,
} from "../scripts/lib/release-readiness.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(root, "tests", "fixtures", "observation-candidate.valid.json");

function runScript(script, args, contentRoot) {
  return spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], {
    cwd: root,
    env: { ...process.env, XINGBUILD_CONTENT_ROOT: contentRoot },
    encoding: "utf8",
  });
}

async function pathExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

test("valid candidate moves through isolated draft preview and promote", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  assert.match(imported.stdout, /Workspace import consumed: no \(external input retained\)/);
  assert.equal(await pathExists(fixturePath), true);
  const preview = runScript("content-preview.mjs", ["--slug", "sanitized-candidate-preview"], contentRoot);
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /\?draft=1/);
  const reviewed = runScript(
    "content-review.mjs",
    ["--slug", "sanitized-candidate-preview", "--authority", "test-reviewer"],
    contentRoot,
  );
  assert.equal(reviewed.status, 0, reviewed.stderr);

  const unrelated = JSON.parse(await readFile(fixturePath, "utf8"));
  unrelated.id = "observation-unrelated-draft";
  unrelated.slug = "unrelated-draft";
  await writeFile(
    path.join(contentRoot, ".content-workspace", "drafts", "unrelated-draft.json"),
    `${JSON.stringify(unrelated, null, 2)}\n`,
  );
  for (const directory of ["candidates", "imports"]) {
    const target = path.join(contentRoot, ".content-workspace", directory);
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "unrelated-draft.json"), `${JSON.stringify(unrelated, null, 2)}\n`);
  }
  const promoted = runScript("content-promote.mjs", ["--slug", "sanitized-candidate-preview"], contentRoot);
  assert.equal(promoted.status, 0, promoted.stderr);
  const publication = JSON.parse(
    await readFile(path.join(contentRoot, "content", "observations", "sanitized-candidate-preview.json"), "utf8"),
  );
  assert.equal(publication.status, "published");
  assert.equal(
    await pathExists(path.join(contentRoot, ".content-workspace", "drafts", "sanitized-candidate-preview.json")),
    true,
  );
  assert.equal(
    await pathExists(path.join(contentRoot, ".content-workspace", "recoveries", "sanitized-candidate-preview.json")),
    true,
  );
  assert.equal(
    await readFile(path.join(contentRoot, ".content-workspace", "recoveries", "sanitized-candidate-preview.json"), "utf8"),
    await readFile(path.join(contentRoot, ".content-workspace", "drafts", "sanitized-candidate-preview.json"), "utf8"),
  );
  assert.equal(
    await pathExists(path.join(contentRoot, ".content-workspace", "drafts", "unrelated-draft.json")),
    true,
  );
});

test("content approve atomically records and promotes only one explicit target", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-approve-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const slug = "sanitized-candidate-preview";
  const workspace = path.join(contentRoot, ".content-workspace");
  const draftFile = path.join(workspace, "drafts", `${slug}.json`);
  const draftBefore = await readFile(draftFile, "utf8");
  const unrelated = JSON.parse(draftBefore);
  unrelated.id = "observation-unrelated-approve";
  unrelated.slug = "unrelated-approve";
  const unrelatedBefore = new Map();
  for (const directory of ["candidates", "imports", "drafts", "reviews", "recoveries"]) {
    const file = path.join(workspace, directory, "unrelated-approve.json");
    const value = directory === "reviews"
      ? '{"sentinel":"unrelated-review"}\n'
      : `${JSON.stringify(unrelated, null, 2)}\n`;
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, value);
    unrelatedBefore.set(file, value);
  }

  const result = runScript(
    "content-approve.mjs",
    ["--slug", slug, "--authority", "content-owner"],
    contentRoot,
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(draftFile, "utf8"), draftBefore);
  const review = JSON.parse(await readFile(path.join(workspace, "reviews", `${slug}.json`), "utf8"));
  assert.equal(review.status, "approved");
  assert.equal(review.authority, "content-owner");
  assert.match(review.contentHash, /^[a-f0-9]{64}$/);
  assert.equal(
    await readFile(path.join(workspace, "recoveries", `${slug}.json`), "utf8"),
    draftBefore,
  );
  const publication = JSON.parse(
    await readFile(path.join(contentRoot, "content", "observations", `${slug}.json`), "utf8"),
  );
  assert.equal(publication.status, "published");
  for (const [file, value] of unrelatedBefore) {
    assert.equal(await readFile(file, "utf8"), value);
  }
});

test("content approve strictly rejects missing, empty, duplicate, or multiple parameters", async () => {
  const cases = [
    [],
    ["--slug", "sanitized-candidate-preview"],
    ["--slug", "sanitized-candidate-preview", "--authority", ""],
    ["--slug", "sanitized-candidate-preview", "--slug", "another-slug", "--authority", "owner"],
    ["--slug", "sanitized-candidate-preview", "--authority", "owner", "--extra", "value"],
  ];
  for (const args of cases) {
    const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-approve-args-"));
    const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
    assert.equal(imported.status, 0, imported.stderr);
    const result = runScript("content-approve.mjs", args, contentRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage: npm run content:approve/);
    const workspace = path.join(contentRoot, ".content-workspace");
    assert.equal(await pathExists(path.join(workspace, "reviews", "sanitized-candidate-preview.json")), false);
    assert.equal(await pathExists(path.join(workspace, "recoveries", "sanitized-candidate-preview.json")), false);
    assert.equal(
      await pathExists(path.join(contentRoot, "content", "observations", "sanitized-candidate-preview.json")),
      false,
    );
  }
});

test("content approve preserves target facts when review, recovery, production, or workspace conflicts exist", async () => {
  for (const conflict of ["review", "recovery", "production", "candidate", "import"]) {
    const contentRoot = await mkdtemp(path.join(os.tmpdir(), `xingbuild-content-approve-${conflict}-`));
    const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
    assert.equal(imported.status, 0, imported.stderr);
    const slug = "sanitized-candidate-preview";
    const workspace = path.join(contentRoot, ".content-workspace");
    const draftFile = path.join(workspace, "drafts", `${slug}.json`);
    const draftBefore = await readFile(draftFile, "utf8");
    const locations = {
      review: path.join(workspace, "reviews", `${slug}.json`),
      recovery: path.join(workspace, "recoveries", `${slug}.json`),
      production: path.join(contentRoot, "content", "observations", `${slug}.json`),
      candidate: path.join(workspace, "candidates", `${slug}.json`),
      import: path.join(workspace, "imports", `${slug}.json`),
    };
    const conflictFile = locations[conflict];
    const conflictValue = conflict === "production"
      ? `${JSON.stringify({ ...JSON.parse(draftBefore), status: "published" }, null, 2)}\n`
      : draftBefore;
    await mkdir(path.dirname(conflictFile), { recursive: true });
    await writeFile(conflictFile, conflictValue);
    const result = runScript(
      "content-approve.mjs",
      ["--slug", slug, "--authority", "content-owner"],
      contentRoot,
    );
    assert.notEqual(result.status, 0);
    assert.equal(await readFile(draftFile, "utf8"), draftBefore);
    assert.equal(await readFile(conflictFile, "utf8"), conflictValue);
    if (conflict !== "review") {
      assert.equal(await pathExists(locations.review), false);
    }
    if (conflict !== "recovery") {
      assert.equal(await pathExists(locations.recovery), false);
    }
    if (conflict !== "production") {
      assert.equal(await pathExists(locations.production), false);
    }
  }
});

test("content approve rejects invalid source evidence without lifecycle side effects", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-approve-invalid-"));
  const slug = "sanitized-candidate-preview";
  const workspace = path.join(contentRoot, ".content-workspace");
  const draftFile = path.join(workspace, "drafts", `${slug}.json`);
  const invalid = JSON.parse(await readFile(fixturePath, "utf8"));
  invalid.evidenceUnits[0].sourceRefs = ["source-missing"];
  const invalidValue = `${JSON.stringify(invalid, null, 2)}\n`;
  await mkdir(path.dirname(draftFile), { recursive: true });
  await writeFile(draftFile, invalidValue);
  const result = runScript(
    "content-approve.mjs",
    ["--slug", slug, "--authority", "content-owner"],
    contentRoot,
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /references missing source-missing/);
  assert.equal(await readFile(draftFile, "utf8"), invalidValue);
  assert.equal(await pathExists(path.join(workspace, "reviews", `${slug}.json`)), false);
  assert.equal(await pathExists(path.join(workspace, "recoveries", `${slug}.json`)), false);
  assert.equal(await pathExists(path.join(contentRoot, "content", "observations", `${slug}.json`)), false);
});

test("content approve rolls back its review and recovery when production write fails", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-approve-rollback-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const slug = "sanitized-candidate-preview";
  const workspace = path.join(contentRoot, ".content-workspace");
  const draftFile = path.join(workspace, "drafts", `${slug}.json`);
  const draftBefore = await readFile(draftFile, "utf8");
  const blockedProduction = path.join(contentRoot, "content", "observations", `${slug}.json`);
  await mkdir(blockedProduction, { recursive: true });

  const result = runScript(
    "content-approve.mjs",
    ["--slug", slug, "--authority", "content-owner"],
    contentRoot,
  );
  assert.notEqual(result.status, 0);
  assert.equal(await readFile(draftFile, "utf8"), draftBefore);
  assert.equal(await pathExists(path.join(workspace, "reviews", `${slug}.json`)), false);
  assert.equal(await pathExists(path.join(workspace, "recoveries", `${slug}.json`)), false);
  assert.deepEqual(await readdir(blockedProduction), []);
  assert.deepEqual(await readdir(path.dirname(blockedProduction)), [`${slug}.json`]);
});

test("legacy content promote preserves recovery when atomic production placement fails", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-promote-recovery-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const slug = "sanitized-candidate-preview";
  const workspace = path.join(contentRoot, ".content-workspace");
  const draftFile = path.join(workspace, "drafts", `${slug}.json`);
  const reviewed = runScript(
    "content-review.mjs",
    ["--slug", slug, "--authority", "content-owner"],
    contentRoot,
  );
  assert.equal(reviewed.status, 0, reviewed.stderr);
  const draftBefore = await readFile(draftFile, "utf8");
  const reviewFile = path.join(workspace, "reviews", `${slug}.json`);
  const reviewBefore = await readFile(reviewFile, "utf8");
  const blockedProduction = path.join(contentRoot, "content", "observations", `${slug}.json`);
  await mkdir(blockedProduction, { recursive: true });

  const result = runScript("content-promote.mjs", ["--slug", slug], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Promotion failed after recovery was preserved/);
  assert.equal(await readFile(draftFile, "utf8"), draftBefore);
  assert.equal(await readFile(reviewFile, "utf8"), reviewBefore);
  assert.equal(
    await readFile(path.join(workspace, "recoveries", `${slug}.json`), "utf8"),
    draftBefore,
  );
  assert.deepEqual(await readdir(blockedProduction), []);
  assert.deepEqual(await readdir(path.dirname(blockedProduction)), [`${slug}.json`]);
});

test("workspace import is consumed only after a valid draft is written", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-consume-"));
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const inputFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  const draftFile = path.join(contentRoot, ".content-workspace", "drafts", "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await writeFile(inputFile, await readFile(fixturePath, "utf8"));

  const imported = runScript("content-import.mjs", ["--input", inputFile], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  assert.match(imported.stdout, /Workspace import consumed: yes/);
  assert.equal(await pathExists(inputFile), false);
  assert.equal(await pathExists(draftFile), true);
});

test("invalid candidates fail instead of receiving invented fields", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-invalid-"));
  const candidate = JSON.parse(await readFile(fixturePath, "utf8"));
  delete candidate.operatingImpact;
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const invalidFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await writeFile(invalidFile, JSON.stringify(candidate));
  const result = runScript("content-import.mjs", ["--input", invalidFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /operatingImpact is required/);
  assert.equal(await pathExists(invalidFile), true);
});

test("candidate with missing source references fails before draft creation", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-missing-source-"));
  const candidate = JSON.parse(await readFile(fixturePath, "utf8"));
  candidate.evidenceUnits[0].sourceRefs = ["source-does-not-exist"];
  const inputFile = path.join(contentRoot, ".content-workspace", "imports", "sanitized-candidate-preview.json");
  await mkdir(path.dirname(inputFile), { recursive: true });
  await writeFile(inputFile, JSON.stringify(candidate));
  const result = runScript("content-import.mjs", ["--input", inputFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /references missing source-does-not-exist/);
  assert.equal(await pathExists(inputFile), true);
});

test("duplicate draft keeps the workspace import", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-duplicate-"));
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const draftsDirectory = path.join(contentRoot, ".content-workspace", "drafts");
  const inputFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  const draftFile = path.join(draftsDirectory, "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await mkdir(draftsDirectory, { recursive: true });
  await writeFile(inputFile, await readFile(fixturePath, "utf8"));
  await writeFile(draftFile, await readFile(fixturePath, "utf8"));

  const result = runScript("content-import.mjs", ["--input", inputFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Draft observation already exists/);
  assert.equal(await pathExists(inputFile), true);
});

test("draft write failure keeps the workspace import", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-write-failure-"));
  const importsDirectory = path.join(contentRoot, ".content-workspace", "imports");
  const blockedDraftPath = path.join(
    contentRoot,
    ".content-workspace",
    "drafts",
    "sanitized-candidate-preview.json",
  );
  const inputFile = path.join(importsDirectory, "sanitized-candidate-preview.json");
  await mkdir(importsDirectory, { recursive: true });
  await mkdir(blockedDraftPath, { recursive: true });
  await writeFile(inputFile, await readFile(fixturePath, "utf8"));

  const result = runScript("content-import.mjs", ["--input", inputFile], contentRoot);
  assert.notEqual(result.status, 0);
  assert.equal(await pathExists(inputFile), true);
});

test("promote rejects an unreviewed or changed target without consuming its draft", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-review-gate-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const slug = "sanitized-candidate-preview";
  const draftFile = path.join(contentRoot, ".content-workspace", "drafts", `${slug}.json`);

  const unreviewed = runScript("content-promote.mjs", ["--slug", slug], contentRoot);
  assert.notEqual(unreviewed.status, 0);
  assert.match(unreviewed.stderr, /Approved review not found/);

  const reviewed = runScript("content-review.mjs", ["--slug", slug, "--authority", "test-reviewer"], contentRoot);
  assert.equal(reviewed.status, 0, reviewed.stderr);
  const changed = JSON.parse(await readFile(draftFile, "utf8"));
  changed.title = `${changed.title}（已改变）`;
  await writeFile(draftFile, `${JSON.stringify(changed, null, 2)}\n`);
  const mismatch = runScript("content-promote.mjs", ["--slug", slug], contentRoot);
  assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /hash no longer matches approved review/);
  assert.equal(await pathExists(draftFile), true);
});

test("target candidate or import conflicts block promote while unrelated workspace files do not", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-target-conflict-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const slug = "sanitized-candidate-preview";
  const reviewed = runScript("content-review.mjs", ["--slug", slug, "--authority", "test-reviewer"], contentRoot);
  assert.equal(reviewed.status, 0, reviewed.stderr);
  const candidates = path.join(contentRoot, ".content-workspace", "candidates");
  await mkdir(candidates, { recursive: true });
  await writeFile(path.join(candidates, `${slug}.json`), await readFile(fixturePath, "utf8"));
  const blocked = runScript("content-promote.mjs", ["--slug", slug], contentRoot);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /Target candidate conflicts/);
  await unlink(path.join(candidates, `${slug}.json`));
  const imports = path.join(contentRoot, ".content-workspace", "imports");
  await mkdir(imports, { recursive: true });
  await writeFile(path.join(imports, `${slug}.json`), await readFile(fixturePath, "utf8"));
  const importBlocked = runScript("content-promote.mjs", ["--slug", slug], contentRoot);
  assert.notEqual(importBlocked.status, 0);
  assert.match(importBlocked.stderr, /Target import conflicts/);
});

test("promote rejects duplicate production slug", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-duplicate-production-"));
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const slug = "sanitized-candidate-preview";
  const reviewed = runScript("content-review.mjs", ["--slug", slug, "--authority", "test-reviewer"], contentRoot);
  assert.equal(reviewed.status, 0, reviewed.stderr);
  const publication = JSON.parse(await readFile(fixturePath, "utf8"));
  publication.status = "published";
  const published = path.join(contentRoot, "content", "observations");
  await mkdir(published, { recursive: true });
  await writeFile(path.join(published, `${slug}.json`), `${JSON.stringify(publication, null, 2)}\n`);
  const result = runScript("content-promote.mjs", ["--slug", slug], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Published observation already exists/);
});

test("supersede archives only one explicit unpublished draft with hash sidecar", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-supersede-"));
  const drafts = path.join(contentRoot, ".content-workspace", "drafts");
  await mkdir(drafts, { recursive: true });
  const oldDraft = JSON.parse(await readFile(fixturePath, "utf8"));
  oldDraft.id = "observation-old-draft";
  oldDraft.slug = "old-draft";
  const canonical = JSON.parse(await readFile(fixturePath, "utf8"));
  canonical.id = "observation-canonical-draft";
  canonical.slug = "canonical-draft";
  await writeFile(path.join(drafts, "old-draft.json"), `${JSON.stringify(oldDraft, null, 2)}\n`);
  await writeFile(path.join(drafts, "canonical-draft.json"), `${JSON.stringify(canonical, null, 2)}\n`);

  const result = runScript("content-supersede.mjs", [
    "--old-slug", "old-draft",
    "--canonical-slug", "canonical-draft",
    "--reason", "事实表达由 canonical 草稿替代",
    "--decided-at", "2026-07-30",
  ], contentRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await pathExists(path.join(drafts, "old-draft.json")), false);
  assert.equal(await pathExists(path.join(drafts, "canonical-draft.json")), true);
  const sidecar = JSON.parse(await readFile(
    path.join(contentRoot, ".content-workspace", "superseded", "old-draft.supersession.json"),
    "utf8",
  ));
  assert.equal(sidecar.supersededBy, "canonical-draft");
  assert.match(sidecar.contentHash, /^[a-f0-9]{64}$/);
});

test("supersede refuses an already published old slug", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-supersede-published-"));
  const published = path.join(contentRoot, "content", "observations");
  const drafts = path.join(contentRoot, ".content-workspace", "drafts");
  await mkdir(published, { recursive: true });
  await mkdir(drafts, { recursive: true });
  const oldPublication = JSON.parse(await readFile(fixturePath, "utf8"));
  oldPublication.id = "observation-old-published";
  oldPublication.slug = "old-published";
  oldPublication.status = "published";
  const canonical = JSON.parse(await readFile(fixturePath, "utf8"));
  canonical.id = "observation-canonical-draft";
  canonical.slug = "canonical-draft";
  await writeFile(path.join(published, "old-published.json"), `${JSON.stringify(oldPublication, null, 2)}\n`);
  await writeFile(path.join(drafts, "old-published.json"), await readFile(fixturePath, "utf8"));
  await writeFile(path.join(drafts, "canonical-draft.json"), `${JSON.stringify(canonical, null, 2)}\n`);
  const result = runScript("content-supersede.mjs", [
    "--old-slug", "old-published",
    "--canonical-slug", "canonical-draft",
    "--reason", "不允许撤下已发布内容",
    "--decided-at", "2026-07-30",
  ], contentRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Published observations cannot be superseded/);
});

test("content-only scope rejects mixed engineering files", () => {
  assert.deepEqual(
    validateContentScope(["content/observations/new-item.json"], { slug: "new-item" }),
    [],
  );
  assert.ok(
    validateContentScope(["content/observations/new-item.json", "src/App.jsx"], { slug: "new-item" })
      .some((error) => error.includes("forbidden files")),
  );
  assert.ok(validateContentScope(["content/observations/other-item.json"], { slug: "new-item" }).length);
});

test("content commit readiness fixes version, tag, scope and origin ancestry", () => {
  const ready = evaluateContentCommitReadiness({
    slug: "new-item",
    files: ["content/observations/new-item.json"],
    currentVersion: "0.15.4",
    parentVersion: "0.15.4",
    head: "content-head",
    parent: "product-head",
    originMain: "product-head",
    headTags: [],
  });
  assert.equal(ready.ready, true);
  assert.equal(ready.phase, "pre-push");

  const retry = evaluateContentCommitReadiness({
    ...ready,
    slug: "new-item",
    files: ["content/observations/new-item.json"],
    currentVersion: "0.15.4",
    parentVersion: "0.15.4",
    head: "content-head",
    parent: "product-head",
    originMain: "content-head",
    headTags: [],
  });
  assert.equal(retry.ready, true);
  assert.equal(retry.phase, "post-push-retry");

  for (const blocked of [
    { currentVersion: "0.15.5" },
    { originMain: "unrelated-head" },
    { headTags: ["v0.15.5"] },
    { files: ["content/observations/new-item.json", "src/App.jsx"] },
    { files: ["content/observations/new-item.json", "public/media/new-item/figure.png"] },
  ]) {
    const result = evaluateContentCommitReadiness({
      slug: "new-item",
      files: ["content/observations/new-item.json"],
      currentVersion: "0.15.4",
      parentVersion: "0.15.4",
      head: "content-head",
      parent: "product-head",
      originMain: "product-head",
      headTags: [],
      ...blocked,
    });
    assert.equal(result.ready, false);
  }
});

test("approved target media requires scoped files and matching SHA-256", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-media-"));
  const slug = "new-item";
  const publicDirectory = path.join(contentRoot, "public", "media", slug);
  const manifestDirectory = path.join(contentRoot, "content", "media", slug);
  await mkdir(publicDirectory, { recursive: true });
  await mkdir(manifestDirectory, { recursive: true });
  const publicFile = path.join(publicDirectory, "figure.png");
  await writeFile(publicFile, "approved-media");
  const { createHash } = await import("node:crypto");
  const assetSha256 = createHash("sha256").update("approved-media").digest("hex");
  const manifestPath = `content/media/${slug}/manifest.json`;
  await writeFile(path.join(manifestDirectory, "manifest.json"), JSON.stringify({
    reviewStatus: "approved",
    publicStatus: "public",
    assets: [{
      id: "figure",
      src: `/media/${slug}/figure.png`,
      reviewStatus: "approved",
      publicStatus: "public",
      assetSha256,
      provenance: { approvalStatus: "approved" },
    }],
  }));
  const files = [manifestPath, `public/media/${slug}/figure.png`];
  assert.deepEqual(await validateApprovedMedia(manifestPath, { files, slug, rootDirectory: contentRoot }), []);
  await writeFile(publicFile, "changed-media");
  assert.ok(
    (await validateApprovedMedia(manifestPath, { files, slug, rootDirectory: contentRoot }))
      .some((error) => error.includes("SHA-256 mismatch")),
  );
});

async function preparePromotedLifecycle(contentRoot, slug = "sanitized-candidate-preview") {
  const imported = runScript("content-import.mjs", ["--input", fixturePath], contentRoot);
  assert.equal(imported.status, 0, imported.stderr);
  const reviewed = runScript("content-review.mjs", ["--slug", slug, "--authority", "test-reviewer"], contentRoot);
  assert.equal(reviewed.status, 0, reviewed.stderr);
  const promoted = runScript("content-promote.mjs", ["--slug", slug], contentRoot);
  assert.equal(promoted.status, 0, promoted.stderr);
}

function successfulReleaseFetch({ version = "v0.15.4", commit = "content-head", slug }) {
  return async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/release.json") {
      return new Response(JSON.stringify({ version, commit }), { status: 200 });
    }
    if (pathname === "/content-manifest.json") {
      return new Response(JSON.stringify({ version, commit, publishedSlugs: [slug] }), { status: 200 });
    }
    return new Response("<title>xingbuild</title>", { status: 200 });
  };
}

test("failed public verification preserves all target lifecycle files", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-finalize-failure-"));
  const slug = "sanitized-candidate-preview";
  await preparePromotedLifecycle(contentRoot, slug);
  await assert.rejects(
    verifyAndFinalizeContentRelease({
      baseUrl: "https://example.test/",
      expectedVersion: "v0.15.4",
      expectedCommit: "content-head",
      targetPath: `/observations/${slug}`,
      rootDirectory: contentRoot,
      fetchImpl: async () => new Response("unavailable", { status: 503 }),
    }),
    /HTTP home=503/,
  );
  for (const directory of ["drafts", "reviews", "recoveries"]) {
    assert.equal(
      await pathExists(path.join(contentRoot, ".content-workspace", directory, `${slug}.json`)),
      true,
    );
  }
});

test("successful public verification finalizes only the target slug", async () => {
  const contentRoot = await mkdtemp(path.join(os.tmpdir(), "xingbuild-content-finalize-success-"));
  const slug = "sanitized-candidate-preview";
  await preparePromotedLifecycle(contentRoot, slug);
  for (const directory of ["drafts", "reviews", "recoveries"]) {
    const target = path.join(contentRoot, ".content-workspace", directory);
    await writeFile(path.join(target, "unrelated.json"), `unrelated-${directory}`);
  }
  await verifyAndFinalizeContentRelease({
    baseUrl: "https://example.test/",
    expectedVersion: "v0.15.4",
    expectedCommit: "content-head",
    targetPath: `/observations/${slug}`,
    rootDirectory: contentRoot,
    fetchImpl: successfulReleaseFetch({ slug }),
  });
  for (const directory of ["drafts", "reviews", "recoveries"]) {
    assert.equal(
      await pathExists(path.join(contentRoot, ".content-workspace", directory, `${slug}.json`)),
      false,
    );
    assert.equal(
      await readFile(path.join(contentRoot, ".content-workspace", directory, "unrelated.json"), "utf8"),
      `unrelated-${directory}`,
    );
  }
});

test("production source and bundle contracts exclude local drafts", async () => {
  const repository = await readFile(path.join(root, "src", "content", "observationRepository.js"), "utf8");
  const vite = await readFile(path.join(root, "vite.config.mjs"), "utf8");
  const gitignore = await readFile(path.join(root, ".gitignore"), "utf8");
  const prepareBuild = await readFile(path.join(root, "scripts", "prepare-sites-build.mjs"), "utf8");
  assert.match(repository, /content\/observations\/\*\.json/);
  assert.doesNotMatch(repository, /\.content-workspace/);
  assert.match(vite, /apply: "serve"/);
  assert.match(gitignore, /\.content-workspace\//);
  assert.match(prepareBuild, /Production build contains workspace path/);

  const assetDirectory = path.join(root, "dist", "client", "assets");
  const assets = (await readdir(assetDirectory)).filter((name) => /\.(?:js|css)$/.test(name));
  const bundleText = (
    await Promise.all(assets.map((name) => readFile(path.join(assetDirectory, name), "utf8")))
  ).join("\n");
  assert.doesNotMatch(bundleText, /sanitized-candidate-preview|示例候选：只用于验证内容流水线/);
});

test("product and content publish scripts retain distinct safety contracts", async () => {
  const product = await readFile(path.join(root, "publish-xingbuild.command"), "utf8");
  const content = await readFile(path.join(root, "publish-content.command"), "utf8");
  assert.match(product, /npm run release:preflight/);
  assert.match(content, /--slug/);
  assert.match(content, /content:scope-check -- --slug "\$CONTENT_SLUG" --commit HEAD/);
  assert.match(content, /PARENT_COMMIT/);
  assert.match(content, /ORIGIN_COMMIT/);
  assert.match(content, /fetch origin main/);
  assert.match(content, /npm run content:check[\s\S]*content:scope-check[\s\S]*npm run build[\s\S]*npm run test:sites/);
  assert.match(content, /verify-content-release\.mjs[\s\S]*--finalize/);
  assert.doesNotMatch(content, /find \.content-workspace/);
  assert.doesNotMatch(content, /git push origin "\$HEAD_TAG"|push_with_retry "\$HEAD_TAG"/);
});

test("content publish entry hard-fails missing or invalid slug before side effects", () => {
  for (const args of [[], ["--slug", "Invalid Slug"]]) {
    const result = spawnSync("zsh", [path.join(root, "publish-content.command"), ...args], {
      cwd: root,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /Usage: .*publish-content\.command --slug <slug>/);
  }
});

test("product release readiness requires a clean, tagged, version-consistent repository", () => {
  const readyInput = {
    branch: "main",
    statusEntries: [],
    packageVersion: "0.12.2",
    versionRecord: "v0.12.2",
    currentVersion: "v0.12.2",
    headTag: "v0.12.2",
    origin: expectedOrigin,
  };
  assert.equal(evaluateProductReleaseReadiness(readyInput).ready, true);

  const blocked = evaluateProductReleaseReadiness({
    ...readyInput,
    statusEntries: [" M AGENTS.md", "?? docs/design/v0.13.0.md"],
    headTag: "v0.12.1",
  });
  assert.equal(blocked.ready, false);
  assert.equal(blocked.blockers.length, 2);
  assert.match(blocked.blockers[0], /2 项未提交修改/);
  assert.match(blocked.blockers[1], /HEAD 标签/);
});

test("release gates parse both current iteration heading conventions", () => {
  assert.equal(
    parseCurrentIterationVersion("## 当前唯一版本：`v0.22.0`"),
    "v0.22.0",
  );
  assert.equal(
    parseCurrentIterationVersion("## 当前目标版本\n\n`v0.12.2`"),
    "v0.12.2",
  );
  assert.equal(parseCurrentIterationVersion("## 其他版本\n\n`v0.22.0`"), undefined);
});

test("version closeout stops before commit when work remains outside the staged scope", () => {
  const stagedInput = {
    branch: "main",
    stagedEntries: ["scripts/release-preflight.mjs"],
    unstagedEntries: [],
    untrackedEntries: [],
    packageVersion: "0.12.2",
    versionRecord: "v0.12.2",
    currentVersion: "v0.12.2",
  };
  assert.equal(evaluateCloseoutReadiness(stagedInput).ready, true);

  const blocked = evaluateCloseoutReadiness({
    ...stagedInput,
    unstagedEntries: ["AGENTS.md"],
    untrackedEntries: ["docs/design/v0.13.0.md"],
  });
  assert.equal(blocked.ready, false);
  assert.deepEqual(blocked.blockers.slice(0, 2), [
    "仍有 1 项未暂存修改。",
    "仍有 1 项未追踪文件。",
  ]);
});

test("public content verification requires the target slug in the build manifest", async () => {
  const version = "v0.10.0";
  const commit = "0123456789abcdef";
  const html = "<!doctype html><title>xingbuild｜作品与实践</title>";
  const fetchWithManifest = (publishedSlugs) => async (input) => {
    const pathname = new URL(input).pathname;
    if (pathname === "/release.json") {
      return Response.json({ version, commit });
    }
    if (pathname === "/content-manifest.json") {
      return Response.json({ version, commit, publishedSlugs });
    }
    return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
  };

  const verified = await verifyContentReleaseOnce({
    baseUrl: "https://xingbuild.top/",
    expectedVersion: version,
    expectedCommit: commit,
    targetPath: "/observations/existing-slug",
    fetchImpl: fetchWithManifest(["existing-slug"]),
  });
  assert.equal(verified.targetSlug, "existing-slug");

  await assert.rejects(
    verifyContentReleaseOnce({
      baseUrl: "https://xingbuild.top/",
      expectedVersion: version,
      expectedCommit: commit,
      targetPath: "/observations/missing-slug",
      fetchImpl: fetchWithManifest(["existing-slug"]),
    }),
    /does not contain target slug: missing-slug/,
  );
});

test("built content manifest contains only current published slugs", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "dist", "client", "content-manifest.json"), "utf8"),
  );
  const expectedPublishedSlugs = (await readPublishedObservations())
    .map((publication) => publication.slug)
    .sort();
  assert.deepEqual([...manifest.publishedSlugs].sort(), expectedPublishedSlugs);
});
