import { defineManifest } from '@crxjs/vite-plugin'
import pkg from '../package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Tazly',
  version: pkg.version,
  description: 'Board progettuale leggera per i tuoi progetti',
  action: {
    default_title: 'Tazly',
    default_icon: {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  commands: {
    'open-quick-add': {
      suggested_key: { default: 'Ctrl+Shift+K', mac: 'Command+Shift+K' },
      description: 'Aggiungi un task a Tazly dalla pagina corrente',
    },
  },
  icons: {
    16: 'icons/icon-16.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  // activeTab + scripting: il widget si inietta solo alla scorciatoia (gesto utente),
  // così non serve il permesso host su tutti i siti.
  permissions: ['storage', 'activeTab', 'scripting'],
  web_accessible_resources: [
    {
      resources: ['widget.html'],
      matches: ['<all_urls>'],
    },
  ],
})
