// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
//
// The executable Groove conformance suite: exactly one test per stable ID in
// spec/CONFORMANCE.adoc, run against a live reference provider on ephemeral
// ports. CI enforces the ID↔test mapping (spec-consistency job).

use std::time::{Duration, Instant};

use serde_json::{json, Value};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

use groove_provider::{serve, Config, Server};

async fn start() -> Server {
    serve(Config {
        port: 0,
        manifest: None,
        log_attestations: false,
    })
    .await
    .expect("provider starts on ephemeral dual-stack port")
}

/// Loopback address for requests: [::1] where available (clients probe it
/// first per TRANSPORT §7.6), else 127.0.0.1 (v6-less environments).
fn loopback(s: &Server) -> String {
    if s.has_v6() {
        format!("[::1]:{}", s.port())
    } else {
        format!("127.0.0.1:{}", s.port())
    }
}

/// Minimal HTTP/1.1 client: returns (status, headers, body).
async fn http(addr: &str, request: &str) -> (u16, String, String) {
    let mut stream = TcpStream::connect(addr).await.expect("connect");
    stream.write_all(request.as_bytes()).await.expect("write");
    let mut response = Vec::new();
    stream.read_to_end(&mut response).await.expect("read");
    let text = String::from_utf8_lossy(&response).to_string();
    let (head, body) = text.split_once("\r\n\r\n").unwrap_or((&text, ""));
    let status: u16 = head
        .lines()
        .next()
        .and_then(|l| l.split_whitespace().nth(1))
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);
    (status, head.to_string(), body.to_string())
}

async fn get(s: &Server, path: &str, accept: &str) -> (u16, String, String) {
    let req = format!(
        "GET {path} HTTP/1.1\r\nHost: localhost\r\nAccept: {accept}\r\nConnection: close\r\n\r\n"
    );
    http(&loopback(s), &req).await
}

async fn post(s: &Server, path: &str, body: &Value) -> (u16, String, String) {
    let payload = body.to_string();
    let req = format!(
        "POST {path} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{payload}",
        payload.len()
    );
    http(&loopback(s), &req).await
}

fn consumer(consumes: &[&str]) -> Value {
    json!({
        "groove_version": "1",
        "service_id": "conformance-consumer",
        "service_version": "0.0.1",
        "mode": "active",
        "capabilities": {},
        "consumes": consumes,
    })
}

async fn connect_ok(s: &Server) -> String {
    let (status, _, body) = post(s, "/.well-known/groove/connect", &consumer(&[])).await;
    assert_eq!(status, 200, "compatible connect must succeed: {body}");
    serde_json::from_str::<Value>(&body).expect("connect body is JSON")["handle"]
        .as_str()
        .expect("connect body carries a handle")
        .to_string()
}

// ---------------------------------------------------------------- Level 1

#[tokio::test]
async fn conf_l1_01() {
    let s = start().await;
    let (status, head, _) = get(&s, "/.well-known/groove", "*/*").await;
    assert_eq!(status, 200);
    assert!(
        head.to_ascii_lowercase().contains("content-type: application/groove+json"),
        "default content type must be application/groove+json, got:\n{head}"
    );
}

#[tokio::test]
async fn conf_l1_02() {
    let s = start().await;
    let (_, _, body) = get(&s, "/.well-known/groove", "application/groove+json").await;
    let m: Value = serde_json::from_str(&body).expect("manifest is JSON");
    assert_eq!(m["groove_version"], "1");
    assert!(m["service_id"].is_string());
    assert!(m["service_version"].is_string());
    assert!(m["mode"].is_string());
    assert!(m["capabilities"].is_object(), "capabilities is an object (map)");
}

#[tokio::test]
async fn conf_l1_03() {
    let s = start().await;
    let (_, _, body) = get(&s, "/.well-known/groove", "application/groove+json").await;
    let m: Value = serde_json::from_str(&body).expect("manifest is JSON");
    let caps = m["capabilities"].as_object().expect("capabilities object");
    assert!(!caps.is_empty(), "must offer at least one capability");
    let valid = caps
        .values()
        .filter_map(|c| c["type"].as_str())
        .any(groove::registry::is_valid_capability);
    assert!(valid, "at least one capability type must be registered");
}

#[tokio::test]
async fn conf_l1_04() {
    let s = start().await;

    let (status, head, body) = get(&s, "/.well-known/groove", "application/groove+a2ml").await;
    assert_eq!(status, 200);
    assert!(head.to_ascii_lowercase().contains("application/groove+a2ml"));
    assert!(body.trim_start().starts_with("@groove-manifest"), "A2ML body: {body}");

    // Unknown Accept still gets a parseable JSON manifest (bare-by-default).
    let (status, _, body) = get(&s, "/.well-known/groove", "text/weird").await;
    assert_eq!(status, 200);
    let m: Value = serde_json::from_str(&body).expect("fallback body is JSON");
    assert_eq!(m["groove_version"], "1");
}

// ---------------------------------------------------------------- Level 2

#[tokio::test]
async fn conf_l2_01() {
    let s = start().await;
    // groove-ref offers "attestation"; consuming it is structurally compatible.
    let (status, _, body) =
        post(&s, "/.well-known/groove/connect", &consumer(&["attestation"])).await;
    assert_eq!(status, 200, "{body}");
    let v: Value = serde_json::from_str(&body).expect("JSON body");
    assert!(v["handle"].is_string(), "connect returns a handle: {body}");
}

#[tokio::test]
async fn conf_l2_02() {
    let s = start().await;
    let (status, _, body) =
        post(&s, "/.well-known/groove/connect", &consumer(&["voice"])).await;
    assert_eq!(status, 409, "incompatible connect must 409: {body}");
    let v: Value = serde_json::from_str(&body).expect("JSON body");
    assert!(
        v["reasons"].as_array().is_some_and(|r| !r.is_empty()),
        "409 carries machine-readable reasons: {body}"
    );
    // No handle was minted.
    let (_, _, mesh) = get(&s, "/.well-known/groove/mesh", "application/json").await;
    let m: Value = serde_json::from_str(&mesh).expect("mesh JSON");
    assert_eq!(m["connections"].as_array().map(Vec::len), Some(0));
}

#[tokio::test]
async fn conf_l2_03() {
    let s = start().await;
    let started = Instant::now();
    let (status, _, _) = get(&s, "/.well-known/groove/heartbeat", "*/*").await;
    let elapsed = started.elapsed();
    assert_eq!(status, 204);
    assert!(
        elapsed < Duration::from_millis(500),
        "heartbeat took {elapsed:?}, must be < 500ms"
    );
}

#[tokio::test]
async fn conf_l2_04() {
    let s = start().await;
    let handle = connect_ok(&s).await;

    let (status, _, _) =
        post(&s, "/.well-known/groove/disconnect", &json!({ "handle": handle })).await;
    assert_eq!(status, 200, "first disconnect succeeds");

    let (status, _, _) =
        post(&s, "/.well-known/groove/disconnect", &json!({ "handle": handle })).await;
    assert_eq!(status, 410, "handle is linear: second disconnect gets 410 Gone");
}

#[tokio::test]
async fn conf_l2_05() {
    let s = start().await;
    let handle = connect_ok(&s).await;
    post(&s, "/.well-known/groove/disconnect", &json!({ "handle": handle })).await;

    let (status, _, body) = get(&s, "/.well-known/groove", "application/groove+json").await;
    assert_eq!(status, 200, "provider keeps functioning bare after disconnect");
    let m: Value = serde_json::from_str(&body).expect("manifest still parses");
    assert_eq!(m["groove_version"], "1");
}

#[tokio::test]
async fn conf_l2_06() {
    let s = start().await;
    let mut hosts = vec![format!("127.0.0.1:{}", s.port())];
    if s.has_v6() {
        // [::1] first, per TRANSPORT §7.6.
        hosts.insert(0, format!("[::1]:{}", s.port()));
    } else {
        // Full dual-stack verification requires an IPv6 loopback; CI has one.
        eprintln!("conf_l2_06: no IPv6 loopback in this environment — verifying 127.0.0.1 only");
    }
    for host in hosts {
        let req = "GET /.well-known/groove HTTP/1.1\r\nHost: localhost\r\nAccept: application/groove+json\r\nConnection: close\r\n\r\n";
        let (status, _, body) = http(&host, req).await;
        assert_eq!(status, 200, "manifest endpoint must answer on {host}");
        let m: Value = serde_json::from_str(&body).expect("JSON on both stacks");
        assert_eq!(m["service_id"], "groove-ref");
    }
}

#[tokio::test]
async fn conf_l2_07() {
    let s = start().await;
    let handle = connect_ok(&s).await;
    post(&s, "/.well-known/groove/disconnect", &json!({ "handle": handle })).await;

    let (status, _, body) = get(&s, "/.well-known/groove/attestations", "application/json").await;
    assert_eq!(status, 200);
    let records: Vec<Value> = serde_json::from_str(&body).expect("attestations JSON");
    assert!(records.len() >= 2, "connect + disconnect each attest");

    let events: Vec<&str> = records.iter().filter_map(|r| r["event"].as_str()).collect();
    assert!(events.contains(&"groove:connected"));
    assert!(events.contains(&"groove:disconnected"));

    for r in &records {
        for field in ["event", "provider", "consumer", "timestamp", "hash", "prev_hash"] {
            assert!(!r[field].is_null(), "record missing {field}: {r}");
        }
    }
    assert_eq!(records[0]["prev_hash"], "sha256:genesis");
    for pair in records.windows(2) {
        assert_eq!(
            pair[1]["prev_hash"], pair[0]["hash"],
            "records must hash-chain: {} then {}",
            pair[0], pair[1]
        );
    }
}
