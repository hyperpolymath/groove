// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
//
// Groove Bridge — content script that exposes groove discovery to web pages.
//
// Injects a `window.groove` API that pages can use to discover local
// groove-aware services and manage SPEC §4 lifecycle connections. The
// extension handles the cross-origin fetch; the page gets a clean async API.
//
// Security: only groove protocol messages are relayed. No arbitrary HTTP.
// The extension's origin permissions restrict which localhost ports are
// reachable (generated from registry/groove-registry.json).

// Listen for groove requests from the page.
window.addEventListener("groove:request", async (event) => {
  const { id, type, payload } = event.detail || {};
  if (!id || !type) return;

  try {
    const response = await browser.runtime.sendMessage({
      type: `groove:${type}`,
      ...payload,
    });

    window.dispatchEvent(
      new CustomEvent("groove:response", {
        detail: { id, ok: true, data: response },
      })
    );
  } catch (err) {
    window.dispatchEvent(
      new CustomEvent("groove:response", {
        detail: { id, ok: false, error: err.message },
      })
    );
  }
});

// Inject the page-visible API.
const script = document.createElement("script");
script.textContent = `
(function() {
  // Groove Browser API — available to any page when the extension is active.
  // All methods are async and return Promises.
  let _reqId = 0;
  const _pending = new Map();

  window.addEventListener("groove:response", (e) => {
    const { id, ok, data, error } = e.detail || {};
    const resolve = _pending.get(id);
    if (resolve) {
      _pending.delete(id);
      resolve(ok ? data : { error });
    }
  });

  function grooveRequest(type, payload = {}) {
    return new Promise((resolve) => {
      const id = ++_reqId;
      _pending.set(id, resolve);
      window.dispatchEvent(new CustomEvent("groove:request", {
        detail: { id, type, payload }
      }));
      // Timeout after 5 seconds.
      setTimeout(() => {
        if (_pending.has(id)) {
          _pending.delete(id);
          resolve({ error: "timeout" });
        }
      }, 5000);
    });
  }

  window.groove = {
    // Probe all registry targets now.
    discover: () => grooveRequest("discover"),

    // Get current status of all grooves (discovered/connected/degraded).
    status: () => grooveRequest("status"),

    // Find which service provides a capability type (e.g. "voice").
    findCapability: (capability) => grooveRequest("find-capability", { capability }),

    // Open a lifecycle connection to a discovered service (SPEC §4.2).
    connect: (service) => grooveRequest("connect", { service }),

    // Close a connection; its handle is linearly consumed (SPEC §4.5).
    disconnect: (service) => grooveRequest("disconnect", { service }),

    // Get the last persisted registry summary.
    summary: () => grooveRequest("summary"),
  };

  // Signal that the groove API is available.
  window.dispatchEvent(new Event("groove:ready"));
})();
`;
document.documentElement.appendChild(script);
script.remove();
