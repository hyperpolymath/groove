// GENERATED FILE — DO NOT EDIT.
// Source: registry/groove-registry.json (ADR 0006).
// Regenerate: node scripts/gen-targets.mjs
// CI fails if this file drifts from the registry.

/** Probe targets derived from the canonical Groove registry. */
const GROOVE_TARGETS = [
  {
    "id": "groove-ref",
    "port": 6465,
    "description": "Reference Groove provider (this repo, provider/) — conformance target"
  },
  {
    "id": "gossamer",
    "port": 6470,
    "description": "General webview desktop shell — reference Groove consumer"
  },
  {
    "id": "burble",
    "port": 6473,
    "description": "P2P voice + AI bridge — real-time communications platform"
  },
  {
    "id": "verisimdb",
    "port": 6475,
    "description": "Cross-system data consistency via 8-modality octad model"
  },
  {
    "id": "vext",
    "port": 6480,
    "description": "Verification triad member — cryptographic integrity proofs"
  },
  {
    "id": "panic-attack",
    "port": 7600,
    "description": "47-language static analysis and security scanning"
  },
  {
    "id": "conflow",
    "port": 7700,
    "description": "CUE + Nickel + K9 config validation orchestrator"
  },
  {
    "id": "rpa-elysium",
    "port": 7800,
    "description": "Robotic process automation toolkit"
  },
  {
    "id": "panll",
    "port": 8000,
    "description": "Cognitive-relief development panel system (108 panels)"
  },
  {
    "id": "echidna",
    "port": 9000,
    "description": "Neurosymbolic theorem-proving platform (30 provers)"
  },
  {
    "id": "hypatia",
    "port": 9090,
    "description": "Neurosymbolic CI/CD intelligence (15 rule modules)"
  },
  {
    "id": "gitbot-fleet",
    "port": 9100,
    "description": "Bot fleet for automated repo quality enforcement (6 bots)"
  }
];

/** Match patterns the manifest must grant (MV2: goes in "permissions"). */
const GROOVE_ORIGINS = [
  "http://[::1]:6465/*",
  "http://127.0.0.1:6465/*",
  "http://localhost:6465/*",
  "http://[::1]:6470/*",
  "http://127.0.0.1:6470/*",
  "http://localhost:6470/*",
  "http://[::1]:6473/*",
  "http://127.0.0.1:6473/*",
  "http://localhost:6473/*",
  "http://[::1]:6475/*",
  "http://127.0.0.1:6475/*",
  "http://localhost:6475/*",
  "http://[::1]:6480/*",
  "http://127.0.0.1:6480/*",
  "http://localhost:6480/*",
  "http://[::1]:7600/*",
  "http://127.0.0.1:7600/*",
  "http://localhost:7600/*",
  "http://[::1]:7700/*",
  "http://127.0.0.1:7700/*",
  "http://localhost:7700/*",
  "http://[::1]:7800/*",
  "http://127.0.0.1:7800/*",
  "http://localhost:7800/*",
  "http://[::1]:8000/*",
  "http://127.0.0.1:8000/*",
  "http://localhost:8000/*",
  "http://[::1]:9000/*",
  "http://127.0.0.1:9000/*",
  "http://localhost:9000/*",
  "http://[::1]:9090/*",
  "http://127.0.0.1:9090/*",
  "http://localhost:9090/*",
  "http://[::1]:9100/*",
  "http://127.0.0.1:9100/*",
  "http://localhost:9100/*"
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GROOVE_TARGETS, GROOVE_ORIGINS };
}
