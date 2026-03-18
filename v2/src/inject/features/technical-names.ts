/**
 * Technical Names feature
 * Ported from inject.js lines 3056–3103.
 * Adds inline <span> labels showing the field name next to each form field label.
 * TODO: Full port.
 */

import type { ValidatedGlobalSettings } from '@shared/settings/schema';

let active = false;

export function init(settings: ValidatedGlobalSettings): void {
  if (settings.addTechnicalNames) show(settings);
}

export function show(settings?: ValidatedGlobalSettings): void {
  active = true;
  const regex = settings?.technicalNamesRegex
    ? new RegExp(settings.technicalNamesRegex)
    : null;

  document.querySelectorAll<HTMLElement>('[data-field-name]').forEach((el) => {
    const fieldName = el.dataset.fieldName ?? '';
    if (regex && !regex.test(fieldName)) return;

    if (el.querySelector('.snu-tech-name')) return; // already added

    const span = document.createElement('span');
    span.className = 'snu-tech-name';
    span.textContent = fieldName;
    span.style.cssText = 'font-family:monospace;font-size:0.75em;color:#888;margin-left:4px;';
    el.appendChild(span);
  });
}

export function hide(): void {
  active = false;
  document.querySelectorAll('.snu-tech-name').forEach((el) => el.remove());
}

export function toggle(): void {
  active ? hide() : show();
}
