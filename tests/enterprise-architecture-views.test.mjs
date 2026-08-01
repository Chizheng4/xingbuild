import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { LikeC4 } from "likec4";
import { architectureById } from "../src/content/frameworkModel.js";
import { enterpriseArchitectureView, enterpriseArchitectureViewIds } from "../src/components/reading/enterpriseArchitectureViews.js";
import { enterpriseArchitectureViewsMeta } from "../src/generated/enterpriseArchitectureViewsMeta.js";

const root = new URL("..", import.meta.url);
const runtime = await readFile(new URL("../src/components/reading/EnterpriseArchitectureViews.jsx", import.meta.url), "utf8");
const richDocument = await readFile(new URL("../src/components/reading/RichDocument.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
const likec4Config = JSON.parse(await readFile(new URL("../src/architecture/enterprise-operating-system/likec4.config.json", import.meta.url), "utf8"));
const modelDirectory = new URL("../src/architecture/enterprise-operating-system/", import.meta.url);

async function computedModel() {
  const likec4 = await LikeC4.fromWorkspace(modelDirectory.pathname);
  assert.deepEqual(likec4.getErrors(), []);
  return likec4.computedModel();
}

test("LikeC4 model exposes the four approved views from the framework semantic source", async () => {
  const model = await computedModel();
  const relationById = new Map(Object.entries(model.$data.relations));
  assert.deepEqual(enterpriseArchitectureViewsMeta.viewIds, enterpriseArchitectureViewIds);
  assert.equal(enterpriseArchitectureViewsMeta.likec4Version, "1.59.2");
  for (const viewId of enterpriseArchitectureViewIds) {
    const expected = enterpriseArchitectureView(viewId);
    const actual = model.$data.views[viewId];
    assert.ok(actual, `${viewId} must exist in the LikeC4 model`);
    assert.deepEqual(new Set(actual.nodes.map((node) => node.modelRef)), new Set(expected.nodes.map((node) => node.id)));
    const actualRelations = actual.edges.flatMap((edge) => edge.relations.map((relationId) => relationById.get(relationId)));
    assert.deepEqual(new Set(actualRelations.map((relation) => relation.metadata?.id)), new Set(expected.edges.map((edge) => edge.id)));
    for (const relation of actualRelations) {
      const expectedRelation = expected.edges.find((edge) => edge.id === relation.metadata?.id);
      assert.deepEqual([relation.source.model, relation.target.model, relation.title], [expectedRelation.from, expectedRelation.to, expectedRelation.label]);
    }
  }
  assert.equal(architectureById.get("digital-implementation").nodes.length, 9);
  assert.equal(architectureById.get("digital-implementation").edges.length, 13);
});

test("LikeC4 desktop projection keeps the approved warm theme and bounded reading geometry", async () => {
  const likec4 = await LikeC4.fromWorkspace(modelDirectory.pathname);
  assert.deepEqual(likec4.getErrors(), []);
  const model = await likec4.layoutedModel();
  const landscape = model.$data.views.landscape;
  assert.equal(likec4Config.styles.defaults.relationship.line, "solid");
  assert.equal(likec4Config.styles.colors, undefined);
  assert.equal(likec4Config.styles.theme.colors.primary.elements.fill, "#f1e7d8");
  assert.equal(likec4Config.styles.theme.colors.primary.relationships.line, "#7c624e");
  assert.ok(landscape.bounds.width < 900, `landscape width ${landscape.bounds.width} should stay within the reading column`);
  assert.ok(landscape.bounds.height < 1600, `landscape height ${landscape.bounds.height} should avoid a portrait canvas`);
});

test("LikeC4 codegen removes old runtime artifacts before a failed generation", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "xingbuild-likec4-failure-"));
  const source = path.join(directory, "source");
  const output = path.join(directory, "generated.jsx");
  try {
    await cp(modelDirectory, source, { recursive: true });
    await writeFile(path.join(source, "model.c4"), "model { invalid = landscape 'invalid' }\nviews { view landscape { include invalid } }");
    await Promise.all([writeFile(output, "stale"), writeFile(output.replace(/\.jsx$/, ".d.ts"), "stale"), writeFile(output.replace(/\.jsx$/, "Meta.js"), "stale")]);
    assert.throws(() => execFileSync("node", ["scripts/generate-enterprise-architecture-views.mjs", "--source", source, "--output", output], { cwd: root, stdio: "pipe" }));
    await assert.rejects(readFile(output));
    await assert.rejects(readFile(output.replace(/\.jsx$/, ".d.ts")));
    await assert.rejects(readFile(output.replace(/\.jsx$/, "Meta.js")));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("article declares one controlled LikeC4 reader entry with an accessible text fallback", () => {
  assert.match(richDocument, /block\.type === "architectureViews"/);
  assert.match(runtime, /LikeC4Reader/);
  assert.match(runtime, /pannable=\{false\}/);
  assert.match(runtime, /zoomable=\{false\}/);
  assert.match(runtime, /onNodeClick=\{\(node\) => onSelect\(node\.id\)\}/);
  assert.match(runtime, /architectureReturnFocus/);
  assert.doesNotMatch(runtime, /ArchitectureExplorer|FrameworkGraphRuntime|<svg/);
  assert.match(styles, /\.enterprise-architecture__runtime \{ display: none; \}/);
  assert.match(styles, /\.enterprise-architecture__fallback \{ display: grid; \}/);
  assert.match(styles, /height: min\(48rem, 100vh\) !important/);
});
