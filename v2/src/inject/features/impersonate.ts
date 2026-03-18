/**
 * Impersonate User feature.
 * Ported from inject.js snuGetUsersForImpersonate / snuImpersonate.
 *
 * The slash command `/imp <query>` calls show({ query }) which fetches matching
 * users from the ServiceNow REST API and renders clickable links into the popup's
 * #snudirectlinks element. Clicking a link posts to the impersonate endpoint and
 * reloads the page.
 */

interface UserResult {
  sys_id: string;
  user_name: string;
  name?: string;
  user_display_value?: string;
}

interface RecentResult {
  user_name: string;
  display_value?: string;
}

/** Returns the currently impersonated user_name, or '' if not impersonating. */
function currentImpersonation(): string {
  try {
    const scripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[type="text/javascript"]')
    ).filter((s) => s.textContent?.includes('user.impersonation'));
    if (scripts.length) {
      const match = scripts[0].textContent?.match(/'user\.impersonation',\s*'([^']*)'\)/);
      if (match) return match[1];
    }
  } catch {
    // ignore
  }
  return '';
}

/** Fetch the CSRF token from the page context (ServiceNow global). */
function getCk(): string {
  return (window as unknown as Record<string, unknown>)['g_ck'] as string ?? '';
}

/** Build fetch headers for ServiceNow REST calls. */
function snHeaders(): HeadersInit {
  const ck = getCk();
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (ck) h['X-UserToken'] = ck;
  return h;
}

/** Render a list of impersonation links into #snudirectlinks. */
function renderLinks(html: string): void {
  const el = document.getElementById('snudirectlinks');
  if (!el) return;

  // Safely set text via DOM construction (no innerHTML with untrusted data in prod)
  el.innerHTML = html;

  el.querySelectorAll<HTMLAnchorElement>('a.snuimp').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const userName = a.getAttribute('data-username') ?? '';
      if (userName) void doImpersonate(userName);
    });
  });
}

/** POST to the impersonate endpoint and reload on success. */
async function doImpersonate(userName: string): Promise<void> {
  try {
    const res = await fetch(`/api/now/ui/impersonate/${encodeURIComponent(userName)}`, {
      method: 'POST',
      headers: snHeaders(),
    });
    if (res.ok) {
      location.reload();
    } else {
      renderLinks(`<span style="color:#c00">Failed: ${res.status} ${res.statusText}</span>`);
    }
  } catch (err) {
    renderLinks(`<span style="color:#c00">Error: ${err}</span>`);
  }
}

/** Main entry point called by the slash command popup. */
export async function show(opts: { query: string }): Promise<void> {
  const { query } = opts;
  const impersonating = currentImpersonation();
  const ck = getCk();

  let html = '';

  if (impersonating) {
    html += `Currently Impersonating<br />
<span class="dispidx">1</span>
<a class="snuimp" href="#" data-username="${impersonating}">Stop Impersonating</a>
<span class="semihidden">${impersonating}</span><br />\n`;
  }

  try {
    if (query) {
      const url =
        `/api/now/table/sys_user` +
        `?sysparm_display_value=true` +
        `&sysparm_exclude_reference_link=true` +
        `&sysparm_suppress_pagination_header=true` +
        `&sysparm_limit=20` +
        `&sysparm_fields=sys_id,user_name,name` +
        `&sysparm_query=active=true^user_nameLIKE${encodeURIComponent(query)}^ORnameLIKE${encodeURIComponent(query)}`;

      const res = await fetch(url, { headers: snHeaders() });
      const data = (await res.json()) as { result: UserResult[] };

      html += 'Found users (remove filter for recent impersonations)<br />';
      if (!data.result.length) {
        html += '- No results found<br />';
      }

      let dispIdx = impersonating ? 2 : 1;
      data.result.forEach((u) => {
        const display = u.user_display_value ?? u.name ?? u.user_name;
        const idx = dispIdx <= 9 ? dispIdx : '>';
        html += `<span class="dispidx">${idx}</span> ` +
          `<a id="snulnk${idx}" class="snuimp" href="#" data-username="${u.user_name}">${display}</a> ` +
          `<span class="semihidden">${u.user_name}</span><br />\n`;
        dispIdx++;
      });
    } else {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (ck) headers['X-UserToken'] = ck;

      const res = await fetch('/api/now/ui/impersonate/recent', { headers });
      const data = (await res.json()) as { result: RecentResult[] };

      html += 'Recent impersonated (add filter to search users)<br />';
      if (!data.result?.length) {
        html += '- No results found<br />';
      }

      let dispIdx = impersonating ? 2 : 1;
      (data.result ?? []).forEach((u) => {
        const display = u.display_value ?? u.user_name;
        const idx = dispIdx <= 9 ? dispIdx : '>';
        html += `<span class="dispidx">${idx}</span> ` +
          `<a id="snulnk${idx}" class="snuimp" href="#" data-username="${u.user_name}">${display}</a> ` +
          `<span class="semihidden">${u.user_name}</span><br />\n`;
        dispIdx++;
      });
    }
  } catch (err) {
    html += `<span style="color:#c00">No access to impersonation API: ${err}</span>`;
  }

  renderLinks(html);
}
