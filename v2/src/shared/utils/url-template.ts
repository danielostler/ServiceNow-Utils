/**
 * URL template resolution for slash commands.
 *
 * Supported variables (ported from inject.js command execution logic):
 *   $0            – full user input (everything after the command keyword)
 *   $1, $2, …     – whitespace-split tokens from user input
 *   $table        – current page's table name
 *   $sysid        – current record's sys_id
 *   $encodedquery – current list encoded query
 *   {{key}}       – replaced by the pre-resolved ConfigurableFilter value
 */

export interface TemplateContext {
  /** Full user input string after the command keyword */
  input: string;
  /** Current page table (e.g. "incident") or empty string */
  table: string;
  /** Current record sys_id or empty string */
  sysId: string;
  /** Current list encoded query or empty string */
  encodedQuery: string;
  /** Pre-resolved filter values from the command registry */
  filterValues: Record<string, string | number | boolean>;
}

/**
 * Resolve a URL template against a context.
 * Returns the interpolated string, ready for navigation.
 */
export function resolveTemplate(template: string, ctx: TemplateContext): string {
  const tokens = ctx.input.trim().split(/\s+/);
  const input = encodeURIComponentSafe(ctx.input.trim());

  let result = template;

  // {{key}} – configurable filter values (unencoded, may contain GlideRecord JS)
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = ctx.filterValues[key];
    if (val === undefined) return '';
    // Append user input to encoded_query filters that end with a comparison operator
    if (typeof val === 'string' && looksLikeQueryStart(val)) {
      return val + ctx.input.trim();
    }
    return String(val);
  });

  // $0 – full input
  result = result.replace(/\$0/g, input);

  // $1, $2, … – individual tokens
  result = result.replace(/\$(\d+)/g, (_, n: string) => {
    const idx = parseInt(n, 10) - 1;
    return idx >= 0 ? encodeURIComponentSafe(tokens[idx] ?? '') : '';
  });

  // $table, $sysid, $encodedquery
  result = result.replace(/\$table/g, ctx.table);
  result = result.replace(/\$sysid/g, ctx.sysId);
  result = result.replace(/\$encodedquery/g, ctx.encodedQuery);

  return result;
}

/**
 * Returns true if the query string looks like it ends with a comparison
 * operator that expects a value to be appended (e.g. "nameLIKE", "active=true^nameSTARTSWITH").
 */
function looksLikeQueryStart(val: string): boolean {
  return /(?:LIKE|STARTSWITH|ENDSWITH|=|>|<|CONTAINS|NOT CONTAINS)$/.test(val);
}

/**
 * Safe encodeURIComponent that returns an empty string for null/undefined.
 */
function encodeURIComponentSafe(s: string): string {
  return s ? encodeURIComponent(s) : '';
}
