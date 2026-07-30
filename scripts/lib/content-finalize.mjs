import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  assertValidObservation,
  assertValidSlug,
  hashFile,
  isFile,
  projectRoot,
} from "./observation-content.mjs";

export async function finalizeReleasedContent(slug, { rootDirectory = projectRoot } = {}) {
  assertValidSlug(slug);
  const workspace = path.join(rootDirectory, ".content-workspace");
  const files = {
    draft: path.join(workspace, "drafts", `${slug}.json`),
    review: path.join(workspace, "reviews", `${slug}.json`),
    recovery: path.join(workspace, "recoveries", `${slug}.json`),
    publication: path.join(rootDirectory, "content", "observations", `${slug}.json`),
  };

  for (const [kind, file] of Object.entries(files)) {
    if (!(await isFile(file))) throw new Error(`Cannot finalize ${slug}: ${kind} file is missing`);
  }

  const [draftText, reviewText, publicationText] = await Promise.all([
    readFile(files.draft, "utf8"),
    readFile(files.review, "utf8"),
    readFile(files.publication, "utf8"),
  ]);
  const draft = assertValidObservation(JSON.parse(draftText), { expectedStatus: "draft" });
  const publication = assertValidObservation(JSON.parse(publicationText), { expectedStatus: "published" });
  const review = JSON.parse(reviewText);
  if (draft.slug !== slug || publication.slug !== slug || review.slug !== slug) {
    throw new Error(`Cannot finalize ${slug}: lifecycle slug mismatch`);
  }
  if (review.status !== "approved" || !/^[a-f0-9]{64}$/.test(review.contentHash || "")) {
    throw new Error(`Cannot finalize ${slug}: approved review hash is invalid`);
  }
  const [draftHash, recoveryHash] = await Promise.all([
    hashFile(files.draft),
    hashFile(files.recovery),
  ]);
  if (draftHash !== review.contentHash || recoveryHash !== review.contentHash) {
    throw new Error(`Cannot finalize ${slug}: lifecycle hash mismatch`);
  }

  await Promise.all([unlink(files.draft), unlink(files.review), unlink(files.recovery)]);
  return {
    slug,
    removed: [files.draft, files.review, files.recovery],
  };
}
