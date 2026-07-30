import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, link, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertNoTargetWorkspaceConflicts,
  assertTargetWorkspaceReady,
  assertUniqueProductionIdentity,
  assertValidObservation,
  assertValidSlug,
  draftsDirectory,
  hashFile,
  isFile,
  publishedDirectory,
  readJson,
  recoveriesDirectory,
  reviewsDirectory,
} from "./observation-content.mjs";

function assertAuthority(authority) {
  if (typeof authority !== "string" || !authority.trim()) {
    throw new Error("Review authority is required");
  }
  return authority.trim();
}

function targetPaths(slug) {
  return {
    draftFile: path.join(draftsDirectory, `${slug}.json`),
    reviewFile: path.join(reviewsDirectory, `${slug}.json`),
    recoveryFile: path.join(recoveriesDirectory, `${slug}.json`),
    publishedFile: path.join(publishedDirectory, `${slug}.json`),
  };
}

async function prepareDraftReview(slug, authority, { requireClearTarget = false } = {}) {
  assertValidSlug(slug);
  const normalizedAuthority = assertAuthority(authority);
  if (requireClearTarget) await assertNoTargetWorkspaceConflicts(slug);
  const paths = targetPaths(slug);
  if (!(await isFile(paths.draftFile))) throw new Error(`Draft not found: ${slug}`);
  if (await isFile(paths.reviewFile)) throw new Error(`Review already exists: ${slug}`);
  const draft = assertValidObservation(await readJson(paths.draftFile), { expectedStatus: "draft" });
  if (draft.slug !== slug) throw new Error(`Draft slug must be ${slug}`);
  const draftHash = await hashFile(paths.draftFile);
  return {
    ...paths,
    draft,
    review: {
      slug,
      status: "approved",
      reviewedAt: new Date().toISOString(),
      authority: normalizedAuthority,
      contentHash: draftHash,
    },
  };
}

async function assertPromotionDestinationAvailable(slug, draft, paths) {
  if (await isFile(paths.publishedFile)) {
    throw new Error(`Published observation already exists: ${slug}`);
  }
  if (await isFile(paths.recoveryFile)) throw new Error(`Recovery already exists: ${slug}`);
  await assertUniqueProductionIdentity(draft);
}

async function rollbackCreatedFiles(createdFiles) {
  const errors = [];
  for (const file of [...createdFiles].reverse()) {
    try {
      await unlink(file);
    } catch (error) {
      if (error.code !== "ENOENT") errors.push(`${file}: ${error.message}`);
    }
  }
  if (errors.length) throw new Error(`Rollback failed:\n${errors.join("\n")}`);
}

async function writeProductionAtomically(file, value) {
  const temporaryFile = path.join(
    path.dirname(file),
    `.${path.basename(file)}.${process.pid}.${randomUUID()}.tmp`,
  );
  await writeFile(temporaryFile, value, { flag: "wx" });
  let linked = false;
  try {
    await link(temporaryFile, file);
    linked = true;
  } finally {
    try {
      await unlink(temporaryFile);
    } catch (cleanupError) {
      if (linked) {
        try {
          await unlink(file);
        } catch (rollbackError) {
          throw new Error(
            `Atomic production cleanup failed: ${cleanupError.message}; target rollback failed: ${rollbackError.message}`,
          );
        }
      }
      throw cleanupError;
    }
  }
}

async function writeApprovalTransaction(
  prepared,
  { includeReview, preserveRecoveryOnFailure = false },
) {
  const createdFiles = [];
  try {
    if (includeReview) {
      await mkdir(reviewsDirectory, { recursive: true });
      await writeFile(
        prepared.reviewFile,
        `${JSON.stringify(prepared.review, null, 2)}\n`,
        { flag: "wx" },
      );
      createdFiles.push(prepared.reviewFile);
    }
    await mkdir(recoveriesDirectory, { recursive: true });
    await copyFile(prepared.draftFile, prepared.recoveryFile, constants.COPYFILE_EXCL);
    createdFiles.push(prepared.recoveryFile);
    if (await hashFile(prepared.recoveryFile) !== prepared.review.contentHash) {
      throw new Error(`Draft changed during approval transaction: ${prepared.review.slug}`);
    }
    await mkdir(publishedDirectory, { recursive: true });
    await writeProductionAtomically(
      prepared.publishedFile,
      `${JSON.stringify({ ...prepared.draft, status: "published" }, null, 2)}\n`,
    );
    createdFiles.push(prepared.publishedFile);
  } catch (error) {
    if (preserveRecoveryOnFailure && createdFiles.includes(prepared.recoveryFile)) {
      throw new Error(`Promotion failed after recovery was preserved: ${error.message}`);
    }
    try {
      await rollbackCreatedFiles(createdFiles);
    } catch (rollbackError) {
      throw new Error(`${error.message}\n${rollbackError.message}`);
    }
    throw error;
  }
}

export async function recordApprovedReview(slug, authority) {
  const prepared = await prepareDraftReview(slug, authority);
  await mkdir(reviewsDirectory, { recursive: true });
  await writeFile(
    prepared.reviewFile,
    `${JSON.stringify(prepared.review, null, 2)}\n`,
    { flag: "wx" },
  );
  return prepared;
}

export async function promoteApprovedDraft(slug) {
  assertValidSlug(slug);
  const reviewed = await assertTargetWorkspaceReady(slug);
  const paths = targetPaths(slug);
  await assertPromotionDestinationAvailable(slug, reviewed.draft, paths);
  const prepared = { ...paths, ...reviewed };
  await writeApprovalTransaction(prepared, {
    includeReview: false,
    preserveRecoveryOnFailure: true,
  });
  return prepared;
}

export async function approveAndPromoteDraft(slug, authority) {
  const prepared = await prepareDraftReview(slug, authority, { requireClearTarget: true });
  await assertPromotionDestinationAvailable(slug, prepared.draft, prepared);
  await writeApprovalTransaction(prepared, { includeReview: true });
  return prepared;
}
