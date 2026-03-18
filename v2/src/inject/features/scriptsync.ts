/** ScriptSync / VS Code feature – triggers sync via background service worker. */
export function init(): void {
  document.dispatchEvent(
    new CustomEvent('snutils-event', {
      detail: { event: 'scriptsync', command: '' },
    })
  );
}
