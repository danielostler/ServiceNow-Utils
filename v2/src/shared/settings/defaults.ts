import { GlobalSettingsSchema, FaviconBadgeSchema } from './schema';
import type { ValidatedGlobalSettings, ValidatedFaviconBadge } from './schema';

/** Fully defaulted global settings object */
export const DEFAULT_GLOBAL_SETTINGS: ValidatedGlobalSettings =
  GlobalSettingsSchema.parse({});

/** Default favicon badge configuration */
export const DEFAULT_FAVICON_BADGE: ValidatedFaviconBadge =
  FaviconBadgeSchema.parse({});
