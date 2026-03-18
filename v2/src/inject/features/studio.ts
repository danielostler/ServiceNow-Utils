/** Open record in Studio tab – dispatches to the SNS data provider element. */
export function openTab(payload: unknown): void {
  const win = window as unknown as Record<string, unknown>;
  const qssd = win['querySelectorShadowDom'] as
    | { querySelectorDeep: (sel: string) => (EventTarget & { dispatch?: (event: string, detail: unknown) => void }) | null }
    | undefined;

  const provider = qssd?.querySelectorDeep('sn-udc-data-provider');
  if (!provider?.dispatch) return;

  provider.dispatch('STUDIO_SHELL_TABS#OPEN_TAB', { file: payload });
}
