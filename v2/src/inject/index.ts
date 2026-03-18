/**
 * SN Utils v2 – Main Inject Script
 *
 * Runs inside the ServiceNow page context (not the extension context).
 * Bootstraps all injected features once settings are received from the
 * content script via the 'snuSettingsAdded' custom event.
 */

import type { ValidatedGlobalSettings } from '@shared/settings/schema';
import type { ResolvedSettings } from '@shared/types/settings';
import { buildRegistry, buildRegistryMap } from './slash/registry';

// Module-level state
let settings: ResolvedSettings | null = null;

// ── Settings bootstrap ────────────────────────────────────────────────────────

document.addEventListener('snuSettingsAdded', (e) => {
  settings = (e as CustomEvent<ResolvedSettings>).detail;
  onSettingsReady(settings);
});

// Allow settings to be refreshed at runtime (e.g. after user changes in popup)
document.addEventListener('snuSettingsUpdated', (e) => {
  settings = (e as CustomEvent<ResolvedSettings>).detail;
  onSettingsReady(settings);
});

// ── Feature initialisation ────────────────────────────────────────────────────

function onSettingsReady(s: ResolvedSettings): void {
  // Slash command popup
  initSlashCommands(s);

  // Technical names
  if (s.addTechnicalNames) {
    import('./features/technical-names').then((m) => m.init(s));
  }

  // ScriptSync / VS Code token
  if (s.vsScriptSync) {
    import('./features/scriptsync').then((m) => m.init());
  }
}

// ── Slash command bootstrap ───────────────────────────────────────────────────

function initSlashCommands(s: ValidatedGlobalSettings): void {
  if (s.slashActivationMode === 'off') return;

  // Build the registry from settings (built-ins + user overrides + custom)
  const registry = buildRegistry(s);
  const registryMap = buildRegistryMap(registry);

  import('./slash/ui/popup').then((m) => {
    m.init({
      registry,
      registryMap,
      settings: s,
    });
  });
}

// ── Cross-frame message handler ───────────────────────────────────────────────
// The content script relays background messages as DOM events here.

document.addEventListener('snuProcessEvent', (e) => {
  const detail = (e as CustomEvent<Record<string, unknown>>).detail;
  handleProcessEvent(detail);
});

function handleProcessEvent(detail: Record<string, unknown>): void {
  const action = detail.action as string;

  switch (action) {
    case 'showTechnicalNames':
      import('./features/technical-names').then((m) => m.toggle());
      break;
    case 'slashcommand':
      import('./slash/ui/popup').then((m) => m.show());
      break;
    case 'slashcommandShortcut':
      import('./slash/ui/popup').then((m) => m.runShortcut());
      break;
    case 'pop':
      import('./features/pop').then((m) => m.toggle());
      break;
    case 'impersonate':
      import('./features/impersonate').then((m) =>
        m.show({ query: detail.query as string })
      );
      break;
    case 'openTabInStudio':
      import('./features/studio').then((m) => m.openTab(detail.payload));
      break;
    default:
      break;
  }
}
