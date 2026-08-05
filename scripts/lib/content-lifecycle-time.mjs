/**
 * Lifecycle time semantics for logical content and physical revisions.
 *
 * `publishedAt` is kept as a compatibility projection of the logical
 * content's first publication. It is never used as a revision completion
 * timestamp for a candidate package.
 */

export const CONTENT_LIFECYCLE_TIME_FIELDS = Object.freeze([
  "firstPublishedAt",
  "revisionReleasedAt",
  "publishedAt",
]);

function requiredTimestamp(value, field, location) {
  if (value == null) return null;
  if (typeof value !== "string" || !value) {
    throw new Error(`content lifecycle ${field} is invalid: ${location}`);
  }
  return value;
}

function locationFor(record, fallback) {
  return record?.packageDirectory || record?.contentReleaseId || record?.target || fallback;
}

function ownFirstPublishedAt(record, location) {
  const firstPublishedAt = requiredTimestamp(record?.firstPublishedAt, "firstPublishedAt", location);
  const legacyPublishedAt = requiredTimestamp(record?.publishedAt, "publishedAt", location);
  if (firstPublishedAt && legacyPublishedAt && firstPublishedAt !== legacyPublishedAt) {
    throw new Error(`content lifecycle firstPublishedAt drift: ${location}`);
  }
  return firstPublishedAt || legacyPublishedAt || null;
}

/**
 * Resolve lifecycle timestamps without mutating the supplied record.
 *
 * During preparation/replacement, a candidate may have no time fields. When
 * an active logical record is supplied, its first publication is inherited.
 * During finalization, a single supplied clock value is used for every newly
 * generated timestamp, preserving deterministic tests and atomic semantics.
 */
export function resolveContentLifecycleTimes(record = {}, {
  activeRecord = null,
  finalize = false,
  now = () => new Date().toISOString(),
} = {}) {
  const location = locationFor(record, "content lifecycle");
  const ownFirst = ownFirstPublishedAt(record, location);
  const activeFirst = activeRecord ? ownFirstPublishedAt(activeRecord, locationFor(activeRecord, location)) : null;
  if (ownFirst && activeFirst && ownFirst !== activeFirst) {
    throw new Error(`content lifecycle firstPublishedAt drift: ${location}`);
  }

  const candidateRevision = requiredTimestamp(record?.revisionReleasedAt, "revisionReleasedAt", location);
  const inheritedFirst = ownFirst || activeFirst || null;
  if (!finalize) {
    return {
      firstPublishedAt: inheritedFirst,
      revisionReleasedAt: candidateRevision,
      publishedAt: inheritedFirst,
    };
  }

  const generatedAt = now();
  requiredTimestamp(generatedAt, "finalize timestamp", location);
  const firstPublishedAt = inheritedFirst || generatedAt;
  const revisionReleasedAt = candidateRevision || generatedAt;
  return {
    firstPublishedAt,
    revisionReleasedAt,
    publishedAt: firstPublishedAt,
  };
}

export function withContentLifecycleTimes(record = {}, options = {}) {
  return { ...record, ...resolveContentLifecycleTimes(record, options) };
}

/**
 * Compare a persisted/public projection with its expected lifecycle facts.
 * Legacy projections may omit the new fields and retain only `publishedAt`.
 * A known expected revision timestamp, however, must never disappear.
 */
export function assertContentLifecycleProjection(actual, expected, location = "content lifecycle projection") {
  const expectedTimes = resolveContentLifecycleTimes(expected, { now: () => "1970-01-01T00:00:00.000Z" });
  const actualTimes = resolveContentLifecycleTimes(actual, { now: () => "1970-01-01T00:00:00.000Z" });
  const expectedDeclaresLifecycle = Object.hasOwn(expected || {}, "firstPublishedAt") || Object.hasOwn(expected || {}, "revisionReleasedAt");
  const actualDeclaresLifecycle = Object.hasOwn(actual || {}, "firstPublishedAt") || Object.hasOwn(actual || {}, "revisionReleasedAt");
  if (expectedDeclaresLifecycle && !actualDeclaresLifecycle) {
    throw new Error(`content lifecycle fields are missing from projection: ${location}`);
  }
  if (actualDeclaresLifecycle) {
    for (const field of ["firstPublishedAt", "revisionReleasedAt", "publishedAt"]) {
      if ((actual[field] ?? null) !== (expectedTimes[field] ?? null)) {
        throw new Error(`content lifecycle ${field} projection drift: ${location}`);
      }
    }
  }
  if (expectedTimes.firstPublishedAt !== actualTimes.firstPublishedAt) {
    throw new Error(`content lifecycle firstPublishedAt projection drift: ${location}`);
  }
  if (expectedTimes.revisionReleasedAt && expectedTimes.revisionReleasedAt !== actualTimes.revisionReleasedAt) {
    throw new Error(`content lifecycle revisionReleasedAt projection drift: ${location}`);
  }
  if (actualTimes.publishedAt !== actualTimes.firstPublishedAt) {
    throw new Error(`content lifecycle publishedAt projection drift: ${location}`);
  }
  return actualTimes;
}
