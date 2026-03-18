/**
 * Commands page – browse, search, and edit all slash commands and their filters.
 *
 * Features:
 *   - Lists all built-in + custom commands (searchable by id, label, hint, tag)
 *   - Click a command to expand an inline editor showing:
 *       • URL template (editable)
 *       • Each ConfigurableFilter with its current override value
 *       • Toggle to disable the command
 *       • "Reset to defaults" button
 *   - Changes are persisted to chrome.storage via saveGlobalSettings()
 */

import React, { useEffect, useRef, useState } from 'react';
import { BUILT_IN_COMMANDS } from '@inject/slash/built-in';
import { loadGlobalSettings, saveGlobalSettings } from '@shared/settings/storage';
import { DEFAULT_GLOBAL_SETTINGS } from '@shared/settings/defaults';
import type { ValidatedGlobalSettings } from '@shared/settings/schema';
import type { SlashCommand } from '@shared/types/command';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FilterEditorRow {
  key: string;
  label: string;
  type: string;
  defaultValue: string | number | boolean;
  description?: string;
  currentValue: string | number | boolean;
}

// ── Hook: load settings ───────────────────────────────────────────────────────

function useSettings() {
  const [settings, setSettings] = useState<ValidatedGlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGlobalSettings().then(setSettings);
  }, []);

  async function persist(updated: ValidatedGlobalSettings) {
    setSaving(true);
    setSettings(updated);
    await saveGlobalSettings(updated);
    setSaving(false);
  }

  return { settings, persist, saving };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommandsPage(): React.JSX.Element {
  const { settings, persist, saving } = useSettings();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const allCommands: SlashCommand[] = [
    ...BUILT_IN_COMMANDS.filter((c) => !c.hidden),
    ...(settings.customCommands as SlashCommand[]),
  ];

  const filtered = query.trim()
    ? allCommands.filter(
        (c) =>
          c.id.includes(query) ||
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.hint.toLowerCase().includes(query.toLowerCase()) ||
          c.tags?.some((t) => t.includes(query.toLowerCase()))
      )
    : allCommands;

  function isDisabled(id: string): boolean {
    return (
      settings.disabledCommands.includes(id) ||
      settings.commandOverrides[id]?.disabled === true
    );
  }

  async function toggleDisabled(id: string) {
    const override = settings.commandOverrides[id] ?? {};
    const updated: ValidatedGlobalSettings = {
      ...settings,
      commandOverrides: {
        ...settings.commandOverrides,
        [id]: { ...override, disabled: !isDisabled(id) },
      },
    };
    await persist(updated);
  }

  async function saveFilterValue(
    cmdId: string,
    filterKey: string,
    value: string | number | boolean
  ) {
    const override = settings.commandOverrides[cmdId] ?? {};
    const updated: ValidatedGlobalSettings = {
      ...settings,
      commandOverrides: {
        ...settings.commandOverrides,
        [cmdId]: {
          ...override,
          filterValues: {
            ...(override.filterValues ?? {}),
            [filterKey]: value,
          },
        },
      },
    };
    await persist(updated);
  }

  async function resetCommand(cmdId: string) {
    const { [cmdId]: _removed, ...rest } = settings.commandOverrides;
    await persist({ ...settings, commandOverrides: rest });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands…"
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
        />
        {saving && <span style={{ fontSize: 11, color: '#888' }}>Saving…</span>}
      </div>

      <div style={{ maxHeight: 480, overflowY: 'auto' }}>
        {filtered.map((cmd) => {
          const disabled = isDisabled(cmd.id);
          const expanded = expandedId === cmd.id;
          const hasOverride = !!settings.commandOverrides[cmd.id];

          return (
            <div
              key={cmd.id}
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: 6,
                marginBottom: 6,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {/* Command header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  background: expanded ? '#f0f7ff' : 'transparent',
                  borderRadius: expanded ? '6px 6px 0 0' : 6,
                  gap: 8,
                }}
                onClick={() => setExpandedId(expanded ? null : cmd.id)}
              >
                <code style={{ fontSize: 12, background: '#e5e5e5', padding: '1px 5px', borderRadius: 3, minWidth: 60 }}>
                  /{cmd.id}
                </code>
                <span style={{ flex: 1, fontSize: 13, color: '#333' }}>{cmd.hint}</span>
                {hasOverride && (
                  <span style={{ fontSize: 10, color: '#0070d2', background: '#e8f4fd', padding: '1px 5px', borderRadius: 10 }}>
                    customised
                  </span>
                )}
                {cmd.tags?.map((t) => (
                  <span key={t} style={{ fontSize: 10, color: '#888', background: '#f5f5f5', padding: '1px 5px', borderRadius: 10 }}>
                    {t}
                  </span>
                ))}
                <span style={{ fontSize: 11, color: '#888' }}>{expanded ? '▲' : '▼'}</span>
              </div>

              {/* Expanded editor */}
              {expanded && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid #e5e5e5', fontSize: 13 }}>
                  {/* Disable toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={disabled}
                      onChange={() => toggleDisabled(cmd.id)}
                    />
                    Disable this command
                  </label>

                  {/* Configurable filters */}
                  {cmd.filters.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Configurable filters</div>
                      {cmd.filters.map((filter) => {
                        const currentVal =
                          settings.commandOverrides[cmd.id]?.filterValues?.[filter.key] ??
                          filter.defaultValue;
                        return (
                          <FilterRow
                            key={filter.key}
                            cmdId={cmd.id}
                            filter={{
                              key: filter.key,
                              label: filter.label,
                              type: filter.type,
                              defaultValue: filter.defaultValue,
                              description: filter.description,
                              currentValue: currentVal,
                            }}
                            onSave={(k, v) => saveFilterValue(cmd.id, k, v)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Reset button */}
                  {hasOverride && (
                    <button
                      onClick={() => resetCommand(cmd.id)}
                      style={{
                        marginTop: 10,
                        padding: '4px 10px',
                        fontSize: 12,
                        cursor: 'pointer',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        background: '#fff',
                      }}
                    >
                      Reset to defaults
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Filter row component ──────────────────────────────────────────────────────

interface FilterRowProps {
  cmdId: string;
  filter: FilterEditorRow;
  onSave: (key: string, value: string | number | boolean) => void;
}

function FilterRow({ filter, onSave }: FilterRowProps): React.JSX.Element {
  const [localValue, setLocalValue] = useState(String(filter.currentValue));
  const [dirty, setDirty] = useState(false);
  const isDefault = String(filter.currentValue) === String(filter.defaultValue);

  function handleChange(v: string) {
    setLocalValue(v);
    setDirty(v !== String(filter.currentValue));
  }

  function handleSave() {
    const typed: string | number | boolean =
      filter.type === 'number' ? Number(localValue) :
      filter.type === 'boolean' ? localValue === 'true' :
      localValue;
    onSave(filter.key, typed);
    setDirty(false);
  }

  function handleReset() {
    const val = String(filter.defaultValue);
    setLocalValue(val);
    onSave(filter.key, filter.defaultValue);
    setDirty(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontWeight: 500 }}>{filter.label}</span>
        {!isDefault && (
          <span style={{ fontSize: 10, color: '#0070d2', background: '#e8f4fd', padding: '1px 5px', borderRadius: 10 }}>
            overridden
          </span>
        )}
      </div>
      {filter.description && (
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{filter.description}</div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        {filter.type === 'boolean' ? (
          <select
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            style={{ flex: 1, padding: '4px 6px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4 }}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            type={filter.type === 'number' ? 'number' : 'text'}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 12,
              border: '1px solid #ccc',
              borderRadius: 4,
              fontFamily: filter.type === 'encoded_query' ? 'monospace' : 'inherit',
            }}
          />
        )}
        {dirty && (
          <button
            onClick={handleSave}
            style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: '#0070d2', color: '#fff', border: 'none', borderRadius: 4 }}
          >
            Save
          </button>
        )}
        {!isDefault && !dirty && (
          <button
            onClick={handleReset}
            style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', border: '1px solid #ccc', borderRadius: 4, background: '#fff' }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
