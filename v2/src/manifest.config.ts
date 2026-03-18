import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from '../package.json';

const { version } = packageJson;

export default defineManifest((env) => ({
  manifest_version: 3,
  name: env.mode === 'development'
    ? '[DEV] SN Utils - Tools for ServiceNow'
    : 'SN Utils - Tools for ServiceNow',
  short_name: 'SN Utils',
  description: 'Productivity tools for ServiceNow. (Personal work, not affiliated to ServiceNow)',
  version,
  icons: {
    16: 'images/icon16.png',
    24: 'images/icon24.png',
    32: 'images/icon32.png',
    48: 'images/icon48.png',
    128: 'images/icon128.png',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://*.service-now.com/*'],
      exclude_matches: [
        '*://*/*?XML*',
        '*://*/*&XML*',
        '*://*/*?WSDL*',
        '*://*/*&WSDL*',
        '*://*/*validate_multifactor_auth_code.do*',
      ],
      js: ['src/content/all-frames.ts'],
      all_frames: true,
    },
    {
      matches: ['https://*.service-now.com/*'],
      exclude_matches: [
        '*://*/*?XML*',
        '*://*/*&XML*',
        '*://*/*?WSDL*',
        '*://*/*&WSDL*',
        '*://*/*validate_multifactor_auth_code.do*',
      ],
      js: ['src/content/parent-frame.ts'],
      all_frames: false,
    },
  ],
  permissions: [
    'activeTab',
    'declarativeContent',
    'storage',
    'contextMenus',
    'cookies',
    'sidePanel',
  ] as chrome.runtime.ManifestPermissions[],
  host_permissions: ['https://*.service-now.com/*'],
  commands: {
    _execute_action: {
      suggested_key: { default: 'Ctrl+1', mac: 'Command+1' },
      description: 'Activate Extension',
    },
    pop: {
      suggested_key: { default: 'Ctrl+2', mac: 'Command+2' },
      description: 'Pop-In / Pop-Out',
    },
    'show-technical-names': {
      suggested_key: { default: 'Ctrl+3', mac: 'Command+3' },
      description: 'Show Technical Names',
    },
    'slashcommand-shortcut': {
      suggested_key: { default: 'Ctrl+4', mac: 'Command+4' },
      description: 'Run /shortcut slashcommand',
    },
    slashcommand: {
      description: 'Open slashcommand popup',
    },
  },
  web_accessible_resources: [
    {
      resources: [
        'src/inject/index.ts',
        'src/inject/next-experience/index.ts',
        'css/*',
        'images/*',
        'CHANGELOG.md',
      ],
      matches: ['https://*.service-now.com/*'],
    },
  ],
  action: {
    default_title: 'SN Utils',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'images/icon16.png',
      32: 'images/icon32.png',
      48: 'images/icon48.png',
      128: 'images/icon128.png',
    },
    show_matches: ['https://*.service-now.com/*'],
  },
  incognito: 'split',
  content_security_policy: {
    extension_pages:
      "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src https://*.service-now.com 'self' data:; child-src 'none'; object-src 'none'; frame-src https://*.service-now.com; connect-src https://*.service-now.com ws://127.0.0.1:1978/",
  },
  side_panel: {
    default_path: 'src/popup/index.html',
  },
}));
