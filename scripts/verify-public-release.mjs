#!/usr/bin/env node

const [baseUrl = "https://xingbuild.top/", expectedVersion, expectedCommit] =
  process.argv.slice(2);

if (!expectedVersion || !expectedCommit) {
  console.error(
    "Usage: node scripts/verify-public-release.mjs <url> <version> <commit>",
  );
  process.exit(1);
}

const publicUrl = new URL(baseUrl);
const releaseUrl = new URL("/release.json", publicUrl);
const manifestUrl = new URL("/content-manifest.json", publicUrl);
const attempts = Number(process.env.XINGBUILD_VERIFY_ATTEMPTS || 12);
const intervalMs = Number(process.env.XINGBUILD_VERIFY_INTERVAL_MS || 10_000);

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const [pageResponse, releaseResponse, manifestResponse] = await Promise.all([
      fetch(publicUrl, { redirect: "follow" }),
      fetch(releaseUrl, { redirect: "follow", cache: "no-store" }),
      fetch(manifestUrl, { redirect: "follow", cache: "no-store" }),
    ]);

    if (!pageResponse.ok || !releaseResponse.ok || !manifestResponse.ok) {
      throw new Error(
        `HTTP page=${pageResponse.status} release=${releaseResponse.status} manifest=${manifestResponse.status}`,
      );
    }

    const [html, release, manifest] = await Promise.all([
      pageResponse.text(),
      releaseResponse.json(),
      manifestResponse.json(),
    ]);

    if (!html.includes("<title>xingbuild")) {
      throw new Error("homepage title does not identify xingbuild");
    }
    if (release.version !== expectedVersion) {
      throw new Error(
        `version is ${release.version || "missing"}, expected ${expectedVersion}`,
      );
    }
    if (release.commit !== expectedCommit) {
      throw new Error(
        `commit is ${release.commit || "missing"}, expected ${expectedCommit}`,
      );
    }
    if (manifest.version !== expectedVersion || manifest.commit !== expectedCommit) {
      throw new Error("content manifest does not match the verified release");
    }

    console.log(
      `Public release verified: ${expectedVersion} ${expectedCommit.slice(0, 7)}`,
    );
    process.exit(0);
  } catch (error) {
    console.log(
      `Public verification ${attempt}/${attempts} pending: ${error.message}`,
    );
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

console.error(
  `Public verification failed for ${expectedVersion} at ${publicUrl.href}`,
);
process.exit(1);
