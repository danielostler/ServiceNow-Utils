/** Pop in/out classic UI – dispatches event to background via content script relay. */
export function toggle(): void {
  document.dispatchEvent(
    new CustomEvent('snutils-event', {
      detail: { event: 'pop' },
    })
  );
}
