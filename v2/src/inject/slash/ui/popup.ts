/**
 * Slash command popup UI
 *
 * Ported from inject.js lines 3520–3800 (show/hide/listener) and
 * 1407–1508 (hint rendering).
 *
 * Manages the DOM overlay, keyboard navigation, hint list, and command execution.
 */

import type { ResolvedCommand } from '../registry';
import type { ValidatedGlobalSettings } from '@shared/settings/schema';
import { resolveTemplate } from '@shared/utils/url-template';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PopupOptions {
  registry: ResolvedCommand[];
  registryMap: Map<string, ResolvedCommand>;
  settings: ValidatedGlobalSettings;
}

// ── Module state ──────────────────────────────────────────────────────────────

let _opts: PopupOptions | null = null;
let _visible = false;
let _hintIndex = 0;
let _maxHints = 10;
let _currentHints: ResolvedCommand[] = [];
let _historyLog: string[] = [];
let _historyIndex = -1;

// ── CSS themes ────────────────────────────────────────────────────────────────

function isPolarisEnabled(): boolean {
  return document.querySelector('link#polaris_theme_variables') !== null ||
    getComputedStyle(document.documentElement).getPropertyValue('--now-color_text--primary').trim() !== '';
}

function buildCss(theme: ValidatedGlobalSettings['slashTheme']): string {
  if (theme === 'light') {
    return `<style>
div.snutils{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;z-index:10000000000000;font-size:8pt;position:fixed;top:10px;left:10px;min-height:50px;padding:5px;border:1px solid #E3E3E3;background-color:#FFFFFFF7;border-radius:2px;min-width:320px;color:black;}
div.snuheader{font-weight:bold;margin:-4px;background-color:#e5e5e5}
ul#snuhelper{list-style-type:none;padding-left:2px;overflow-y:auto;max-height:80vh;}
ul#snuhelper li{margin-top:2px}
span.cmdkey{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;border:1pt solid #e3e3e3;background-color:#f3f3f3;min-width:40px;cursor:pointer;display:inline-block;}
input.snutils{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;outline:none;font-size:10pt;font-weight:bold;width:99%;border:1px solid #ffffff;margin:8px 2px 4px 2px;background-color:#ffffff}
span.cmdlabel{color:#333333;font-size:7pt;font-family:verdana,arial}
ul#snuhelper li:hover span.cmdkey,ul#snuhelper li.active span.cmdkey{border-color:#8BB3A2}
ul#snuhelper li.active span.cmdlabel{color:black}
div#snudirectlinks{margin:-5px 10px;padding-bottom:10px;}
div#snudirectlinks a{color:#22885c;text-decoration:none;}
div.snufadein{animation:snuFadeIn 0.5s;}
@keyframes snuFadeIn{0%{opacity:0;}30%{opacity:0;}100%{opacity:1;}}
</style>`;
  }

  if (theme === 'stealth') {
    return `<style>
div.snutils{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;z-index:1000000000000;font-size:10pt;position:fixed;top:1px;left:1px;padding:0;border:0;min-width:30px;}
div.snuheader{display:none}
ul#snuhelper{display:none}
ul#snuhelper li{display:none}
span.cmdkey{display:none}
input.snutils{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;outline:none;font-size:8pt;background:transparent;text-shadow:-1px 0 white,0 1px white,1px 0 white,0 -1px white;width:100%;border:0;margin:8px 2px 4px 2px;}
span.cmdlabel{display:none}
div#snudirectlinks{display:none;}
</style>`;
  }

  if (theme === 'theme' && isPolarisEnabled()) {
    return `<style>
div.snutils{font-family:Menlo,Monaco,Consolas,'Courier New',monospace;color:rgb(var(--now-color_text--primary));z-index:1000000000000;font-size:8pt;position:fixed;top:10px;left:10px;min-height:50px;padding:5px;border:1px solid rgb(var(--now-color_background--secondary));background-color:rgb(var(--now-color_background--primary));border-radius:10px;min-width:320px;}
div.snuheader{font-weight:bold;margin:-4px;background-color:rgb(var(--now-color_surface--neutral-3));border-radius:10px 10px 0 0;}
ul#snuhelper{list-style-type:none;padding-left:2px;overflow-y:auto;max-height:80vh;}
ul#snuhelper li{margin-top:2px}
span.cmdkey{font-family:Menlo,Monaco,Consolas,'Courier New',monospace;border:1pt solid rgb(var(--now-button--secondary--border-color));background-color:rgb(var(--now-color_background--secondary));color:rgb(var(--now-button--secondary--color));min-width:40px;cursor:pointer;display:inline-block;}
input.snutils{font-family:Menlo,Monaco,Consolas,'Courier New',monospace;outline:none;font-size:10pt;color:rgb(var(--now-text-link--primary--color));font-weight:bold;width:99%;border:1px solid rgb(var(--now-form-field--border-color));margin:8px 2px 4px 2px;background-color:rgb(var(--now-color_background--secondary));}
span.cmdlabel{color:rgb(var(--now-color_text--primary));font-size:7pt;}
ul#snuhelper li:hover span.cmdkey,ul#snuhelper li.active span.cmdkey{border-color:rgb(var(--now-text-link--primary--color));}
ul#snuhelper li.active span.cmdlabel{color:rgb(var(--now-text-link--primary--color));}
div#snudirectlinks{margin:-5px 10px;padding-bottom:10px;}
div#snudirectlinks a{color:rgb(var(--now-button--bare_primary--color));text-decoration:none;}
div.snufadein{animation:snuFadeIn 0.5s;}
@keyframes snuFadeIn{0%{opacity:0;}30%{opacity:0;}100%{opacity:1;}}
</style>`;
  }

  // dark (default)
  return `<style>
div.snutils{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;color:#ffffff;z-index:1000000000000;font-size:8pt;position:fixed;top:10px;left:10px;min-height:50px;padding:5px;background-color:#000000F7;min-width:320px;border:#333333 1pt solid;border-radius:10px;}
div.snuheader{font-weight:bold;margin:-4px;background-color:#333333;border-radius:10px 10px 0 0;}
ul#snuhelper{list-style-type:none;padding-left:2px;overflow-y:auto;max-height:80vh;}
ul#snuhelper li{margin-top:2px}
span.cmdkey{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;border:1pt solid #00e676;background-color:#00e676;color:#000000;min-width:40px;cursor:pointer;display:inline-block;}
input.snutils{font-family:Menlo,Monaco,Consolas,"Courier New",monospace;outline:none;font-size:10pt;color:#00e676;font-weight:bold;width:99%;border:1px solid #000000;margin:8px 2px 4px 2px;background-color:#000000F7}
span.cmdlabel{color:#FFFFFF;font-size:7pt;}
ul#snuhelper li:hover span.cmdkey,ul#snuhelper li.active span.cmdkey{border-color:yellow}
ul#snuhelper li.active span.cmdlabel{color:yellow}
div#snudirectlinks{margin:-5px 10px;padding-bottom:10px;}
div#snudirectlinks a{color:#1cad6e;text-decoration:none;}
div.snufadein{animation:snuFadeIn 0.5s;}
@keyframes snuFadeIn{0%{opacity:0;}30%{opacity:0;}100%{opacity:1;}}
</style>`;
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function topDoc(): Document {
  try {
    return (window.top ?? window).document;
  } catch {
    return window.document;
  }
}

function getInput(): HTMLInputElement | null {
  return topDoc().getElementById('snufilter') as HTMLInputElement | null;
}

function getPopup(): HTMLElement | null {
  return topDoc().querySelector('div.snutils');
}

function getHelper(): HTMLUListElement | null {
  return topDoc().getElementById('snuhelper') as HTMLUListElement | null;
}

// ── History ───────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'snutils-slash-history';

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveHistory(log: string[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(log));
  } catch {
    // ignore – localStorage may be blocked
  }
}

function pushHistory(value: string): void {
  const max = _opts?.settings.slashHistorySize ?? 50;
  if (max === 0 || !value || value === '/') return;
  const log = loadHistory().filter((v) => v !== value);
  log.unshift(value);
  saveHistory(log.slice(0, max));
}

// ── HTML escaping ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Hint rendering ────────────────────────────────────────────────────────────

function renderHints(shortcut: string): void {
  if (!_opts) return;
  const helper = getHelper();
  if (!helper) return;

  const q = shortcut.trim().toLowerCase();
  _currentHints = q
    ? _opts.registry.filter((c) => c.id.startsWith(q))
    : _opts.registry;

  const total = _currentHints.length;
  const shown = Math.min(total, _maxHints);
  let html = '';

  for (let i = 0; i < shown; i++) {
    const cmd = _currentHints[i];
    const active = i === _hintIndex ? ' active' : '';
    html +=
      `<li id="cmd${esc(cmd.id)}" data-index="${i}" class="cmdfilter${active}">` +
      `<span class="cmdkey">/${esc(cmd.id)}</span> ` +
      `<span class="cmdlabel">${esc(cmd.hint)}</span></li>`;
  }

  if (total > _maxHints) {
    html += `<li class="cmdexpand"><span class="cmdkey">+${total - _maxHints}</span> ▼ show all</li>`;
  }

  helper.innerHTML = html;

  helper.querySelectorAll<HTMLLIElement>('li.cmdfilter').forEach((li) => {
    li.addEventListener('click', () => {
      const idx = Number(li.dataset.index ?? 0);
      const cmd = _currentHints[idx];
      if (!cmd) return;
      const input = getInput();
      if (input) {
        input.value = `/${cmd.id} `;
        input.focus();
      }
      _hintIndex = idx;
      renderHints(cmd.id);
    });
  });

  helper.querySelectorAll<HTMLLIElement>('li.cmdexpand').forEach((li) => {
    li.addEventListener('click', () => {
      _maxHints = 1000;
      renderHints(shortcut);
    });
  });

  // Update command count
  const countEl = topDoc().getElementById('snuslashcount');
  if (countEl) countEl.textContent = `${shown}/${_opts.registry.length}`;
}

// ── DOM creation ──────────────────────────────────────────────────────────────

function createPopupElement(): void {
  const doc = topDoc();
  if (doc.querySelector('.snutils.-polaris')) return; // already injected

  const css = buildCss(_opts?.settings.slashTheme ?? 'dark');

  const wrapper = doc.createElement('div');
  wrapper.innerHTML =
    css +
    `<div class="snutils -polaris" style="display:none;">
      <div class="snuheader">
        <a id="cmdhidedot" class="cmdlink" href="#" style="text-decoration:none;vertical-align:middle;">
          <svg style="height:16px;width:16px;vertical-align:middle;">
            <circle cx="8" cy="8" r="5" fill="#FF605C"/>
          </svg>
        </a>
        Slash commands
        <span id="snuslashcount" style="font-weight:normal;font-size:7pt;margin-left:4px;"></span>
      </div>
      <input id="snufilter" name="snufilter"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        aria-autocomplete="both" aria-haspopup="false"
        class="snutils" type="text" placeholder="SN Utils slash command" />
      <ul id="snuhelper"></ul>
      <div id="snudirectlinks"></div>
    </div>`;

  try {
    doc.body.appendChild(wrapper);

    const hideDot = doc.getElementById('cmdhidedot');
    hideDot?.addEventListener('click', (e) => {
      e.preventDefault();
      hide();
    });

    const input = getInput();
    input?.addEventListener('focus', function () {
      this.select();
    });

    setTimeout(() => attachKeyboardListener(), 200);
  } catch (e) {
    console.warn('[SN Utils] Failed to inject popup UI:', e);
  }
}

// ── Keyboard listener (on #snufilter) ─────────────────────────────────────────

function attachKeyboardListener(): void {
  const input = getInput();
  if (!input) return;
  if (input.classList.contains('snu-slashcommand')) return; // guard: attach only once
  input.classList.add('snu-slashcommand');

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Shift') return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (_hintIndex > 0) {
        _hintIndex--;
        const shortcut = parseShortcut(input.value);
        renderHints(shortcut);
      } else {
        // Navigate history
        _historyLog = loadHistory();
        if (_historyLog.length) {
          _historyIndex = Math.min(_historyIndex + 1, _historyLog.length - 1);
          input.value = _historyLog[_historyIndex] ?? input.value;
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (_historyIndex > 0) {
        _historyIndex--;
        _historyLog = loadHistory();
        input.value = _historyLog[_historyIndex] ?? input.value;
      } else {
        _hintIndex = Math.min(_hintIndex + 1, Math.min(_currentHints.length, _maxHints) - 1);
        const shortcut = parseShortcut(input.value);
        renderHints(shortcut);
      }
      return;
    }

    if (e.key === 'Escape') {
      hide();
      return;
    }

    if (e.key === 'Backspace' && input.value.length <= 1) {
      hide();
      return;
    }

    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      const raw = input.value;
      const shortcut = parseShortcut(raw);
      const userInput = parseUserInput(raw);

      // Prefer exact match, then first hint
      const cmd = _opts?.registryMap.get(shortcut) ?? _currentHints[_hintIndex];
      if (cmd) {
        pushHistory(raw.trim());
        hide();
        executeCommand(cmd, userInput);
      }
      return;
    }

    // Number key → trigger numbered direct link
    if (/^[0-9]$/.test(e.key)) {
      const lnk = topDoc().getElementById(`snulnk${e.key}`) as HTMLAnchorElement | null;
      if (lnk) {
        e.preventDefault();
        lnk.dispatchEvent(
          new MouseEvent('click', {
            cancelable: true,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
          })
        );
        return;
      }
    }

    // Re-render hints after value changes (on next tick so input is updated)
    setTimeout(() => {
      if (!input.value.startsWith('/')) input.value = '/' + input.value;
      const shortcut = parseShortcut(input.value);
      _hintIndex = 0;
      _historyIndex = -1;
      renderHints(shortcut);
    }, 0);
  });
}

// ── Document-level '/' activation ─────────────────────────────────────────────

function attachDocumentActivation(): void {
  document.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (!_opts) return;

      const mode = _opts.settings.slashActivationMode;
      if (mode === 'off') return;
      if (e.key !== '/') return;

      // Allow '/' in code editors (CodeMirror)
      const path = e.composedPath();
      const target = path[0] as HTMLElement | undefined;
      if (!target) return;

      if (target.className && typeof target.className === 'string' && target.className.includes('CodeMirror-code')) return;

      const tag = target.tagName ?? '';
      const needsModifier = mode === 'ctrl';
      const hasModifier = e.ctrlKey || e.metaKey;

      // In form fields, only trigger with modifier (or in the filter input itself)
      const isFormField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || target.hasAttribute('contenteditable');
      if (isFormField && target.id !== 'snufilter') {
        if (!hasModifier) return;
      }

      if (needsModifier && !hasModifier) return;

      e.preventDefault();
      show();
    },
    false
  );
}

// ── Input parsing helpers ─────────────────────────────────────────────────────

/** Extract the command id from the input value (e.g. '/imp user' → 'imp'). */
function parseShortcut(value: string): string {
  const stripped = value.startsWith('/') ? value.substring(1) : value;
  return (stripped.split(' ')[0] ?? '').trim().toLowerCase();
}

/** Extract user-supplied arguments after the command id. */
function parseUserInput(value: string): string {
  const stripped = value.startsWith('/') ? value.substring(1) : value;
  const parts = stripped.split(' ');
  return parts.slice(1).join(' ').trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function init(opts: PopupOptions): void {
  _opts = opts;
  _historyLog = loadHistory();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => createPopupElement());
  } else {
    createPopupElement();
  }

  attachDocumentActivation();
}

export function show(): void {
  const popup = getPopup();
  const input = getInput();
  if (!popup || !input) return;

  _visible = true;
  _hintIndex = 0;
  _historyIndex = -1;
  _maxHints = 10;

  popup.style.display = '';
  popup.classList.add('snufadein');

  input.value = '/';
  input.focus();

  setTimeout(() => {
    input.setSelectionRange(1, 1);
  }, 10);

  renderHints('');
}

export function hide(): void {
  const popup = getPopup();
  if (!popup) return;

  _visible = false;
  popup.style.display = 'none';
  popup.classList.remove('snufadein');
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
