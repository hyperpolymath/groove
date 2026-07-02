<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
<!-- Copyright (c) 2026 Jonathan D.A. Jewell (hyperpolymath) <j.d.a.jewell@open.ac.uk> -->

# Readiness — groove-protocol

Honest status per component, as of 2026-07-02 (the 0.2.0 consolidation).
Decision records: `docs/decisions/`. This file describes what exists in THIS
repository — the earlier assessment's estate-wide deployment claims ("65+
repos", `groove check`, dogfood-gate) and its architecture tree (`src/abi/`,
`ffi/zig/`, `bindings/`) described work living in other repositories and
components that do not exist here; they have been removed (ADR 0001).

| Component | State | Evidence |
|---|---|---|
| `spec/` | Drafted, v0.2.0-draft. Manifest encoding model added (ADR 0002); conformance checklist is executable; LAYERING annex explicitly aspirational | `spec/*.adoc`; CI `spec-consistency` job |
| `registry/` | Single source of truth for ports/services; embedded in the CLI at compile time | `cli/tests/registry_consistency.rs` (green) |
| `cli/` | Builds and runs (init / validate / probe / registry / check-compat / mesh); registry + compat covered by tests | `cargo test --workspace` |
| `provider/` | Reference provider: dual-stack discovery, JSON/A2ML content negotiation, connect / heartbeat / disconnect lifecycle, hash-chained attestation | `provider/tests/conformance.rs` (one test per CONF-* ID) |
| `reference/ipv6t/` | Real Zig implementation with tests and bench; **verified only in CI** (zig not in the dev environment); header size corrected to 108 in spec | CI `zig` job (allow-fail until first green) |
| `harness/groove-harness.js` | Discovery works; its A2ML "parser" is a regex stub returning empty capabilities — JSON support pending (ADR 0002) | `harness/groove-harness.js` `_parseManifest` |
| `clients/browser-extension/` | Firefox MV2; remediated per ADR 0005 (permissions bug fixed, spec dialect, generated port table) | `web-ext lint`, `tests/validate_structure.sh`, `node --test` |
| `proofs/` | Relocated from gossamer; **do not typecheck** (still `module Gossamer.ABI.*`); task PROOFS-1 | `proofs/README.adoc`; allow-fail `proofs.yml` |

## Overall grade: C+ (working draft with an executable core)

The spec, registry, CLI, reference provider, and conformance suite form a
working, self-contained vertical slice; the type-level guarantees (SPEC §3.3),
A2ML parsing, GRV6-in-CI, and the proof layer are still open. Grade becomes B
when: the zig CI job is green and required, PROOFS-1 lands, and the harness
parses JSON manifests.

## What would make this a 1.0

1. A2ML parsing (promotes the optional encoding to parity, ADR 0002).
2. PROOFS-1: proofs decoupled, typechecking in CI, claims re-enabled.
3. A second independent provider implementation passing CONF-L1/L2.
4. IANA registration of `application/groove+json` / `application/groove+a2ml`
   and the `groove` well-known URI (RFC 8615).
