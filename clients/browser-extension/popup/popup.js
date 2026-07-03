// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
//
// Groove Discovery popup — renders the service discovery + connection status.

const servicesEl = document.getElementById("services");
const badgeEl = document.getElementById("count-badge");
const probeBtn = document.getElementById("btn-probe");

const STATUS_LABEL = {
  connected: "connected",
  discovered: "discovered",
  degraded: "degraded",
  not_found: "",
};

/**
 * Render the service list from the groove registry.
 *
 * @param {Object} registry - Map of service name → groove entry
 */
function renderServices(registry) {
  const entries = Object.values(registry);
  const live = entries.filter((e) => e.status !== "not_found").length;
  const connected = entries.filter((e) => e.status === "connected").length;

  // Update badge.
  badgeEl.textContent = connected > 0 ? `${connected} connected` : `${live} discovered`;
  badgeEl.className = live > 0 ? "badge" : "badge zero";

  if (entries.length === 0) {
    servicesEl.innerHTML = '<div class="empty">No groove targets in the registry</div>';
    return;
  }

  // Sort: connected, then discovered/degraded, then by name.
  const rank = (e) =>
    e.status === "connected" ? 0 : e.status === "degraded" ? 1 : e.status === "discovered" ? 2 : 3;
  entries.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  servicesEl.innerHTML = entries
    .map((entry) => {
      const caps = entry.capabilities?.join(", ") || "none";
      const state = STATUS_LABEL[entry.status] ?? entry.status;
      return `
        <div class="service">
          <div class="dot ${entry.status}"></div>
          <div class="service-info">
            <div class="service-name">${escapeHtml(entry.name)}${state ? ` <small>(${escapeHtml(state)})</small>` : ""}</div>
            <div class="service-caps">${escapeHtml(caps)}</div>
          </div>
          <div class="service-port">:${entry.port}</div>
        </div>
      `;
    })
    .join("");
}

/**
 * Escape HTML entities to prevent XSS.
 *
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Load the current groove status from the background script.
 */
async function loadStatus() {
  try {
    const registry = await browser.runtime.sendMessage({ type: "groove:status" });
    renderServices(registry);
  } catch (err) {
    servicesEl.innerHTML = `<div class="empty">Error: ${escapeHtml(err.message)}</div>`;
  }
}

/**
 * Trigger a full re-probe of all groove targets.
 */
async function probeAll() {
  probeBtn.textContent = "Probing...";
  probeBtn.disabled = true;

  try {
    await browser.runtime.sendMessage({ type: "groove:discover" });
    // Wait briefly for results to propagate.
    await new Promise((r) => setTimeout(r, 500));
    await loadStatus();
  } catch (err) {
    servicesEl.innerHTML = `<div class="empty">Probe failed: ${escapeHtml(err.message)}</div>`;
  }

  probeBtn.textContent = "Probe All";
  probeBtn.disabled = false;
}

// Wire up the probe button.
probeBtn.addEventListener("click", probeAll);

// Load status on popup open.
loadStatus();
