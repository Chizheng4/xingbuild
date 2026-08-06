import assert from "node:assert/strict";
import test from "node:test";
import {
  assertProductArtifactIdentity,
  assertProductArtifactIdentityShape,
  resolveProductArtifactIdentity,
} from "../scripts/lib/product-artifact.mjs";
import { hashArtifactValue } from "../scripts/lib/base-site-artifact.mjs";
import { createContentSet, contentManifestFromContentSet } from "../scripts/lib/content-set.mjs";
import { createSiteSnapshot } from "../scripts/lib/site-snapshot.mjs";

function documents(version = "v0.26.1", commit = "a".repeat(40)) {
  const baseSiteArtifactId = `${version}-${commit.slice(0, 12)}`;
  const release = { version, commit, baseSiteArtifactId };
  const contentManifest = { version, commit, baseSiteArtifactId, publishedSlugs: [] };
  const baseSiteArtifact = {
    baseSiteArtifactId,
    productVersion: version,
    productCommit: commit,
    productArtifactContractVersion: "product-artifact-v1",
    releaseManifestHash: hashArtifactValue(release),
    artifactContentHash: hashArtifactValue({ release, contentManifest }),
    sourceBundleHash: "b".repeat(64),
  };
  return { release, contentManifest, baseSiteArtifact };
}

test("ProductArtifact adapter returns one flat identity and read-only documents", () => {
  const source = documents();
  const identity = resolveProductArtifactIdentity(source);
  assert.deepEqual(
    {
      productArtifactId: identity.productArtifactId,
      productVersion: identity.productVersion,
      productCommit: identity.productCommit,
      baseSiteArtifactId: identity.baseSiteArtifactId,
    },
    {
      productArtifactId: "v0.26.1-aaaaaaaaaaaa",
      productVersion: "v0.26.1",
      productCommit: "a".repeat(40),
      baseSiteArtifactId: "v0.26.1-aaaaaaaaaaaa",
    },
  );
  assert.equal(identity.release, undefined);
  assert.equal(identity.documents.release, source.release);
  assert.equal(Object.isFrozen(identity.documents), true);
  assert.equal(Object.isFrozen(identity.documents.release), true);
  assert.equal(assertProductArtifactIdentity(source).productArtifactHash, identity.productArtifactHash);
});

test("SiteSnapshot rejects nested or inconsistent ProductArtifact identities before assembly", () => {
  const source = documents();
  const contentSet = createContentSet({
    entries: [{ kind: "product", target: "robotaxi", contentHash: "c".repeat(64), route: "/products", sourceProof: ["fixture"], reviewProof: { status: "approved" } }],
  });
  assert.throws(
    () => createSiteSnapshot({ productArtifact: source, contentSet }),
    /identity\.productArtifactId is missing/,
  );
  const identity = resolveProductArtifactIdentity(source);
  assert.throws(
    () => createSiteSnapshot({ productArtifact: { ...identity, productCommit: "d".repeat(40) }, contentSet }),
    /ProductArtifact identity tuple mismatch/,
  );
  assert.throws(
    () => assertProductArtifactIdentityShape({ ...identity, baseSiteArtifactId: "v0.26.1-bbbbbbbbbbbb" }),
    /ProductArtifact identity tuple mismatch/,
  );
});

test("the same normalized ProductArtifact and ContentSet produce one stable SiteSnapshot", () => {
  const identity = resolveProductArtifactIdentity(documents());
  const contentSet = createContentSet({
    entries: [{ kind: "profile", target: "about", contentHash: "e".repeat(64), route: "/about", sourceProof: ["fixture"], reviewProof: { status: "approved" } }],
  });
  const first = createSiteSnapshot({ productArtifact: identity, contentSet, createdAt: "2026-08-06T00:00:00.000Z" });
  const second = createSiteSnapshot({ productArtifact: identity, contentSet, createdAt: "2027-08-06T00:00:00.000Z" });
  assert.equal(first.siteSnapshotId, second.siteSnapshotId);
  assert.equal(first.snapshotHash, second.snapshotHash);
  assert.equal(first.productArtifact.productArtifactHash, identity.productArtifactHash);
});

test("ContentSet manifest refuses to infer identity from nested ProductArtifact documents", () => {
  const contentSet = createContentSet({
    entries: [{ kind: "profile", target: "about", contentHash: "f".repeat(64), route: "/about", sourceProof: ["fixture"], reviewProof: { status: "approved" } }],
  });
  assert.throws(
    () => contentManifestFromContentSet(contentSet, { productArtifact: { release: { version: "v0.26.1", commit: "a".repeat(40) } } }),
    /normalized ProductArtifact identity/,
  );
});
