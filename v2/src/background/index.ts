/**
 * SN Utils v2 – Background Service Worker (MV3)
 *
 * Responsibilities:
 *   - Version badge (show "NEW" on significant updates)
 *   - Context menu setup (standard items + user custom commands)
 *   - Cookie-based ServiceNow instance verification
 *   - Message relay for pop-in/pop-out, code search, view-data, diff, editor
 *   - Side panel registration
 *   - Keyboard command dispatch
 */

import { loadGlobalSettings } from '@shared/settings/storage';

// ── Constants ────────────────────────────────────────────────────────────────

const SN_URL_PATTERN = 'https://*.service-now.com/*';

// ── Badge ────────────────────────────────────────────────────────────────────

function isSignificantVersionChange(oldVersion: string, newVersion: string): boolean {
  if (!oldVersion || oldVersion === 'disabled') return true;
  const o = oldVersion.split('.').map(Number);
  const n = newVersion.split('.').map(Number);
  if (o.length < 3 || n.length < 3) return true;
  for (let i = 0; i < 3; i++) {
    if (n[i] > o[i]) return true;
    if (n[i] < o[i]) return false;
  }
  const oldBuild = o[3] ?? 0;
  const newBuild = n[3] ?? 0;
  return Math.abs(newBuild - oldBuild) > 4;
}

async function updateBadge(): Promise<void> {
  const settings = await loadGlobalSettings();
  const currentVersion = chrome.runtime.getManifest().version;
  const seen = settings.changelogSeenVersion;

  if (seen === 'disabled' || !isSignificantVersionChange(seen, currentVersion)) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: 'NEW' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e42' });
  }
}

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);

// ── Side panel ───────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId) => {
  if (chrome.sidePanel) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'src/popup/index.html',
      enabled: true,
    });
  }
});

// ── Context menus ─────────────────────────────────────────────────────────────

const MENU_CONF = { documentUrlPatterns: [SN_URL_PATTERN] };

/** Standard context menu items (equivalent to the menuItems array in background.js) */
const STANDARD_MENU_ITEMS: chrome.contextMenus.CreateProperties[] = [
  {
    id: 'snu-codesearch',
    title: 'SN Utils: Code Search "%s"',
    contexts: ['selection'],
  },
  {
    id: 'snu-impersonate',
    title: 'SN Utils: Impersonate "%s"',
    contexts: ['selection'],
  },
  {
    id: 'snu-sysid',
    title: 'SN Utils: Search sys_id "%s"',
    contexts: ['selection'],
  },
];

async function initializeContextMenus(): Promise<void> {
  chrome.contextMenus.removeAll(async () => {
    for (const item of STANDARD_MENU_ITEMS) {
      chrome.contextMenus.create({ ...item, ...MENU_CONF });
    }

    // Custom commands that have opted into the context menu
    const settings = await loadGlobalSettings();
    for (const cmd of settings.customCommands) {
      if (cmd.urlTemplate.includes('contextmenu')) {
        chrome.contextMenus.create({
          id: `sc-${cmd.id}`,
          contexts: ['all'],
          title: `${cmd.hint}: %s`,
          ...MENU_CONF,
        });
      }
    }
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'snu-codesearch') {
    openTool('codesearch', tab, { query: info.selectionText ?? '' });
  } else if (info.menuItemId === 'snu-impersonate') {
    sendToContent(tab.id, { action: 'impersonate', query: info.selectionText ?? '' });
  } else if (info.menuItemId === 'snu-sysid') {
    sendToContent(tab.id, { action: 'sysidSearch', query: info.selectionText ?? '' });
  } else if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('sc-')) {
    sendToContent(tab.id, { action: 'customContextMenu', commandId: info.menuItemId.slice(3), selectionText: info.selectionText ?? '' });
  }
});

// ── Tab/window helpers ────────────────────────────────────────────────────────

let lastTabIndex = -1;
let cookieStoreId = '';

function openTool(
  tool: string,
  sourceTab: chrome.tabs.Tab,
  params: Record<string, string> = {}
): void {
  const qs = new URLSearchParams(params).toString();
  const url = chrome.runtime.getURL(`src/tools/${tool}/index.html`) + (qs ? `?${qs}` : '');
  const createProps: chrome.tabs.CreateProperties = {
    url,
    ...(cookieStoreId && { cookieStoreId }),
    ...(lastTabIndex > -1 && { index: lastTabIndex + 1 }),
  };
  chrome.tabs.create(createProps);
}

function sendToContent(tabId: number, detail: Record<string, unknown>): void {
  chrome.tabs.sendMessage(tabId, { method: 'snuProcessEvent', detail }).catch(() => {
    // Tab may not have the content script yet; silently ignore
  });
}

function popInOut(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;
    sendToContent(tab.id, { action: 'pop' });
  });
}

function addTechnicalNames(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;
    sendToContent(tab.id, { action: 'showTechnicalNames' });
  });
}

// ── Message handlers ──────────────────────────────────────────────────────────

type BackgroundMessage =
  | 'changelog_seen'
  | { event: string; command?: unknown; origin?: string };

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, sender, sendResponse) => {
    if (sender.tab?.cookieStoreId) cookieStoreId = sender.tab.cookieStoreId;
    if (sender.tab?.index !== undefined) lastTabIndex = sender.tab.index;

    // ── Changelog badge ───────────────────────────────────────────────────
    if (message === 'changelog_seen') {
      chrome.action.setBadgeText({ text: '' });
      const version = chrome.runtime.getManifest().version;
      chrome.storage.sync.set({ changelog_seen_version: version });
      return false;
    }

    if (typeof message !== 'object') return false;

    switch (message.event) {
      // ── Instance verification via cookie ────────────────────────────────
      case 'checkisservicenowinstance': {
        const params: chrome.cookies.Details = {
          name: 'glide_user_route',
          url: message.origin ?? '',
        };
        if (cookieStoreId) params.storeId = cookieStoreId;
        chrome.cookies.get(params, (cookie) => {
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          sendResponse(!!cookie || isSafari);
        });
        return true; // async
      }

      // ── Badge ────────────────────────────────────────────────────────────
      case 'updateBadge':
        updateBadge();
        return false;

      // ── Context menus ─────────────────────────────────────────────────────
      case 'initializecontextmenus':
        initializeContextMenus();
        return false;

      // ── Pop in/out ────────────────────────────────────────────────────────
      case 'pop':
        popInOut();
        return false;

      // ── Tools ─────────────────────────────────────────────────────────────
      case 'codesearch':
        if (sender.tab) openTool('codesearch', sender.tab, message.command as Record<string, string>);
        return false;

      case 'viewdata':
        if (sender.tab) openTool('viewdata', sender.tab, message.command as Record<string, string>);
        return false;

      case 'opencodediff':
        if (sender.tab) openTool('diff', sender.tab, message.command as Record<string, string>);
        return false;

      case 'opencodeeditor':
        if (sender.tab) openTool('codeeditor', sender.tab, message.command as Record<string, string>);
        return false;

      // ── Open arbitrary URL in new tab ─────────────────────────────────────
      case 'viewxml': {
        const createProps: chrome.tabs.CreateProperties = {
          url: message.command as string,
          ...(cookieStoreId && { cookieStoreId }),
          ...(lastTabIndex > -1 && { index: lastTabIndex + 1 }),
        };
        chrome.tabs.create(createProps);
        return false;
      }

      // ── Open record in ServiceNow Studio ─────────────────────────────────
      case 'openTabInStudio':
        if (sender.tab?.url) {
          const origin = new URL(sender.tab.url).origin;
          chrome.tabs.query({}, (tabs) => {
            for (const tab of tabs) {
              if (!tab.url?.startsWith('http') || !tab.id) continue;
              try {
                const tabUrl = new URL(tab.url);
                if (
                  tabUrl.pathname.startsWith('/now/servicenow-studio/') &&
                  tabUrl.origin === origin
                ) {
                  sendToContent(tab.id, { action: 'openTabInStudio', payload: message.command });
                  chrome.tabs.update(tab.id, { active: true });
                  break;
                }
              } catch {
                // invalid URL, skip
              }
            }
          });
        }
        return false;

      // ── Side panel ────────────────────────────────────────────────────────
      case 'showsidepanel':
        if (sender.tab) {
          chrome.sidePanel?.open({ tabId: sender.tab.id! });
        }
        return false;

      default:
        return false;
    }
  }
);

// ── Keyboard commands ─────────────────────────────────────────────────────────

let lastCommandTime = 0;

chrome.commands.onCommand.addListener((command) => {
  const now = Date.now();
  if (now - lastCommandTime < 500) return; // debounce double-fire
  lastCommandTime = now;

  if (command === 'show-technical-names') {
    addTechnicalNames();
  } else if (command === 'pop') {
    popInOut();
  } else if (command === 'slashcommand' || command === 'slashcommand-shortcut') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      sendToContent(tab.id, {
        action: command === 'slashcommand-shortcut' ? 'slashcommandShortcut' : 'slashcommand',
      });
    });
  }
});

// ── Initialise on service worker start ───────────────────────────────────────

initializeContextMenus();
