/**
 * Settings page – global extension settings.
 * Full settings form covering all fields in GlobalSettingsSchema.
 */
import React, { useEffect, useState } from 'react';
import { loadGlobalSettings, saveGlobalSettings } from '@shared/settings/storage';
import { DEFAULT_GLOBAL_SETTINGS } from '@shared/settings/defaults';
import type { ValidatedGlobalSettings } from '@shared/settings/schema';

// ── Hook ─────────────────────────────────────────────────────────────────────

function useSettings() {
  const [settings, setSettings] = useState<ValidatedGlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadGlobalSettings().then(setSettings);
  }, []);

  async function persist(updated: ValidatedGlobalSettings) {
    setSettings(updated);
    await saveGlobalSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return { settings, persist, saved };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface CheckboxRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function CheckboxRow({ label, description, checked, onChange }: CheckboxRowProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 2, flexShrink: 0 }}
      />
      <span>
        <span style={{ fontSize: 13 }}>{label}</span>
        {description && (
          <span style={{ display: 'block', fontSize: 11, color: '#888', marginTop: 2 }}>{description}</span>
        )}
      </span>
    </label>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: '#888', letterSpacing: '0.05em', marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid #e5e5e5' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsPage(): React.JSX.Element {
  const { settings, persist, saved } = useSettings();

  function update<K extends keyof ValidatedGlobalSettings>(key: K, value: ValidatedGlobalSettings[K]) {
    void persist({ ...settings, [key]: value });
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 3, color: '#555' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle };
  const fieldWrap: React.CSSProperties = { marginBottom: 12 };

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Settings</h2>
        {saved && <span style={{ fontSize: 11, color: '#2e7d32' }}>Saved ✓</span>}
      </div>

      <Section title="Slash Popup">
        <div style={fieldWrap}>
          <label style={labelStyle}>Theme</label>
          <select
            value={settings.slashTheme}
            onChange={(e) => update('slashTheme', e.target.value as ValidatedGlobalSettings['slashTheme'])}
            style={selectStyle}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="stealth">Stealth</option>
            <option value="theme">Match ServiceNow theme</option>
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Activation mode</label>
          <select
            value={settings.slashActivationMode}
            onChange={(e) => update('slashActivationMode', e.target.value as ValidatedGlobalSettings['slashActivationMode'])}
            style={selectStyle}
          >
            <option value="on">On – press / anywhere</option>
            <option value="ctrl">Ctrl – press Ctrl+/ or Cmd+/</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>History size (0–200)</label>
          <input
            type="number"
            min={0}
            max={200}
            value={settings.slashHistorySize}
            onChange={(e) => update('slashHistorySize', Number(e.target.value))}
            style={{ ...inputStyle, width: 80 }}
          />
        </div>

        <CheckboxRow
          label="Navigator search"
          description="Show navigator search results alongside slash commands"
          checked={settings.slashNavigatorSearch}
          onChange={(v) => update('slashNavigatorSearch', v)}
        />

        <CheckboxRow
          label="Popup priority"
          description="Give the slash popup priority over native ServiceNow search"
          checked={settings.slashPopupPriority}
          onChange={(v) => update('slashPopupPriority', v)}
        />
      </Section>

      <Section title="Editor / ScriptSync">
        <CheckboxRow
          label="VS Code ScriptSync"
          description="Enable syncing scripts to VS Code via the ScriptSync extension"
          checked={settings.vsScriptSync}
          onChange={(v) => update('vsScriptSync', v)}
        />

        <CheckboxRow
          label="Code editor"
          description="Replace the default ServiceNow script editor with Monaco"
          checked={settings.codeEditor}
          onChange={(v) => update('codeEditor', v)}
        />

        <CheckboxRow
          label="Apply BGS editor"
          description="Also replace the background script editor"
          checked={settings.applyBgsEditor}
          onChange={(v) => update('applyBgsEditor', v)}
        />

        <CheckboxRow
          label="No paste image"
          description="Prevent image pasting in script fields"
          checked={settings.noPasteImage}
          onChange={(v) => update('noPasteImage', v)}
        />

        <div style={fieldWrap}>
          <label style={labelStyle}>Monaco editor options (JSON)</label>
          <textarea
            value={settings.monacoOptions}
            onChange={(e) => update('monacoOptions', e.target.value)}
            rows={3}
            style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
            placeholder="{}"
          />
        </div>
      </Section>

      <Section title="UI Tweaks">
        <CheckboxRow
          label="Add technical names"
          description="Show field technical names next to form field labels"
          checked={settings.addTechnicalNames}
          onChange={(v) => update('addTechnicalNames', v)}
        />

        <div style={fieldWrap}>
          <label style={labelStyle}>Technical names regex filter</label>
          <input
            type="text"
            value={settings.technicalNamesRegex}
            onChange={(e) => update('technicalNamesRegex', e.target.value)}
            style={inputStyle}
            placeholder="Leave empty to show all fields"
          />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>List fields</label>
          <input
            type="text"
            value={settings.listFields}
            onChange={(e) => update('listFields', e.target.value)}
            style={inputStyle}
            placeholder="Comma-separated field names"
          />
        </div>

        <CheckboxRow
          label="Highlight default Update Set"
          description="Visually highlight when the Default Update Set is selected"
          checked={settings.highlightDefaultUpdateSet}
          onChange={(v) => update('highlightDefaultUpdateSet', v)}
        />

        <CheckboxRow
          label="Hide non-essential UI elements"
          description="Remove clutter from the ServiceNow UI"
          checked={settings.hideNonEssentialUiElements}
          onChange={(v) => update('hideNonEssentialUiElements', v)}
        />

        <CheckboxRow
          label="Instance tag"
          description="Show a coloured tag in the header to identify the current instance"
          checked={settings.instanceTag}
          onChange={(v) => update('instanceTag', v)}
        />
      </Section>

      <Section title="Misc">
        <CheckboxRow
          label="Open tab on update"
          description="Open a new tab when a record is saved/updated"
          checked={settings.openTabOnUpdate}
          onChange={(v) => update('openTabOnUpdate', v)}
        />
      </Section>
    </div>
  );
}
