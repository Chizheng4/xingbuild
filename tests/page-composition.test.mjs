import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  COMPOSITIONS,
  COMPOSITION_REGIONS,
  pageDefinitionFixtures,
  pageDefinitionRegistry,
  pageDefinitions,
  findPageDefinitionByRoute,
  getPageDefinition,
  validatePageDefinitions,
} from "../src/content/pageDefinitions.js";
import { resolvePageContent } from "../src/content/pageContentResolver.js";

const renderer = await readFile(new URL("../src/components/page-compositions/PageCompositionRenderer.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const about = await readFile(new URL("../src/pages/AboutPage.jsx", import.meta.url), "utf8");

test("page registry covers the four controlled compositions and keeps routes unique", () => {
  assert.deepEqual(COMPOSITIONS, ["HomeComposition", "ShowcaseComposition", "CollectionComposition", "ReadingComposition"]);
  assert.equal(validatePageDefinitions(pageDefinitions).length, 0);
  assert.equal(new Set(pageDefinitions.map((definition) => definition.id)).size, pageDefinitions.length);
  assert.equal(new Set(pageDefinitions.map((definition) => definition.route)).size, pageDefinitions.length);
  assert.equal(getPageDefinition("about").route, "/about");
  assert.equal(findPageDefinitionByRoute("/about").id, "about");
  assert.deepEqual(Object.keys(pageDefinitionRegistry).sort(), ["about", "business-observations", "home", "observations", "products"]);
  for (const definition of pageDefinitions) {
    assert.ok(COMPOSITION_REGIONS[definition.composition]);
    assert.ok(definition.regions.every((region) => COMPOSITION_REGIONS[definition.composition].includes(region)));
  }
});

test("invalid page definitions fail loudly instead of silently changing composition", () => {
  const aboutDefinition = getPageDefinition("about");
  const errors = validatePageDefinitions([
    aboutDefinition,
    { ...aboutDefinition, id: "about-copy" },
  ]);
  assert.ok(errors.some((error) => error.includes("route conflicts with /about")));

  const invalid = validatePageDefinitions([{
    ...aboutDefinition,
    id: "invalid",
    route: "/invalid?view=free",
    composition: "UnknownComposition",
    regions: ["RichDocument", "uncontrolled-region"],
    contentRefs: { profile: { type: "profile", id: "about", renderer: "freeform" } },
    responsivePolicy: "mobile-special-case",
  }]);
  assert.ok(invalid.some((error) => error.includes("safe absolute path")));
  assert.ok(invalid.some((error) => error.includes("composition is not registered")));
  assert.ok(invalid.some((error) => error.includes("unknown region")));
  assert.ok(invalid.some((error) => error.includes("unsupported field")));
  assert.ok(invalid.some((error) => error.includes("shared strategy")));
});

test("same-composition fixture uses only a page definition and an approved content reference", () => {
  assert.equal(pageDefinitionFixtures.length, 1);
  const fixture = pageDefinitionFixtures[0];
  assert.equal(fixture.composition, "ReadingComposition");
  assert.deepEqual(fixture.contentRefs, { profile: { type: "profile", id: "about" } });
  assert.equal(validatePageDefinitions(pageDefinitionFixtures).length, 0);
  assert.match(renderer, /ReadingComposition/);
  assert.match(renderer, /resolvePageContent/);
  assert.doesNotMatch(renderer, /CapabilityHost|VisualizationHost|LikeC4|robotaxi\.xingbuild/);
  assert.match(app, /findPageDefinitionByRoute/);
  assert.match(app, /PageCompositionRenderer/);
  assert.match(about, /getPageDefinition\("about"\)/);
  assert.doesNotMatch(about, /RichDocument|page-specific|<h1/);
});

test("missing profile content resolves to null without dereferencing the absent object", () => {
  const content = resolvePageContent({ contentRefs: { profile: { type: "profile", id: "about" } } });
  assert.deepEqual(content, { profile: null });
});

test("all public page compositions opt into one shared visual structure", () => {
  for (const marker of [
    "page-composition--home",
    "page-composition--showcase",
    "page-composition--collection",
    "page-composition--reading",
  ]) assert.match(renderer, new RegExp(marker));
  assert.match(renderer, /content-empty-state/);
});
