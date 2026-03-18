/**
 * Utilities for extracting the ServiceNow instance hostname from the current URL.
 * e.g. "mycompany.service-now.com" → "mycompany"
 */

/** Extract the subdomain part from a *.service-now.com hostname */
export function instanceFromHostname(hostname: string): string {
  const match = hostname.match(/^([^.]+)\.service-now\.com/);
  return match ? match[1] : hostname;
}

/** Current tab's instance name (usable in content scripts) */
export function currentInstance(): string {
  return instanceFromHostname(window.location.hostname);
}
