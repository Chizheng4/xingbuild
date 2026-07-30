#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { finalizeReleasedContent } from "./lib/content-finalize.mjs";

export async function verifyContentReleaseOnce({
  baseUrl,
  expectedVersion,
  expectedCommit,
  targetPath,
  fetchImpl = fetch,
}) {
  const publicUrl = new URL(baseUrl);
  const releaseUrl = new URL("/release.json", publicUrl);
  const manifestUrl = new URL("/content-manifest.json", publicUrl);
  const articleUrl = new URL(targetPath, publicUrl);
  const slugMatch = articleUrl.pathname.match(/^\/observations\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!slugMatch) throw new Error("target path must identify one observation slug");
  const targetSlug = slugMatch[1];

  const [pageResponse, releaseResponse, manifestResponse, articleResponse] = await Promise.all([
    fetchImpl(publicUrl, { redirect: "follow" }),
    fetchImpl(releaseUrl, { redirect: "follow", cache: "no-store" }),
    fetchImpl(manifestUrl, { redirect: "follow", cache: "no-store" }),
    fetchImpl(articleUrl, { redirect: "follow", cache: "no-store" }),
  ]);
  if (!pageResponse.ok || !releaseResponse.ok || !manifestResponse.ok || !articleResponse.ok) {
    throw new Error(
      `HTTP home=${pageResponse.status} release=${releaseResponse.status} manifest=${manifestResponse.status} article=${articleResponse.status}`,
    );
  }

  const [home, release, manifest, article] = await Promise.all([
    pageResponse.text(),
    releaseResponse.json(),
    manifestResponse.json(),
    articleResponse.text(),
  ]);
  if (!home.includes("<title>xingbuild") || !article.includes("<title>xingbuild")) {
    throw new Error("home or article route does not identify xingbuild");
  }
  if (release.version !== expectedVersion) {
    throw new Error(`version is ${release.version}, expected ${expectedVersion}`);
  }
  if (release.commit !== expectedCommit) {
    throw new Error(`commit is ${release.commit}, expected ${expectedCommit}`);
  }
  if (manifest.version !== expectedVersion || manifest.commit !== expectedCommit) {
    throw new Error("content manifest does not match the verified release");
  }
  if (!Array.isArray(manifest.publishedSlugs) || !manifest.publishedSlugs.includes(targetSlug)) {
    throw new Error(`content manifest does not contain target slug: ${targetSlug}`);
  }

  return { targetSlug, articleUrl: articleUrl.href };
}

export async function verifyAndFinalizeContentRelease(options) {
  const result = await verifyContentReleaseOnce(options);
  await finalizeReleasedContent(result.targetSlug, {
    rootDirectory: options.rootDirectory,
  });
  return result;
}

async function main() {
  const [baseUrl = "https://xingbuild.top/", expectedVersion, expectedCommit, targetPath, finalizeFlag] =
    process.argv.slice(2);
  if (!expectedVersion || !expectedCommit || !targetPath || finalizeFlag !== "--finalize") {
    console.error(
      "Usage: node scripts/verify-content-release.mjs <url> <version> <commit> <article-path> --finalize",
    );
    process.exitCode = 1;
    return;
  }

  const attempts = Number(process.env.XINGBUILD_VERIFY_ATTEMPTS || 12);
  const intervalMs = Number(process.env.XINGBUILD_VERIFY_INTERVAL_MS || 10_000);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await verifyContentReleaseOnce({
        baseUrl,
        expectedVersion,
        expectedCommit,
        targetPath,
      });
      await finalizeReleasedContent(result.targetSlug);
      console.log(
        `Public content verified and workspace finalized: /observations/${result.targetSlug} at ${expectedCommit.slice(0, 7)}`,
      );
      return;
    } catch (error) {
      console.log(`Public content verification ${attempt}/${attempts} pending: ${error.message}`);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  console.error(`Public content verification failed for ${new URL(targetPath, baseUrl).href}`);
  process.exitCode = 1;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  await main();
}
