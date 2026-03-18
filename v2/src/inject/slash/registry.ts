/**
 * Slash command registry.
 *
 * Merges built-in command definitions with the user's per-command overrides
 * (global + instance) to produce fully-resolved SlashCommand objects.
 *
 * Merge hierarchy (later wins):
 *   1. built-in defaults
 *   2. global commandOverrides[id]
 *   3. instance commandOverrides[id]
 */

import { BUILT_IN_COMMANDS, BUILT_IN_COMMAND_MAP } from './built-in';
import type { SlashCommand, SlashCommandOverride, CustomSlashCommand } from '@shared/types/command';
import type { ValidatedGlobalSettings } from '@shared/settings/schema';

export interface ResolvedCommand extends SlashCommand {
  /** Resolved filter values (defaultValue merged with any overrides) */
  resolvedFilterValues: Record<string, string | number | boolean>;
  /** True if this command came from the user's custom command list */
  isCustom: boolean;
}

/**
 * Resolve a single command by merging the built-in definition with any
 * per-command override from settings.
 */
function resolveOne(
  base: SlashCommand,
  override: SlashCommandOverride | undefined,
  isCustom: boolean
): ResolvedCommand {
  const merged: SlashCommand = override
    ? {
        ...base,
        ...(override.label !== undefined && { label: override.label }),
        ...(override.hint !== undefined && { hint: override.hint }),
        ...(override.urlTemplate !== undefined && { urlTemplate: override.urlTemplate }),
        ...(override.resultFields !== undefined && { resultFields: override.resultFields }),
        ...(override.inlineOverrideUrl !== undefined && {
          inlineOverrideUrl: override.inlineOverrideUrl,
        }),
      }
    : base;

  // Build resolved filter values: start from each filter's defaultValue, then
  // apply any per-key overrides from the command override.
  const resolvedFilterValues: Record<string, string | number | boolean> = {};
  for (const filter of merged.filters) {
    resolvedFilterValues[filter.key] =
      override?.filterValues?.[filter.key] ?? filter.defaultValue;
  }

  return { ...merged, resolvedFilterValues, isCustom };
}

/**
 * Build the full resolved command list for the current context.
 *
 * @param settings  Fully resolved settings (global + instance already merged)
 * @returns         Array of ResolvedCommand, with disabled commands excluded
 */
export function buildRegistry(
  settings: Pick<
    ValidatedGlobalSettings,
    'commandOverrides' | 'disabledCommands' | 'customCommands'
  >
): ResolvedCommand[] {
  const { commandOverrides, disabledCommands, customCommands } = settings;
  const disabledSet = new Set(disabledCommands);

  const resolved: ResolvedCommand[] = [];

  // Built-in commands
  for (const cmd of BUILT_IN_COMMANDS) {
    if (disabledSet.has(cmd.id)) continue;
    const override = commandOverrides[cmd.id];
    if (override?.disabled) continue;
    resolved.push(resolveOne(cmd, override, false));
  }

  // Custom commands
  for (const custom of customCommands as CustomSlashCommand[]) {
    if (disabledSet.has(custom.id)) continue;
    const override = commandOverrides[custom.id];
    if (override?.disabled) continue;
    const resolvedFilterValues: Record<string, string | number | boolean> = {};
    for (const filter of custom.filters) {
      resolvedFilterValues[filter.key] =
        custom.filterValues?.[filter.key] ??
        override?.filterValues?.[filter.key] ??
        filter.defaultValue;
    }
    resolved.push({ ...custom, resolvedFilterValues, isCustom: true });
  }

  return resolved;
}

/**
 * Build a fast lookup map from the resolved registry.
 */
export function buildRegistryMap(
  registry: ResolvedCommand[]
): Map<string, ResolvedCommand> {
  return new Map(registry.map((cmd) => [cmd.id, cmd]));
}

/** Convenience: get a single resolved command (or undefined if not found / disabled) */
export function resolveCommand(
  id: string,
  settings: Pick<
    ValidatedGlobalSettings,
    'commandOverrides' | 'disabledCommands' | 'customCommands'
  >
): ResolvedCommand | undefined {
  const base = BUILT_IN_COMMAND_MAP.get(id);
  if (!base) {
    const custom = (settings.customCommands as CustomSlashCommand[]).find(
      (c) => c.id === id
    );
    if (!custom) return undefined;
    return resolveOne(custom, settings.commandOverrides[id], true);
  }
  if (new Set(settings.disabledCommands).has(id)) return undefined;
  const override = settings.commandOverrides[id];
  if (override?.disabled) return undefined;
  return resolveOne(base, override, false);
}
