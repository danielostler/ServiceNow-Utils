import React, { useState } from 'react';
import SettingsPage from './pages/Settings';
import CommandsPage from './pages/Commands';

type Tab = 'settings' | 'commands' | 'updatesets' | 'tables' | 'users';

const TABS: { id: Tab; label: string }[] = [
  { id: 'commands', label: 'Commands' },
  { id: 'settings', label: 'Settings' },
  { id: 'updatesets', label: 'Update Sets' },
  { id: 'tables', label: 'Tables' },
  { id: 'users', label: 'Users' },
];

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('commands');

  return (
    <div style={{ minWidth: 480, fontFamily: 'sans-serif' }}>
      {/* Tab bar */}
      <nav style={{ display: 'flex', borderBottom: '2px solid #e5e5e5' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #0070d2' : '2px solid transparent',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#0070d2' : '#333',
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div style={{ padding: 16 }}>
        {activeTab === 'commands' && <CommandsPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'updatesets' && <Placeholder label="Update Sets" />}
        {activeTab === 'tables' && <Placeholder label="Tables" />}
        {activeTab === 'users' && <Placeholder label="Users" />}
      </div>
    </div>
  );
}

function Placeholder({ label }: { label: string }): React.JSX.Element {
  return (
    <div style={{ color: '#888', padding: 32, textAlign: 'center' }}>
      {label} — coming soon
    </div>
  );
}
