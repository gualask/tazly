import path from 'node:path'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import manifest from './src/manifest'

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    rollupOptions: {
      // index.html non è più referenziato dal manifest (niente override newtab):
      // la dichiariamo come entry esplicita così resta nel bundle.
      input: { index: path.resolve(__dirname, 'index.html') },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
})
