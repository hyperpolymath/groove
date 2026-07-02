// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
//
// Golden tests for manifest validation against examples/minimal-manifest.json.

use std::fs;
use std::path::Path;

use groove::validate::validate_manifest_content;

fn minimal_manifest() -> String {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("cli/ has a parent")
        .join("examples/minimal-manifest.json");
    fs::read_to_string(path).expect("examples/minimal-manifest.json exists")
}

#[test]
fn minimal_manifest_validates_clean() {
    let findings = validate_manifest_content(&minimal_manifest(), "examples/minimal-manifest.json");
    assert!(
        findings.is_empty(),
        "the shipped minimal manifest must validate clean, got: {findings:#?}"
    );
}

#[test]
fn unknown_capability_type_is_flagged() {
    let mutated = minimal_manifest().replace("\"attestation\"", "\"notacap\"");
    let findings = validate_manifest_content(&mutated, "mutated.json");
    assert!(
        findings.iter().any(|f| f.description.contains("notacap")),
        "an unregistered capability type must produce a finding, got: {findings:#?}"
    );
}

#[test]
fn missing_groove_version_is_flagged() {
    let mutated = minimal_manifest().replace("\"groove_version\": \"1\",", "");
    let findings = validate_manifest_content(&mutated, "mutated.json");
    assert!(
        findings
            .iter()
            .any(|f| f.description.contains("groove_version")),
        "a missing groove_version must produce a finding, got: {findings:#?}"
    );
}

#[test]
fn invalid_json_is_critical() {
    let findings = validate_manifest_content("{ not json", "broken.json");
    assert!(findings.iter().any(|f| f.severity == "critical"));
}

#[test]
fn capabilities_array_is_schema_violation() {
    let mutated = minimal_manifest().replace(
        r#""capabilities": {
    "attestation": {
      "type": "attestation",
      "protocol": "http",
      "version": "1.0.0"
    }
  }"#,
        r#""capabilities": []"#,
    );
    let findings = validate_manifest_content(&mutated, "mutated.json");
    assert!(
        findings.iter().any(|f| f.description.contains("object")),
        "capabilities-as-array must be flagged as a schema violation, got: {findings:#?}"
    );
}
