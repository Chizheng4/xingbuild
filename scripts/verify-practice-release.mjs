#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertPracticeContent, referencedPracticeMediaAssets } from "./lib/practice-content.mjs";

function projectionScripts(html, publicUrl) {
  const sources = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((match) => new URL(match[1], publicUrl));
  if (!sources.length) throw new Error("products route does not expose a public application projection script");
  if (sources.some((source) => source.origin !== publicUrl.origin)) throw new Error("products projection script must stay on the public site origin");
  return sources;
}

export async function verifyPracticeReleaseOnce({
  baseUrl,
  expectedVersion,
  expectedCommit,
  practiceId,
  fetchImpl = fetch,
  bundle,
}) {
  const publicUrl = new URL(baseUrl);
  const productUrl = new URL("/products", publicUrl);
  const [practiceBundle, homeResponse, releaseResponse, manifestResponse, productsResponse] = await Promise.all([
    bundle || assertPracticeContent(practiceId, { publishable: true }),
    fetchImpl(publicUrl, { redirect: "follow" }),
    fetchImpl(new URL("/release.json", publicUrl), { redirect: "follow", cache: "no-store" }),
    fetchImpl(new URL("/content-manifest.json", publicUrl), { redirect: "follow", cache: "no-store" }),
    fetchImpl(productUrl, { redirect: "follow", cache: "no-store" }),
  ]);
  if (![homeResponse, releaseResponse, manifestResponse, productsResponse].every((response) => response.ok)) {
    throw new Error(`HTTP home=${homeResponse.status} release=${releaseResponse.status} manifest=${manifestResponse.status} products=${productsResponse.status}`);
  }
  const [home, release, manifest, products] = await Promise.all([
    homeResponse.text(), releaseResponse.json(), manifestResponse.json(), productsResponse.text(),
  ]);
  if (!home.includes("<title>xingbuild") || !products.includes("<title>xingbuild")) throw new Error("home or products route does not identify xingbuild");
  if (release.version !== expectedVersion || release.commit !== expectedCommit) throw new Error("release.json does not match expected version and commit");
  if (manifest.version !== expectedVersion || manifest.commit !== expectedCommit) throw new Error("content manifest does not match the verified release");
  if (practiceBundle.practice.id !== practiceId || !practiceBundle.practice.modules.length) throw new Error("target Practice id or modules are missing");
  const projectionSources = projectionScripts(products, publicUrl);
  const projectionResponses = await Promise.all(projectionSources.map((source) => fetchImpl(source, { redirect: "follow", cache: "no-store" })));
  if (projectionResponses.some((response) => !response.ok)) throw new Error("products route public projection script is unavailable");
  const projection = (await Promise.all(projectionResponses.map((response) => response.text()))).join("\n");
  const publicAssets = referencedPracticeMediaAssets(practiceBundle.practice, practiceBundle.manifest);
  const requiredProjectionTokens = [practiceId, ...practiceBundle.practice.modules.map((module) => module.id), ...publicAssets.map((asset) => asset.src)];
  if (requiredProjectionTokens.some((token) => !projection.includes(token))) throw new Error("products route does not contain the target Practice public projection");
  const mediaResponses = await Promise.all(publicAssets.map((asset) => fetchImpl(new URL(asset.src, publicUrl), { cache: "no-store" })));
  if (mediaResponses.some((response) => !response.ok)) throw new Error("target Practice public media is unavailable");
  return { practiceId, productUrl: productUrl.href, moduleCount: practiceBundle.practice.modules.length, publicMediaCount: publicAssets.length };
}

async function main() {
  const [baseUrl = "https://xingbuild.top/", expectedVersion, expectedCommit, flag, practiceId] = process.argv.slice(2);
  if (!expectedVersion || !expectedCommit || flag !== "--id" || !practiceId) {
    throw new Error("Usage: node scripts/verify-practice-release.mjs <url> <version> <commit> --id <practiceId>");
  }
  const attempts = Number(process.env.XINGBUILD_VERIFY_ATTEMPTS || 12);
  const intervalMs = Number(process.env.XINGBUILD_VERIFY_INTERVAL_MS || 10_000);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await verifyPracticeReleaseOnce({ baseUrl, expectedVersion, expectedCommit, practiceId });
      console.log(`Public Practice verified: ${result.practiceId}, ${result.moduleCount} module(s), ${result.publicMediaCount} public media item(s)`);
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.log(`Public Practice verification ${attempt}/${attempts} pending: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) await main();
