import { z } from 'zod';

// ── Sub-schemas ──────────────────────────────────────────────────────────────

export const ConfigurableFilterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['encoded_query', 'number', 'boolean', 'text', 'url']),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]),
  description: z.string().optional(),
});

export const SlashCommandSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  hint: z.string(),
  urlTemplate: z.string(),
  resultFields: z.string().optional(),
  inlineOverrideUrl: z.string().optional(),
  inlineOnly: z.boolean().optional(),
  filters: z.array(ConfigurableFilterSchema),
  tags: z.array(z.string()).optional(),
  nextOnly: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

const FilterValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const SlashCommandOverrideSchema = z.object({
  label: z.string().optional(),
  hint: z.string().optional(),
  urlTemplate: z.string().optional(),
  resultFields: z.string().optional(),
  inlineOverrideUrl: z.string().optional(),
  disabled: z.boolean().optional(),
  filterValues: z.record(FilterValueSchema).optional(),
}).strict();

export const CustomSlashCommandSchema = SlashCommandSchema.extend({
  filterValues: z.record(FilterValueSchema).optional(),
});

export const FaviconBadgeSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().default(''),
  bgColor: z.string().default('#e00'),
  textColor: z.string().default('#fff'),
  width: z.number().int().min(1).default(16),
  height: z.number().int().min(1).default(16),
  fontSize: z.number().min(1).default(10),
});

// ── Global settings schema ───────────────────────────────────────────────────

export const GlobalSettingsSchema = z.object({
  // Slash popup
  slashTheme: z.enum(['dark', 'light', 'stealth', 'theme']).default('dark'),
  slashActivationMode: z.enum(['on', 'ctrl', 'off']).default('on'),
  slashHistorySize: z.number().int().min(0).max(200).default(50),
  slashNavigatorSearch: z.boolean().default(false),
  slashPopupPriority: z.boolean().default(false),

  // Command customisation
  commandOverrides: z.record(SlashCommandOverrideSchema).default({}),
  disabledCommands: z.array(z.string()).default([]),
  customCommands: z.array(CustomSlashCommandSchema).default([]),

  // Editor / ScriptSync
  vsScriptSync: z.boolean().default(false),
  codeEditor: z.boolean().default(true),
  applyBgsEditor: z.boolean().default(false),
  noPasteImage: z.boolean().default(false),
  monacoOptions: z.string().default('{}'),

  // UI tweaks
  addTechnicalNames: z.boolean().default(false),
  technicalNamesRegex: z.string().default(''),
  listFields: z.string().default(''),
  highlightDefaultUpdateSet: z.boolean().default(true),
  hideNonEssentialUiElements: z.boolean().default(false),
  instanceTag: z.boolean().default(false),

  // Misc
  openTabOnUpdate: z.boolean().default(false),
  changelogSeenVersion: z.string().default(''),
});

export const InstanceSettingsSchema = GlobalSettingsSchema.partial().extend({
  faviconBadge: FaviconBadgeSchema.optional(),
  commandOverrides: z.record(SlashCommandOverrideSchema).optional(),
  disabledCommands: z.array(z.string()).optional(),
  customCommands: z.array(CustomSlashCommandSchema).optional(),
});

// ── Inferred TypeScript types ─────────────────────────────────────────────────
// These are identical to the manual types in shared/types/settings.ts but
// are derived from the schema, giving us a single source of truth for
// validation.  Both sets of types are exported; the schema-derived ones are
// used inside the settings module, the manual ones are used elsewhere for
// clarity.

export type ValidatedGlobalSettings = z.infer<typeof GlobalSettingsSchema>;
export type ValidatedInstanceSettings = z.infer<typeof InstanceSettingsSchema>;
export type ValidatedFaviconBadge = z.infer<typeof FaviconBadgeSchema>;
