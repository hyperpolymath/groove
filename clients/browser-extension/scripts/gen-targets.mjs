// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
//
// Generates background/groove-targets.gen.js (the extension's probe targets)
// and prints the MV2 permission origin list, all from the single source of
// truth: registry/groove-registry.json (ADR 0006).
//
// Usage:  node scripts/gen-targets.mjs [--check]
//   --check  exit 1 if the generated file is out of date (CI drift guard)
//
// Run from anywhere; paths resolve relative to this script.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const extensionRoot = join(here, "..");
const repoRoot = join(extensionRoot, "..", "..");
const registryPath = join(repoRoot, "registry", "groove-registry.json");
const outPath = join(extensionRoot, "background", "groove-targets.gen.js");

const registry = JSON.parse(readFileSync(registryPath, "utf8"));

const targets = registry.services
  .filter((s) => s.status !== "rejected-proposal")
  .map(({ id, port, description }) => ({ id, port, description }));

const origins = [];
for (const { port } of targets) {
  origins.push(`http://[::1]:${port}/*`);
  origins.push(`http://127.0.0.1:${port}/*`);
  origins.push(`http://localhost:${port}/*`);
}

const banner = `// GENERATED FILE — DO NOT EDIT.
// Source: registry/groove-registry.json (ADR 0006).
// Regenerate: node scripts/gen-targets.mjs
// CI fails if this file drifts from the registry.
`;

const body = `${banner}
/** Probe targets derived from the canonical Groove registry. */
const GROOVE_TARGETS = ${JSON.stringify(targets, null, 2)};

/** Match patterns the manifest must grant (MV2: goes in "permissions"). */
const GROOVE_ORIGINS = ${JSON.stringify(origins, null, 2)};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GROOVE_TARGETS, GROOVE_ORIGINS };
}
`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(outPath, "utf8");
  } catch {
    console.error(`MISSING: ${outPath} — run: node scripts/gen-targets.mjs`);
    process.exit(1);
  }
  if (current !== body) {
    console.error(`DRIFT: ${outPath} does not match registry — run: node scripts/gen-targets.mjs`);
    process.exit(1);
  }
  console.log("groove-targets.gen.js is in sync with the registry");
} else {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, body);
  console.log(`wrote ${outPath} (${targets.length} targets, ${origins.length} origins)`);
}
