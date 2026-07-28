#!/usr/bin/env node
import { assertCurrentPracticeContent } from "./lib/practice-content.mjs";

const { practice, manifest } = await assertCurrentPracticeContent();
console.log(`Practice content check passed: ${practice.modules.length} module(s), media manifest ${manifest.version}`);
