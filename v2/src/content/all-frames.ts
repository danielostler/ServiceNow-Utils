/**
 * Content script – runs in ALL frames (including iframes).
 *
 * Responsibilities:
 *   1. Relay settings from parent frame to injected scripts via custom events
 *   2. Forward messages from the page (injected script → background) via
 *      chrome.runtime.sendMessage
 *
 * DOMPurify is bundled via the build pipeline (no separate lib file needed).
 */

import DOMPurify from 'dompurify';

// Re-export DOMPurify on the window so injected scripts can reach it
(window as unknown as Record<string, unknown>)['DOMPurify'] = DOMPurify;

// ── Settings relay ────────────────────────────────────────────────────────────
// The parent-frame content script fetches settings and broadcasts them via
// a custom event.  Frames that receive the event forward them to their own
// injected scripts.

document.addEventListener('snu-settings-broadcast', (e) => {
  const settings = (e as CustomEvent<unknown>).detail;
  document.dispatchEvent(
    new CustomEvent('snu-settings-received', { detail: settings })
  );
});

// ── Page → background message relay ──────────────────────────────────────────
// Injected scripts run in the page context and cannot call chrome.runtime
// directly.  They dispatch a custom event which we relay here.

document.addEventListener('snutils-event', (e) => {
  const detail = (e as CustomEvent<Record<string, unknown>>).detail;
  chrome.runtime.sendMessage(detail).catch(() => {
    // Background may not be ready yet; ignore
  });
});

// ── Background → page message relay ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message?.method === 'snuProcessEvent') {
    document.dispatchEvent(
      new CustomEvent('snuProcessEvent', { detail: message.detail })
    );
  }
});
