import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './src/manifest.config';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@inject': resolve(__dirname, 'src/inject'),
      '@popup': resolve(__dirname, 'src/popup'),
    },
  },
  build: {
    outDir: mode === 'firefox' ? 'dist-firefox' : 'dist',
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        // Tool pages
        popup: resolve(__dirname, 'src/popup/index.html'),
        codesearch: resolve(__dirname, 'src/tools/codesearch/index.html'),
        diff: resolve(__dirname, 'src/tools/diff/index.html'),
        viewdata: resolve(__dirname, 'src/tools/viewdata/index.html'),
        scriptsync: resolve(__dirname, 'src/tools/scriptsync/index.html'),
        codeeditor: resolve(__dirname, 'src/tools/codeeditor/index.html'),
        settingeditor: resolve(__dirname, 'src/tools/settingeditor/index.html'),
        welcome: resolve(__dirname, 'src/tools/welcome/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
}));
