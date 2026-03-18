import type { SlashCommandOverride, CustomSlashCommand } from './command';

/** Theme options for the slash command popup */
export type SlashTheme = 'dark' | 'light' | 'stealth' | 'theme';

/** How the slash command popup is triggered */
export type SlashActivationMode = 'on' | 'ctrl' | 'off';

/** Favicon badge overlay config */
export interface FaviconBadgeSettings {
  enabled: boolean;
  text: string;
  bgColor: string;
  textColor: string;
  width: number;
  height: number;
  fontSize: number;
}

/**
 * Extension-wide (global) settings.
 * Stored in chrome.storage.sync under the key "snusettings".
 */
export interface GlobalSettings {
  // ── Slash command popup ──────────────────────────────────────────────────
  slashTheme: SlashTheme;
  slashActivationMode: SlashActivationMode;
  /** Number of recently used commands to remember (0 = disabled) */
  slashHistorySize: number;
  /** Include navigator/menu items in slash command results */
  slashNavigatorSearch: boolean;
  /** Give the SN Utils popup priority over built-in keyboard shortcuts */
  slashPopupPriority: boolean;

  // ── Command customisation ────────────────────────────────────────────────
  /** Partial overrides for built-in commands, keyed by command id */
  commandOverrides: Record<string, SlashCommandOverride>;
  /** Command ids that are completely disabled */
  disabledCommands: string[];
  /** User-defined commands that appear alongside built-ins */
  customCommands: CustomSlashCommand[];

  // ── Editor / ScriptSync ──────────────────────────────────────────────────
  vsScriptSync: boolean;
  codeEditor: boolean;
  applyBgsEditor: boolean;
  noPasteImage: boolean;
  monacoOptions: string; // JSON string of Monaco editor options

  // ── UI tweaks ────────────────────────────────────────────────────────────
  addTechnicalNames: boolean;
  /** Regex used to match field names when showing technical names */
  technicalNamesRegex: string;
  /** Comma-separated list of fields to always show in list views */
  listFields: string;
  highlightDefaultUpdateSet: boolean;
  hideNonEssentialUiElements: boolean;
  instanceTag: boolean;

  // ── Miscellaneous ────────────────────────────────────────────────────────
  openTabOnUpdate: boolean;
  changelogSeenVersion: string;
}

/**
 * Per-instance settings stored in chrome.storage.sync under the key
 * "{hostname}-instancesettings".  Any field here overrides the corresponding
 * GlobalSettings value when the user is on that specific ServiceNow instance.
 */
export type InstanceSettings = Partial<GlobalSettings> & {
  faviconBadge?: FaviconBadgeSettings;
  /** Overrides for commands that apply only on this instance */
  commandOverrides?: Record<string, SlashCommandOverride>;
  disabledCommands?: string[];
  customCommands?: CustomSlashCommand[];
};

/** The full resolved settings for a given context (global merged with instance) */
export type ResolvedSettings = GlobalSettings & {
  faviconBadge: FaviconBadgeSettings;
};
