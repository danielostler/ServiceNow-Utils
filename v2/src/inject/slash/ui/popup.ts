/**
 * Slash command popup UI
 *
 * TODO: Implement full Preact/vanilla UI ported from inject.js lines 3520–3668.
 * This stub wires up the public API used by the inject entry point.
 */

import type { ResolvedCommand } from '../registry';
import type { ValidatedGlobalSettings } from '@shared/settings/schema';
import { resolveTemplate } from '@shared/utils/url-template';

interface PopupOptions {
  registry: ResolvedCommand[];
  registryMap: Map<string, ResolvedCommand>;
  settings: ValidatedGlobalSettings;
}

let _opts: PopupOptions | null = null;
let _visible = false;

export function init(opts: PopupOptions): void {
  _opts = opts;
  // TODO: Create and attach popup DOM element
}

export function show(): void {
  _visible = true;
  // TODO: Display popup, focus input
}

export function hide(): void {
  _visible = false;
  // TODO: Hide popup
}

export function toggle(): void {
  _visible ? hide() : show();
}

export function runShortcut(): void {
  if (!_opts) return;
  const shortcut = _opts.registryMap.get('shortcut');
  if (!shortcut) return;
  executeCommand(shortcut, '');
}

export function executeCommand(cmd: ResolvedCommand, input: string): void {
  if (cmd.urlTemplate === '*') {
    // Handled entirely in JS — dispatch to feature handler
    document.dispatchEvent(
      new CustomEvent('snuProcessEvent', {
        detail: { action: cmd.id, input },
      })
    );
    return;
  }

  const url = resolveTemplate(cmd.urlTemplate, {
    input,
    table: getPageTable(),
    sysId: getPageSysId(),
    encodedQuery: getPageEncodedQuery(),
    filterValues: cmd.resolvedFilterValues,
  });

  window.location.assign(url);
}

// ── Page context helpers ──────────────────────────────────────────────────────
// These reach into ServiceNow's global scope via type assertions.

function getPageTable(): string {
  const g = window as unknown as Record<string, unknown>;
  return (g['g_form'] as { getTableName?: () => string } | undefined)
    ?.getTableName?.() ?? '';
}

function getPageSysId(): string {
  const g = window as unknown as Record<string, unknown>;
  return (g['g_form'] as { getUniqueValue?: () => string } | undefined)
    ?.getUniqueValue?.() ?? '';
}

function getPageEncodedQuery(): string {
  const g = window as unknown as Record<string, unknown>;
  return (g['g_list'] as { getQuery?: () => string } | undefined)
    ?.getQuery?.() ?? '';
}
