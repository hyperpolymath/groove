<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
# Groove Discovery — browser extension (Firefox, MV2)

Probes registry-known localhost ports for groove-aware services and bridges
their capabilities into the browser: a live registry, a popup dashboard, and
a `window.groove` page API (discover / status / connect / disconnect /
findCapability). Moved here from `groove-browser-harness` per ADR 0005.

## Protocol

Speaks Groove v0.2, JSON manifest dialect (`application/groove+json`,
ADR 0002), with the SPEC §4 lifecycle: `connect` → heartbeat loop (5s, drop
after 3 misses) → `disconnect` (handles are linearly consumed). Probes
`[::1]` before `127.0.0.1` per TRANSPORT §7.6.

## The port table is generated

`background/groove-targets.gen.js` and the manifest's origin permissions
derive from `registry/groove-registry.json` (ADR 0006). Never hand-edit them:

```bash
node scripts/gen-targets.mjs          # regenerate after a registry change
node scripts/gen-targets.mjs --check  # CI drift guard
node scripts/gen-icons.mjs            # regenerate icons (no image tooling needed)
```

## Develop

```bash
npx web-ext run --source-dir .        # launch in a temporary Firefox profile
npx web-ext lint --source-dir .       # 0 errors expected
bash tests/validate_structure.sh      # structural checks (9)
node --test tests/*.test.mjs          # unit + stub-provider integration tests
```

For a live end-to-end loop, start the reference provider first:
`cargo run -p groove-provider` (from the repo root), then load the extension
and hit "Probe All".

## Why MV2 / Firefox-only (for now)

MV3 background service workers are killed when idle, which is hostile to the
persistent probe + heartbeat loop. MV3 (and Chrome support) is a tracked
follow-up — see ADR 0005. `browser_specific_settings.gecko.strict_min_version`
is 109.0.

## Trust boundary

Localhost only; no data leaves the machine. Origin permissions are limited to
the generated registry ports. Manifest parsing is structural validation in
`clients/js/groove-client.js` (vendored copy in `background/` — kept in sync
by the validate script); this is runtime checking, not formal verification.
