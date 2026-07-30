import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  isVisitQualificationEligible,
  startVisitQualification,
} from "../src/lib/visitQualification.js";
import {
  handleVisitQualification,
} from "../worker/index.js";

class FakeDocument {
  constructor() {
    this.visibilityState = "visible";
    this.cookie = "";
    this.listeners = new Set();
  }

  addEventListener(name, listener) {
    if (name === "visibilitychange") this.listeners.add(listener);
  }

  removeEventListener(name, listener) {
    if (name === "visibilitychange") this.listeners.delete(listener);
  }

  setVisibility(value) {
    this.visibilityState = value;
    for (const listener of this.listeners) listener();
  }
}

function fakeScheduler() {
  let current = 0;
  let nextId = 1;
  const timers = new Map();
  return {
    now: () => current,
    setTimer(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, due: current + delay });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    advance(milliseconds) {
      const target = current + milliseconds;
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.due <= target)
          .sort((left, right) => left[1].due - right[1].due)[0];
        if (!next) break;
        current = next[1].due;
        timers.delete(next[0]);
        next[1].callback();
      }
      current = target;
    },
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

function browserFixture({ mobile = false } = {}) {
  const document = new FakeDocument();
  const scheduler = fakeScheduler();
  const storage = memoryStorage();
  const calls = [];
  const window = {
    location: { protocol: "https:", hostname: "xingbuild.top" },
    matchMedia: () => ({ matches: mobile }),
  };
  const navigator = { webdriver: false, userAgent: "Mozilla/5.0" };
  const crypto = {
    getRandomValues(bytes) {
      bytes.fill(7);
      return bytes;
    },
  };
  const fetch = async (...args) => {
    calls.push(args);
    return new Response(null, { status: 204 });
  };
  return {
    document,
    scheduler,
    storage,
    calls,
    window,
    navigator,
    crypto,
    fetch,
  };
}

test("visible time qualifies once after 15 seconds and hidden time does not accumulate", () => {
  const fixture = browserFixture();
  const stop = startVisitQualification({
    ...fixture,
    now: fixture.scheduler.now,
    setTimer: fixture.scheduler.setTimer,
    clearTimer: fixture.scheduler.clearTimer,
    websiteVersion: "v0.15.8",
  });

  fixture.scheduler.advance(10_000);
  fixture.document.setVisibility("hidden");
  fixture.scheduler.advance(20_000);
  assert.equal(fixture.calls.length, 0);
  fixture.document.setVisibility("visible");
  fixture.scheduler.advance(4_999);
  assert.equal(fixture.calls.length, 0);
  fixture.scheduler.advance(1);
  assert.equal(fixture.calls.length, 1);
  fixture.scheduler.advance(60_000);
  assert.equal(fixture.calls.length, 1);

  const [url, options] = fixture.calls[0];
  assert.equal(url, "/api/visits/qualify");
  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "same-origin");
  assert.equal(options.keepalive, true);
  assert.deepEqual(Object.keys(JSON.parse(options.body)).sort(), [
    "device_type",
    "site_code",
    "visitor_seed",
    "website_version",
  ]);
  assert.deepEqual(JSON.parse(options.body), {
    site_code: "XINGBUILD",
    visitor_seed: "07".repeat(24),
    device_type: "DESKTOP",
    website_version: "v0.15.8",
  });
  stop();
});

test("mobile classification uses the same independent origin seed", () => {
  const fixture = browserFixture({ mobile: true });
  startVisitQualification({
    ...fixture,
    now: fixture.scheduler.now,
    setTimer: fixture.scheduler.setTimer,
    clearTimer: fixture.scheduler.clearTimer,
    websiteVersion: "v0.15.8",
  });
  fixture.scheduler.advance(15_000);
  const payload = JSON.parse(fixture.calls[0][1].body);
  assert.equal(payload.device_type, "MOBILE");
  assert.match(payload.visitor_seed, /^[A-Za-z0-9-]{16,100}$/);
  assert.equal(fixture.storage.values.size, 1);
});

test("localhost, preview-like hosts, webdriver, QA markers and exclusion cookie never qualify", () => {
  const cases = [
    { hostname: "localhost" },
    { hostname: "127.0.0.1" },
    { hostname: "xingbuild-preview.edgeone.dev" },
    { hostname: "xingbuild.top", webdriver: true },
    { hostname: "xingbuild.top", verifyBrowserLoad: true },
    { hostname: "xingbuild.top", cookie: "xingbuild_visit_excluded=1" },
  ];
  for (const item of cases) {
    const fixture = browserFixture();
    fixture.window.location.hostname = item.hostname;
    fixture.navigator.webdriver = item.webdriver || false;
    fixture.window.verifyBrowserLoad = item.verifyBrowserLoad || false;
    fixture.document.cookie = item.cookie || "";
    assert.equal(isVisitQualificationEligible({
      location: fixture.window.location,
      document: fixture.document,
      navigator: fixture.navigator,
      window: fixture.window,
    }), false);
    startVisitQualification({
      ...fixture,
      now: fixture.scheduler.now,
      setTimer: fixture.scheduler.setTimer,
      clearTimer: fixture.scheduler.clearTimer,
    });
    fixture.scheduler.advance(60_000);
    assert.equal(fixture.calls.length, 0);
    assert.equal(fixture.storage.values.size, 0);
  }
});

function memoryKv(initial = {}) {
  const values = new Map(Object.entries(initial));
  const calls = { get: [], put: [], list: [], delete: [] };
  return {
    values,
    calls,
    async get(key) {
      calls.get.push(key);
      const value = values.get(key);
      return value === undefined ? null : JSON.parse(value);
    },
    async put(key, value) {
      calls.put.push([key, value]);
      values.set(key, value);
    },
    async list(options) {
      calls.list.push(options);
      return {
        complete: true,
        cursor: null,
        keys: [...values.keys()]
          .filter((key) => !options.prefix || key.startsWith(options.prefix))
          .sort()
          .slice(0, options.limit)
          .map((key) => ({ key })),
      };
    },
    async delete(key) {
      calls.delete.push(key);
      values.delete(key);
    },
  };
}

const secret = "0123456789abcdef0123456789abcdef";
const validBody = {
  site_code: "XINGBUILD",
  visitor_seed: "visitor-seed-1234567890",
  device_type: "DESKTOP",
  website_version: "v0.15.8",
};

function qualifyRequest(body = validBody, options = {}) {
  return new Request(options.url || "https://xingbuild.top/api/visits/qualify", {
    method: options.method || "POST",
    headers: {
      "content-type": "application/json",
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: options.method === "GET" ? undefined : JSON.stringify(body),
  });
}

test("qualify stores exactly seven fields under the shared HMAC daily key", async () => {
  const visitKv = memoryKv();
  const now = new Date("2026-07-30T16:30:00.000Z");
  const response = await handleVisitQualification(
    qualifyRequest(),
    { visitKv, visitHashSecret: secret },
    { now: () => now },
  );
  assert.equal(response.status, 204);
  const identifier = createHmac("sha256", secret)
    .update(`XINGBUILD|${validBody.visitor_seed}`)
    .digest("hex")
    .slice(0, 24);
  const key = `visit_XINGBUILD_20260731_${identifier}`;
  const record = JSON.parse(visitKv.values.get(key));
  assert.deepEqual(Object.keys(record), [
    "site_code",
    "qualified_date",
    "visitor_identifier",
    "first_qualified_at",
    "last_qualified_at",
    "device_type",
    "website_version",
  ]);
  assert.deepEqual(record, {
    site_code: "XINGBUILD",
    qualified_date: "20260731",
    visitor_identifier: identifier,
    first_qualified_at: now.toISOString(),
    last_qualified_at: now.toISOString(),
    device_type: "DESKTOP",
    website_version: "v0.15.8",
  });
});

test("same visitor and Shanghai day updates one record without changing first qualification", async () => {
  const visitKv = memoryKv();
  const first = new Date("2026-07-30T04:00:00.000Z");
  const second = new Date("2026-07-30T12:00:00.000Z");
  await handleVisitQualification(
    qualifyRequest(),
    { visitKv, visitHashSecret: secret },
    { now: () => first },
  );
  await handleVisitQualification(
    qualifyRequest({ ...validBody, device_type: "MOBILE" }),
    { visitKv, visitHashSecret: secret },
    { now: () => second },
  );
  assert.equal(visitKv.values.size, 1);
  const record = JSON.parse([...visitKv.values.values()][0]);
  assert.equal(record.first_qualified_at, first.toISOString());
  assert.equal(record.last_qualified_at, second.toISOString());
  assert.equal(record.device_type, "MOBILE");
});

test("qualification performs bounded 30-day cleanup without touching invalid or recent keys", async () => {
  const oldKey = `visit_XINGBUILD_20260629_${"a".repeat(24)}`;
  const cutoffKey = `visit_ROBOTAXI_20260630_${"b".repeat(24)}`;
  const invalidKey = "visit_unrelated";
  const visitKv = memoryKv({
    [oldKey]: "{}",
    [cutoffKey]: "{}",
    [invalidKey]: "{}",
  });
  await handleVisitQualification(
    qualifyRequest(),
    { visitKv, visitHashSecret: secret },
    { now: () => new Date("2026-07-30T08:00:00.000Z") },
  );
  assert.deepEqual(visitKv.calls.list, [{ prefix: "visit_", limit: 64 }]);
  assert.deepEqual(visitKv.calls.delete, [oldKey]);
  assert.equal(visitKv.values.has(cutoffKey), true);
  assert.equal(visitKv.values.has(invalidKey), true);
});

test("invalid origin, excluded device, wrong site and missing bindings never write KV", async () => {
  const cases = [
    qualifyRequest(validBody, { url: "http://localhost/api/visits/qualify" }),
    qualifyRequest(validBody, { url: "https://preview.edgeone.dev/api/visits/qualify" }),
    qualifyRequest(validBody, { cookie: "xingbuild_visit_excluded=1" }),
    qualifyRequest({ ...validBody, site_code: "ROBOTAXI" }),
    qualifyRequest({ ...validBody, extra: "not-allowed" }),
  ];
  for (const request of cases) {
    const visitKv = memoryKv();
    const response = await handleVisitQualification(
      request,
      { visitKv, visitHashSecret: secret },
    );
    assert.equal(response.status, 400);
    assert.equal(visitKv.calls.put.length, 0);
    assert.equal(visitKv.calls.list.length, 0);
  }

  const response = await handleVisitQualification(qualifyRequest(), {});
  assert.equal(response.status, 503);
});
