#!/usr/bin/env node
import { readPublishedObservations } from "./lib/observation-content.mjs";

const observations = await readPublishedObservations();
if (observations.length === 0) throw new Error("No published observations found");

console.log(`Observation content check passed: ${observations.length} published item(s)`);
