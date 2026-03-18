import { describe, it, expect } from 'vitest';
import { buildRegistry, resolveCommand } from '../inject/slash/registry';
import { DEFAULT_GLOBAL_SETTINGS } from '../shared/settings/defaults';

const BASE_SETTINGS = DEFAULT_GLOBAL_SETTINGS;

describe('buildRegistry', () => {
  it('includes all built-in commands by default', () => {
    const registry = buildRegistry(BASE_SETTINGS);
    const ids = registry.map((c) => c.id);
    expect(ids).toContain('imp');
    expect(ids).toContain('br');
    expect(ids).toContain('su');
  });

  it('excludes disabled commands', () => {
    const registry = buildRegistry({
      ...BASE_SETTINGS,
      disabledCommands: ['imp'],
    });
    expect(registry.find((c) => c.id === 'imp')).toBeUndefined();
  });

  it('excludes commands with override.disabled = true', () => {
    const registry = buildRegistry({
      ...BASE_SETTINGS,
      commandOverrides: { imp: { disabled: true } },
    });
    expect(registry.find((c) => c.id === 'imp')).toBeUndefined();
  });

  it('applies filter value override for /imp query', () => {
    const registry = buildRegistry({
      ...BASE_SETTINGS,
      commandOverrides: {
        imp: { filterValues: { query: 'active=true^company=abc', limit: 10 } },
      },
    });
    const imp = registry.find((c) => c.id === 'imp');
    expect(imp?.resolvedFilterValues.query).toBe('active=true^company=abc');
    expect(imp?.resolvedFilterValues.limit).toBe(10);
  });

  it('falls back to filter defaultValue when no override', () => {
    const registry = buildRegistry(BASE_SETTINGS);
    const imp = registry.find((c) => c.id === 'imp');
    expect(imp?.resolvedFilterValues.query).toBe('active=true^nameSTARTSWITH');
    expect(imp?.resolvedFilterValues.limit).toBe(20);
  });

  it('includes custom commands', () => {
    const registry = buildRegistry({
      ...BASE_SETTINGS,
      customCommands: [
        {
          id: 'mycmd',
          label: 'My Command',
          hint: 'My custom command',
          urlTemplate: '/my-page.do',
          filters: [],
        },
      ],
    });
    const custom = registry.find((c) => c.id === 'mycmd');
    expect(custom).toBeDefined();
    expect(custom?.isCustom).toBe(true);
  });
});

describe('resolveCommand', () => {
  it('returns undefined for disabled command', () => {
    const result = resolveCommand('imp', {
      ...BASE_SETTINGS,
      disabledCommands: ['imp'],
    });
    expect(result).toBeUndefined();
  });

  it('returns resolved command with merged filter values', () => {
    const result = resolveCommand('su', {
      ...BASE_SETTINGS,
      commandOverrides: {
        su: { filterValues: { query: 'state=in progress^nameLIKE$0' } },
      },
    });
    expect(result?.resolvedFilterValues.query).toBe('state=in progress^nameLIKE$0');
  });
});
