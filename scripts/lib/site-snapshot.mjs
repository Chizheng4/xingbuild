import { createHash } from "node:crypto";
import { contentManifestFromContentSet, validateContentSet } from "./content-set.mjs";
import { assertProductArtifactIdentityShape, PRODUCT_ARTIFACT_IDENTITY_FIELDS } from "./product-artifact.mjs";

export const SITE_SNAPSHOT_SCHEMA_VERSION = "site-snapshot-v1";

function canonical(value) {
  return JSON.stringify(value);
}
export function hashSiteSnapshotValue(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`SiteSnapshot ${field} is required`);
  return value;
}

export function productArtifactIdentity(productArtifact = {}) {
  assertProductArtifactIdentityShape(productArtifact);
  return Object.fromEntries(PRODUCT_ARTIFACT_IDENTITY_FIELDS
    .filter((field) => productArtifact[field] != null)
    .map((field) => [field, productArtifact[field]]));
}

function snapshotIdentity({ productArtifact, contentSet, contentManifest }) {
  return {
    schemaVersion: SITE_SNAPSHOT_SCHEMA_VERSION,
    productArtifact: productArtifactIdentity(productArtifact),
    contentSetId: contentSet.contentSetId,
    contentSetHash: contentSet.contentSetHash,
    contentManifest,
  };
}

export function createSiteSnapshot({ productArtifact, contentSet, previousSnapshotId = null, createdAt = new Date().toISOString() } = {}) {
  validateContentSet(contentSet);
  const product = productArtifactIdentity(productArtifact);
  const contentManifest = contentManifestFromContentSet(contentSet, { productArtifact: product });
  const identity = snapshotIdentity({ productArtifact: product, contentSet, contentManifest });
  const snapshotHash = hashSiteSnapshotValue(identity);
  const siteSnapshotId = `site-snapshot-${snapshotHash}`;
  const snapshot = {
    ...identity,
    siteSnapshotId,
    snapshotHash,
    previousSnapshotId: previousSnapshotId || null,
    createdAt,
    state: "assembled",
  };
  assertSiteSnapshotIdentity(snapshot);
  return snapshot;
}

export function assertSiteSnapshotIdentity(snapshot = {}) {
  if (snapshot.schemaVersion !== SITE_SNAPSHOT_SCHEMA_VERSION) throw new Error("SiteSnapshot schemaVersion is invalid");
  text(snapshot.siteSnapshotId, "siteSnapshotId");
  if (!/^site-snapshot-[a-f0-9]{64}$/.test(snapshot.siteSnapshotId)) throw new Error("SiteSnapshot siteSnapshotId is invalid");
  if (!/^[a-f0-9]{64}$/.test(snapshot.snapshotHash || "")) throw new Error("SiteSnapshot snapshotHash must be SHA-256");
  const contentSet = {
    schemaVersion: "content-set-v1",
    contentSetId: snapshot.contentSetId,
    contentSetHash: snapshot.contentSetHash,
    previousContentSetId: snapshot.contentManifest?.previousContentSetId || null,
    entries: snapshot.contentManifest?.contentEntries || [],
    migration: snapshot.contentManifest?.migration || { source: "normal-operation" },
    createdAt: snapshot.contentManifest?.createdAt || snapshot.createdAt,
  };
  // The complete ContentSet is not embedded in every snapshot; the identity
  // check below is intentionally based on the immutable fields that are
  // present in the snapshot.  Callers that have the full set validate it at
  // assembly time.
  const product = productArtifactIdentity(snapshot.productArtifact);
  const identity = snapshotIdentity({ productArtifact: product, contentSet: { contentSetId: snapshot.contentSetId, contentSetHash: snapshot.contentSetHash }, contentManifest: snapshot.contentManifest });
  const expected = hashSiteSnapshotValue(identity);
  if (expected !== snapshot.snapshotHash || snapshot.siteSnapshotId !== `site-snapshot-${expected}`) throw new Error("SiteSnapshot identity hash drift");
  text(snapshot.createdAt, "createdAt");
  return snapshot;
}

export function assertSiteSnapshotTuple(snapshot, { productArtifactId, contentSetId, contentSetHash } = {}) {
  assertSiteSnapshotIdentity(snapshot);
  if (productArtifactId != null && snapshot.productArtifact.productArtifactId !== productArtifactId) throw new Error("SiteSnapshot ProductArtifact identity mismatch");
  if (contentSetId != null && snapshot.contentSetId !== contentSetId) throw new Error("SiteSnapshot ContentSet identity mismatch");
  if (contentSetHash != null && snapshot.contentSetHash !== contentSetHash) throw new Error("SiteSnapshot ContentSet hash mismatch");
  return true;
}
