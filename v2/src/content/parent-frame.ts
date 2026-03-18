/**
 * Content script – runs in the TOP frame only.
 *
 * Responsibilities:
 *   1. Verify this is an actual ServiceNow instance (cookie check via background)
 *   2. Load and pass resolved settings to injected scripts
 *   3. Inject the main script (src/inject/index.ts) into the page context
 *   4. Conditionally inject the Next Experience script
 *   5. Initialise favicon badge via Tinycon
 */

import { loadResolvedSettings } from '@shared/settings/storage';
import { currentInstance } from '@shared/utils/instance';

// ── Instance verification ─────────────────────────────────────────────────────

async function isServiceNowInstance(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { event: 'checkisservicenowinstance', origin: window.location.origin },
      (isInstance: boolean) => resolve(!!isInstance)
    );
  });
}

// ── Script injection ──────────────────────────────────────────────────────────

function injectScript(url: string, onload?: () => void): void {
  const script = document.createElement('script');
  script.src = url;
  script.type = 'module';
  if (onload) script.onload = onload;
  (document.head || document.documentElement).appendChild(script);
}

function isNextExperience(): boolean {
  return (
    window.location.pathname.startsWith('/now/') ||
    document.documentElement.getAttribute('data-experience') === 'next'
  );
}

function isFlowDesigner(): boolean {
  return window.location.pathname.includes('flow-designer');
}

// ── Favicon badge ─────────────────────────────────────────────────────────────

function initFaviconBadge(
  badge: { enabled: boolean; text: string; bgColor: string; textColor: string; width: number; height: number; fontSize: number }
): void {
  if (!badge.enabled || !badge.text) return;

  // Dynamically load Tinycon (bundled as an asset)
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('js/Tinycon.js');
  script.onload = () => {
    const Tinycon = (window as unknown as Record<string, unknown>)['Tinycon'] as {
      setOptions: (o: object) => void;
      setBubble: (text: string) => void;
    } | undefined;
    if (!Tinycon) return;
    Tinycon.setOptions({
      background: badge.bgColor,
      color: badge.textColor,
      width: badge.width,
      height: badge.height,
      font: `${badge.fontSize}px arial`,
      fallback: false,
    });
    Tinycon.setBubble(badge.text);
  };
  document.head.appendChild(script);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const confirmed = await isServiceNowInstance();
  if (!confirmed) return;

  const host = currentInstance();
  const settings = await loadResolvedSettings(host);

  // Pass settings into the injected page scripts via a custom event
  // (injected scripts listen for 'snuSettingsAdded')
  function dispatchSettings(): void {
    document.dispatchEvent(
      new CustomEvent('snuSettingsAdded', { detail: settings })
    );
  }

  // Inject main script
  injectScript(chrome.runtime.getURL('src/inject/index.ts'), () => {
    dispatchSettings();

    // Next Experience additional script
    if (isNextExperience()) {
      injectScript(chrome.runtime.getURL('src/inject/next-experience/index.ts'));
    }

    // Flow Designer script
    if (isFlowDesigner()) {
      injectScript(chrome.runtime.getURL('src/inject/features/flow-designer.ts'));
    }
  });

  // Favicon badge
  if (settings.faviconBadge) {
    initFaviconBadge(settings.faviconBadge);
  }
}

main().catch(console.error);
