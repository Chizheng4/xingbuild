#!/usr/bin/env node
import { assertCurrentPracticeContent, isPublicMediaAsset } from "./lib/practice-content.mjs";

const { practice, manifest } = await assertCurrentPracticeContent();
const publicMediaIds = new Set(
  manifest.assets.filter((asset) => isPublicMediaAsset(manifest, asset)).map((asset) => asset.id),
);
const publicModuleCount = practice.modules.filter((module) => publicMediaIds.has(module.mediaId)).length;
console.log(
  `Practice content check passed: ${practice.modules.length} media relation(s), ${publicModuleCount} public module(s), media manifest ${manifest.version}`,
);
