/**
 * A user-configurable filter/parameter attached to a slash command.
 * Each filter is exposed in the Settings UI so users can override the
 * default value without having to rewrite the full URL template.
 *
 * Example: the /imp command has a `query` filter whose default value is
 * "active=true^nameSTARTSWITH" — on large user tables, the user can change
 * this to something more targeted like "active=true^department=<guid>".
 */
export interface ConfigurableFilter {
  /** Unique key within this command, referenced in the URL template as {{key}} */
  key: string;
  /** Human-readable label shown in the settings editor */
  label: string;
  /** Controls the editor shown in the settings UI */
  type: 'encoded_query' | 'number' | 'boolean' | 'text' | 'url';
  /** Value used when no user override is set */
  defaultValue: string | number | boolean;
  /** Optional description / hint shown below the field in the settings editor */
  description?: string;
}

/**
 * A slash command switch / modifier (e.g. -a, -t, -s).
 * Switches are appended to the resolved URL or encoded query at runtime.
 */
export interface SlashSwitch {
  /** Short key, e.g. "a", "t", "s" */
  key: string;
  description: string;
  value: string;
  type: 'link' | 'querypart' | 'encodedquerypart' | 'prepend';
}

/**
 * A single slash command definition.
 *
 * URL template variables:
 *   $0        – full user input after the command
 *   $1, $2    – whitespace-split tokens from user input
 *   $table    – current page's table name
 *   $sysid    – current record's sys_id
 *   $encodedquery – current list's encoded query
 *   {{key}}   – replaced by the resolved value of a ConfigurableFilter
 */
export interface SlashCommand {
  /** Unique identifier (also the trigger, e.g. "imp", "br", "su") */
  id: string;
  /** Short label used in hint display */
  label: string;
  /** Full hint text shown in the slash command popup */
  hint: string;
  /**
   * URL template. Use "*" for commands that are handled entirely in JS
   * (no navigation), e.g. "imp", "elev", "tn".
   */
  urlTemplate: string;
  /**
   * Fields to show as secondary inline text in the results list.
   * Comma-separated field names from the target table (e.g. "name,collection").
   */
  resultFields?: string;
  /**
   * Override URL used when the user clicks a result in the inline list
   * (rather than pressing Enter to navigate to the list itself).
   */
  inlineOverrideUrl?: string;
  /** If true, this command is only usable from the inline results list */
  inlineOnly?: boolean;
  /** User-configurable filters / parameters for this command */
  filters: ConfigurableFilter[];
  /** Grouping tags for the settings UI (e.g. ["admin", "scripts"]) */
  tags?: string[];
  /** Only available in Next Experience (Polaris) */
  nextOnly?: boolean;
  /** Hidden from the hint list but still executable */
  hidden?: boolean;
}

/**
 * A partial override stored in settings.  Any field set here takes precedence
 * over the built-in definition.  filterValues overrides individual filter
 * defaults without replacing the entire filters array.
 */
export interface SlashCommandOverride {
  label?: string;
  hint?: string;
  urlTemplate?: string;
  resultFields?: string;
  inlineOverrideUrl?: string;
  disabled?: boolean;
  /** Per-filter value overrides, keyed by ConfigurableFilter.key */
  filterValues?: Record<string, string | number | boolean>;
}

/** A fully custom command added by the user (not derived from a built-in) */
export type CustomSlashCommand = Omit<SlashCommand, 'filters'> & {
  filters: ConfigurableFilter[];
  /** Custom commands always have a filterValues bag */
  filterValues?: Record<string, string | number | boolean>;
};
