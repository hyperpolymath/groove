<!--
SPDX-License-Identifier: CC-BY-SA-4.0
SPDX-FileCopyrightText: 2025-2026 Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->

# What Is Groove?

Groove is a protocol where independent systems discover each other at
runtime, negotiate capabilities through type-safe interfaces, and
compose — or don’t — without either side needing configuration or the
other to function.

A groove is the shape cut into the surface of a system. It is passive
until engaged. It guides without constraining. Fit is structural, not
negotiated — the Idris2 dependent types make compatibility a
compile-time property, not a runtime handshake that might fail.

# Quick Example

Start two groove-aware systems:

```bash
# Terminal 1: start Burble (voice/text comms)
burble start --port 6473

# Terminal 2: start Gossamer (desktop app shell)
gossamer start --port 6470
```

Gossamer probes nearby ports. Port 6473 responds with Burble’s
capability manifest. Burble offers `voice`, `text`, `presence`,
`spatial-audio`, `tts`, `stt`. Gossamer consumes `voice` and `text`.
Types match. Voice UI appears in Gossamer. No configuration was written.
No plugin was installed.

Stop Burble. Gossamer keeps working — voice UI disappears gracefully.

# Design Principles

1.  **Bare by default** — every system works alone, unplugged

2.  **Structural fit** — compatibility is a type property, not a config
    option

3.  **Zero configuration** — start services, they find each other

4.  **Graceful degradation** — losing a groove partner is not an error

5.  **Linear safety** — connection handles are consumed exactly once

6.  **Provenance** — every groove connection is attestable

# Specification

See <a href="spec/SPEC.adoc" class="adoc">SPEC</a> for the full protocol
specification.

# Status

| Stage          | Working Draft                                    |
|----------------|--------------------------------------------------|
| Version        | 0.1.0                                            |
| Media Type     | `application/groove+a2ml` (registration pending) |
| Reference Impl | Burble, Gossamer, VeriSimDB, Vext                |
| Formal Proofs  | Idris2 ABI in `src/abi/`                         |

# Related Standards

- [A2ML](../a2ml/) — capability manifests are encoded in A2ML

- [Axel Protocol](../axel-protocol/) — age-gating can groove with
  content systems

- [Burble](https://github.com/hyperpolymath/burble) — reference groove
  provider (voice/text)

- [Gossamer](https://github.com/hyperpolymath/gossamer) — reference
  groove consumer (desktop shell)

# License

PMPL-1.0-or-later
