<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
# Changelog

## [0.2.0] — 2026-07-02 (unreleased)

The consolidation release: one canonical repo, one registry, an executable
conformance suite, and a reference provider. Decision records in
`docs/decisions/` (ADRs 0001–0008).

### Added
- `spec/LAYERING.adoc` — the cleave-layering design from the interim `groove`
  repo, preserved as an explicitly aspirational annex (ADR 0001/0003).
- `proofs/` — Idris2 modules relocated from gossamer; not yet decoupled or
  typechecked (task PROOFS-1; allow-fail `proofs.yml` CI job).
- `registry/groove-registry.json` — single source of truth for ports,
  services, and capability/protocol types (ADR 0006). The CLI embeds it at
  compile time; the browser extension's target table is generated from it.
- `provider/` — `groove-provider`, the reference Groove provider: dual-stack
  discovery, content-negotiated JSON/A2ML manifests, connect / heartbeat /
  disconnect lifecycle with linear handles, hash-chained attestation.
- Executable conformance suite (`provider/tests/conformance.rs`) implementing
  `CONF-L1-*` / `CONF-L2-*` from `spec/CONFORMANCE.adoc`.
- `clients/browser-extension/` — the Firefox extension, folded in from
  `groove-browser-harness` and made spec-conformant (ADR 0005); shared logic
  in `clients/js/groove-client.js`.
- Real CI (`ci.yml`): rust workspace tests, registry-drift guard, web-ext
  lint + extension tests, zig job (allow-fail until first green),
  spec-consistency checks.

### Changed
- Manifest encoding model (ADR 0002): `application/groove+json` is REQUIRED
  (the dialect the working code implements); `application/groove+a2ml` is
  optional/serve-only until an A2ML parser exists.
- Port resolutions (ADR 0006): verisimdb 8080 → 6475 (spec well-known table);
  gitbot-fleet 8080 → 9100 (collision removed); 7500 dropped; 4070 recorded
  as rejected-proposal; reference provider registered at 6465.
- Licensing normalized (ADR 0004): MPL-2.0 code, CC-BY-SA-4.0 prose; stale
  license declarations removed.
- `README.adoc` and `READINESS.md` rewritten to describe the repository as it
  is, not as aspired.

### Removed
- The claim that "0.3-draft" superseded this spec (the interim `groove` repo
  is superseded and scheduled for archive, ADR 0001).

## [0.1.0] — 2026-03-23

Initial working draft: `spec/` (SPEC, TRANSPORT, IPV6T, MODULARITY,
INNERVATION-SIGNALS, CONFORMANCE), `cli/` (init / validate / probe /
registry / check-compat / mesh), `reference/ipv6t/` (GRV6 typed frames),
`harness/groove-harness.js`, five papers in `docs/`.
