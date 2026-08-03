import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPageDefinition, pageDefinitions } from "../src/content/pageDefinitions.js";
import { resolvePageContent } from "../src/content/pageContentResolver.js";

test("empty product-mode content resolves safely for every public route", async () => {
  const expectedRoutes = ["/", "/products", "/business-observations", "/observations", "/about"];
  assert.deepEqual(pageDefinitions.map((definition) => definition.route), expectedRoutes);
  for (const definition of pageDefinitions) {
    assert.doesNotThrow(() => resolvePageContent(definition), definition.route);
  }
  assert.equal(resolvePageContent(getPageDefinition("home")).practice, null);
  assert.equal(resolvePageContent(getPageDefinition("home")).businessObservation, null);
  assert.deepEqual(resolvePageContent(getPageDefinition("observations")).briefs, []);
  assert.equal(resolvePageContent(getPageDefinition("about")).profile, null);
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const siteShell = await readFile(new URL("../src/components/site/SiteShell.jsx", import.meta.url), "utf8").catch(() => "");
  for (const route of expectedRoutes.slice(1)) assert.match(app, new RegExp(route.replace("/", "\\/")));
  assert.match(`${app}\n${siteShell}`, /SiteHeader/);
  assert.match(`${app}\n${siteShell}`, /SiteFooter/);
});
