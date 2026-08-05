const FORMAL_HOSTS = new Set(["xingbuild.top", "www.xingbuild.top"]);
const REQUEST_FIELDS = new Set([
  "site_code",
  "visitor_seed",
  "device_type",
  "website_version",
]);
const VISITOR_SEED_PATTERN = /^[A-Za-z0-9-]{16,100}$/;
const VERSION_PATTERN = /^v\d+\.\d+\.\d+$/;
const VISIT_KEY_PATTERN = /^visit_(?:XINGBUILD|ROBOTAXI)_(\d{8})_[a-f0-9]{24}$/;
const MAX_CLEANUP_DELETES = 32;
const ROBOTAXI_RELEASE_ENDPOINT = "https://robotaxi.xingbuild.top/deployment-manifest.json";

function jsonResponse(body, status) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function robotaxiReleaseResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=300, stale-while-revalidate=86400" : "no-store",
    },
  });
}

function projectRobotaxiRelease(payload) {
  if (!payload || typeof payload !== "object" || !/^v\d+\.\d+\.\d+$/.test(payload.version || "") || !/^[a-f0-9]{40}$/.test(payload.commit || "")) return null;
  if (payload.production_url !== ROBOTAXI_RELEASE_ENDPOINT.replace("/deployment-manifest.json", "/")) return null;
  return {
    version: payload.version,
    commit: payload.commit,
    production_url: payload.production_url,
    verifiedAt: new Date().toISOString(),
  };
}

async function readRobotaxiRelease() {
  const response = await fetch(ROBOTAXI_RELEASE_ENDPOINT, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) throw new Error(`upstream returned ${response.status}`);
  const release = projectRobotaxiRelease(await response.json());
  if (!release) throw new Error("upstream identity failed validation");
  return release;
}

function hasExcludedCookie(request) {
  return (request.headers.get("cookie") || "")
    .split(";")
    .some((part) => part.trim() === "xingbuild_visit_excluded=1");
}

function shanghaiDateParts(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

function visitDate(date) {
  const parts = shanghaiDateParts(date);
  return {
    display: `${parts.year}-${parts.month}-${parts.day}`,
    compact: `${parts.year}${parts.month}${parts.day}`,
  };
}

function cleanupCutoff(compactDate) {
  const year = Number(compactDate.slice(0, 4));
  const month = Number(compactDate.slice(4, 6));
  const day = Number(compactDate.slice(6, 8));
  const cutoff = new Date(Date.UTC(year, month - 1, day - 30));
  return cutoff.toISOString().slice(0, 10).replaceAll("-", "");
}

async function hmacIdentifier(secret, siteCode, visitorSeed) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${siteCode}|${visitorSeed}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

async function cleanupExpiredVisits(visitKv, todayCompact) {
  const result = await visitKv.list({ prefix: "visit_", limit: 64 });
  const cutoff = cleanupCutoff(todayCompact);
  const expired = (result?.keys || [])
    .map((item) => item.key)
    .filter((key) => {
      const match = VISIT_KEY_PATTERN.exec(key);
      return match && match[1] < cutoff;
    })
    .slice(0, MAX_CLEANUP_DELETES);
  await Promise.all(expired.map((key) => visitKv.delete(key)));
}

function validateQualificationRequest(request, body) {
  const url = new URL(request.url);
  if (
    request.method !== "POST"
    || url.protocol !== "https:"
    || !FORMAL_HOSTS.has(url.hostname.toLowerCase())
  ) {
    return "formal-origin-required";
  }
  if (hasExcludedCookie(request)) return "excluded-device";
  if (!body || typeof body !== "object" || Array.isArray(body)) return "invalid-body";
  if (
    Object.keys(body).length !== REQUEST_FIELDS.size
    || Object.keys(body).some((field) => !REQUEST_FIELDS.has(field))
  ) {
    return "invalid-fields";
  }
  if (body.site_code !== "XINGBUILD") return "invalid-site";
  if (!VISITOR_SEED_PATTERN.test(body.visitor_seed || "")) return "invalid-seed";
  if (!["DESKTOP", "MOBILE"].includes(body.device_type)) return "invalid-device";
  if (!VERSION_PATTERN.test(body.website_version || "")) return "invalid-version";
  return null;
}

export async function handleVisitQualification(request, env, {
  now = () => new Date(),
} = {}) {
  if (!env.visitKv || typeof env.visitHashSecret !== "string" || env.visitHashSecret.length < 24) {
    return jsonResponse({ error: "visit-service-unconfigured" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid-json" }, 400);
  }
  const validationError = validateQualificationRequest(request, body);
  if (validationError) return jsonResponse({ error: validationError }, 400);

  const timestamp = now();
  const qualifiedAt = timestamp.toISOString();
  const qualifiedDate = visitDate(timestamp);
  const visitorIdentifier = await hmacIdentifier(
    env.visitHashSecret,
    body.site_code,
    body.visitor_seed,
  );
  const key = `visit_${body.site_code}_${qualifiedDate.compact}_${visitorIdentifier}`;

  await cleanupExpiredVisits(env.visitKv, qualifiedDate.compact);
  const existing = await env.visitKv.get(key, { type: "json" });
  const record = {
    site_code: body.site_code,
    qualified_date: qualifiedDate.compact,
    visitor_identifier: visitorIdentifier,
    first_qualified_at:
      typeof existing?.first_qualified_at === "string"
        ? existing.first_qualified_at
        : qualifiedAt,
    last_qualified_at: qualifiedAt,
    device_type: body.device_type,
    website_version: body.website_version,
  };
  await env.visitKv.put(key, JSON.stringify(record));
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/__xingbuild/robotaxi-release" || url.pathname === "/api/robotaxi-release") {
      if (request.method !== "GET" && request.method !== "HEAD") return robotaxiReleaseResponse({ error: "method-not-allowed" }, 405);
      try {
        const release = await readRobotaxiRelease();
        return robotaxiReleaseResponse(release);
      } catch (error) {
        return robotaxiReleaseResponse({ error: "robotaxi-release-unavailable", detail: error.message }, 502);
      }
    }
    if (url.pathname === "/api/visits/qualify") {
      return handleVisitQualification(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
