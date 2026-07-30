const VISITOR_SEED_KEY = "xingbuild_visitor_seed";
const QUALIFICATION_MS = 15_000;
const FORMAL_HOSTS = new Set(["xingbuild.top", "www.xingbuild.top"]);
const SEED_PATTERN = /^[A-Za-z0-9-]{16,100}$/;

function hasExcludedCookie(cookie = "") {
  return cookie
    .split(";")
    .some((part) => part.trim() === "xingbuild_visit_excluded=1");
}

export function isVisitQualificationEligible({
  location,
  document,
  navigator,
  window,
}) {
  if (location?.protocol !== "https:" || !FORMAL_HOSTS.has(location?.hostname?.toLowerCase())) {
    return false;
  }
  if (hasExcludedCookie(document?.cookie)) return false;
  if (navigator?.webdriver) return false;
  const userAgent = navigator?.userAgent?.toLowerCase() || "";
  if (userAgent.includes("headlesschrome") || userAgent.includes("playwright")) return false;
  if (window?.verifyBrowserLoad || window?.__verifyBrowserLoad) return false;
  return true;
}

function readOrCreateVisitorSeed(storage, crypto) {
  try {
    const existing = storage.getItem(VISITOR_SEED_KEY);
    if (SEED_PATTERN.test(existing || "")) return existing;
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const seed = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    storage.setItem(VISITOR_SEED_KEY, seed);
    return seed;
  } catch {
    return null;
  }
}

function deviceType(window) {
  return window.matchMedia?.("(pointer: coarse)")?.matches ? "MOBILE" : "DESKTOP";
}

export function startVisitQualification({
  window = globalThis.window,
  document = globalThis.document,
  navigator = globalThis.navigator,
  fetch = globalThis.fetch,
  storage = globalThis.localStorage,
  crypto = globalThis.crypto,
  now = () => performance.now(),
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
  qualificationMs = QUALIFICATION_MS,
  websiteVersion = typeof __XINGBUILD_VERSION__ === "string"
    ? __XINGBUILD_VERSION__
    : "v0.0.0",
} = {}) {
  if (!isVisitQualificationEligible({
    location: window?.location,
    document,
    navigator,
    window,
  })) {
    return () => {};
  }

  let remainingMs = qualificationMs;
  let visibleSince = null;
  let timer = null;
  let stopped = false;
  let qualified = false;

  const stopTimer = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
  };

  const detach = () => {
    stopTimer();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  const qualify = () => {
    if (stopped || qualified) return;
    qualified = true;
    detach();
    const visitorSeed = readOrCreateVisitorSeed(storage, crypto);
    if (!visitorSeed) return;
    void fetch("/api/visits/qualify", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        site_code: "XINGBUILD",
        visitor_seed: visitorSeed,
        device_type: deviceType(window),
        website_version: websiteVersion,
      }),
    }).catch(() => {});
  };

  const beginVisiblePeriod = () => {
    if (stopped || qualified || document.visibilityState !== "visible") return;
    visibleSince = now();
    timer = setTimer(qualify, Math.max(0, remainingMs));
  };

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      beginVisiblePeriod();
      return;
    }
    if (visibleSince !== null) {
      remainingMs = Math.max(0, remainingMs - (now() - visibleSince));
      visibleSince = null;
    }
    stopTimer();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  beginVisiblePeriod();

  return () => {
    stopped = true;
    detach();
  };
}
