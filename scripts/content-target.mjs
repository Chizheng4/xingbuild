#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import {
  createContentChangeSet,
  createContentTargetCard,
  createRollbackChangeSet,
  writeContentChangeSet,
} from "./lib/content-targets.mjs";
import { projectRoot } from "./lib/observation-content.mjs";

function option(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1] || null;
}

function repeatedOption(argv, name) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) if (argv[index] === name && argv[index + 1]) values.push(argv[index + 1]);
  return values;
}

export async function runTargetCommand(argv = [], { rootDirectory = projectRoot } = {}) {
  const targetId = option(argv, "--target-id");
  const rollbackPath = option(argv, "--rollback");
  if (!targetId && !rollbackPath) throw new Error("Usage: npm run content:target -- --target-id <registered targetId> [--after <value> --source-ref <ref>... --boundary <text> --authority <id>] | --rollback <ignored ChangeSet>");
  if (rollbackPath) {
    const rollback = await createRollbackChangeSet(rollbackPath, { rootDirectory, changeId: option(argv, "--change-id") || undefined });
    const card = await createContentTargetCard(rollback.targetId, { rootDirectory });
    return { card, changeSet: rollback, file: rollback.file, mode: "rollback" };
  }
  const card = await createContentTargetCard(targetId, { rootDirectory });
  const after = option(argv, "--after");
  if (after === null) return { card, changeSet: null, file: null, mode: "inspect" };
  const changeSet = await createContentChangeSet({
    targetId,
    after,
    beforeHash: option(argv, "--before-hash") || card.beforeHash,
    sourceRefs: repeatedOption(argv, "--source-ref"),
    boundary: option(argv, "--boundary"),
    authority: option(argv, "--authority"),
    changeId: option(argv, "--change-id") || undefined,
    rootDirectory,
  });
  const written = await writeContentChangeSet(changeSet, { rootDirectory });
  return { card, changeSet: written, file: written.file, mode: "create" };
}

async function main(argv = process.argv.slice(2)) {
  const result = await runTargetCommand(argv);
  console.log(JSON.stringify({
    mode: result.mode,
    card: result.card,
    changeSet: result.changeSet,
    file: result.file,
  }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try { await main(); } catch (error) {
    console.error(`内容定位已停止：${error.message}`);
    process.exitCode = 1;
  }
}
