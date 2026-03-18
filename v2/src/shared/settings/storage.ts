/**
 * Type-safe chrome.storage wrapper for SN Utils settings.
 *
 * Storage layout
 * ──────────────
 *   sync:  "snusettings"           → ValidatedGlobalSettings (main blob)
 *   sync:  "snusettings_overflow"  → partial settings that exceeded 8KB sync quota
 *   sync:  "{host}-instancesettings" → ValidatedInstanceSettings
 *   local: "snusettings_local"     → items overflowed from sync (>5000 chars)
 *   local: "{host}-tables-{ds}"    → cached table list
 *   local: "{host}-tables-{ds}-date" → ISO date of that cache
 *   local: "popupSize"             → { width, height }
 */

import { GlobalSettingsSchema, InstanceSettingsSchema } from './schema';
import type { ValidatedGlobalSettings, ValidatedInstanceSettings } from './schema';
import { DEFAULT_GLOBAL_SETTINGS } from './defaults';

const GLOBAL_KEY = 'snusettings';
const LOCAL_OVERFLOW_KEY = 'snusettings_local';
const SYNC_QUOTA_BYTES = 5000; // conservative threshold

// ── Helpers ──────────────────────────────────────────────────────────────────

function instanceKey(host: string): string {
  return `${host}-instancesettings`;
}

function syncGet<T>(keys: string | string[]): Promise<Record<string, T>> {
  return new Promise((resolve) =>
    chrome.storage.sync.get(keys, (items) => resolve(items as Record<string, T>))
  );
}

function syncSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) =>
    chrome.storage.sync.set(items, () =>
      chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve()
    )
  );
}

function localGet<T>(keys: string | string[]): Promise<Record<string, T>> {
  return new Promise((resolve) =>
    chrome.storage.local.get(keys, (items) => resolve(items as Record<string, T>))
  );
}

function localSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) =>
    chrome.storage.local.set(items, () =>
      chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve()
    )
  );
}

// ── Global settings ───────────────────────────────────────────────────────────

/**
 * Load global settings, merging sync storage with local overflow.
 * Unknown / invalid values are stripped and replaced with defaults via Zod.
 */
export async function loadGlobalSettings(): Promise<ValidatedGlobalSettings> {
  const [syncData, localData] = await Promise.all([
    syncGet<unknown>(GLOBAL_KEY),
    localGet<unknown>(LOCAL_OVERFLOW_KEY),
  ]);

  const raw = {
    ...DEFAULT_GLOBAL_SETTINGS,
    ...(syncData[GLOBAL_KEY] as object | undefined ?? {}),
    ...(localData[LOCAL_OVERFLOW_KEY] as object | undefined ?? {}),
  };

  const parsed = GlobalSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_GLOBAL_SETTINGS;
}

/**
 * Persist global settings.  Items serialised > SYNC_QUOTA_BYTES are split off
 * to local storage so the sync quota is not exceeded.
 */
export async function saveGlobalSettings(settings: ValidatedGlobalSettings): Promise<void> {
  const fullJson = JSON.stringify(settings);

  if (fullJson.length <= SYNC_QUOTA_BYTES) {
    await Promise.all([
      syncSet({ [GLOBAL_KEY]: settings }),
      // Clear any previous overflow
      localSet({ [LOCAL_OVERFLOW_KEY]: {} }),
    ]);
    return;
  }

  // Split large items (customCommands, commandOverrides) to local overflow
  const { customCommands, commandOverrides, ...rest } = settings;
  const overflow = { customCommands, commandOverrides };

  await Promise.all([
    syncSet({ [GLOBAL_KEY]: rest }),
    localSet({ [LOCAL_OVERFLOW_KEY]: overflow }),
  ]);
}

// ── Instance settings ─────────────────────────────────────────────────────────

export async function loadInstanceSettings(
  host: string
): Promise<ValidatedInstanceSettings> {
  const data = await syncGet<unknown>(instanceKey(host));
  const raw = data[instanceKey(host)];
  if (!raw) return {};
  const parsed = InstanceSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export async function saveInstanceSettings(
  host: string,
  settings: ValidatedInstanceSettings
): Promise<void> {
  await syncSet({ [instanceKey(host)]: settings });
}

// ── Resolved settings ─────────────────────────────────────────────────────────

/**
 * Return the effective settings for a given host: global defaults merged with
 * instance overrides.  commandOverrides and disabledCommands are deep-merged
 * rather than replaced.
 */
export async function loadResolvedSettings(
  host: string
): Promise<ValidatedGlobalSettings & ValidatedInstanceSettings> {
  const [global, instance] = await Promise.all([
    loadGlobalSettings(),
    loadInstanceSettings(host),
  ]);

  return {
    ...global,
    ...instance,
    commandOverrides: {
      ...global.commandOverrides,
      ...instance.commandOverrides,
    },
    disabledCommands: [
      ...new Set([
        ...(global.disabledCommands ?? []),
        ...(instance.disabledCommands ?? []),
      ]),
    ],
    customCommands: [
      ...(global.customCommands ?? []),
      ...(instance.customCommands ?? []),
    ],
  };
}

// ── Cache helpers (tables, nodes) ─────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export async function loadCachedList<T>(
  host: string,
  dataset: string
): Promise<T[] | null> {
  const key = `${host}-${dataset}`;
  const dateKey = `${key}-date`;
  const data = await localGet<unknown>([key, dateKey]);

  const dateStr = data[dateKey] as string | undefined;
  if (!dateStr) return null;

  const age = Date.now() - new Date(dateStr).getTime();
  if (age > CACHE_TTL_MS) return null;

  return (data[key] as T[] | undefined) ?? null;
}

export async function saveCachedList<T>(
  host: string,
  dataset: string,
  items: T[]
): Promise<void> {
  const key = `${host}-${dataset}`;
  await localSet({ [key]: items, [`${key}-date`]: new Date().toISOString() });
}
