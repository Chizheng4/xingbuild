#!/usr/bin/env node
const [baseUrl = "https://xingbuild.top/", expectedVersion, expectedCommit, slug] = process.argv.slice(2);
if (!expectedVersion || !expectedCommit || !slug) {
  throw new Error("Usage: node scripts/verify-article-release.mjs <url> <version> <commit> <slug>");
}
const root = new URL(baseUrl);
const [pageResponse, releaseResponse, manifestResponse] = await Promise.all([
  fetch(new URL("/business-observations", root), { redirect: "follow", cache: "no-store" }),
  fetch(new URL("/release.json", root), { redirect: "follow", cache: "no-store" }),
  fetch(new URL("/content-manifest.json", root), { redirect: "follow", cache: "no-store" }),
]);
if (!pageResponse.ok || !releaseResponse.ok || !manifestResponse.ok) throw new Error("article public verification received a non-OK response");
const [page, release, manifest] = await Promise.all([pageResponse.text(), releaseResponse.json(), manifestResponse.json()]);
if (release.version !== expectedVersion || release.commit !== expectedCommit) throw new Error("public release metadata does not match the verified article commit");
if (manifest.version !== expectedVersion || manifest.commit !== expectedCommit) throw new Error("content manifest does not match the verified article commit");
if (!manifest.publishedArticleSlugs?.includes(slug)) throw new Error(`public article manifest is missing ${slug}`);
if (!page.includes("企业经营体系")) throw new Error("public enterprise article page does not contain its reader title");
console.log(`Public evergreen article verified: ${slug} ${expectedCommit.slice(0, 7)}`);
