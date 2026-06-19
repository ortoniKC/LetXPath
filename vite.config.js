import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        panel: resolve(__dirname, 'panel/panel.html'),
        option: resolve(__dirname, 'option/option.html'),
        content: resolve(__dirname, 'app/src/content.ts'),
        service_worker: resolve(__dirname, 'app/service_worker.ts'),
        devtools: resolve(__dirname, 'app/devtools/devtools.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') {
            return 'app/src/content.js';
          }
          if (chunkInfo.name === 'service_worker') {
            return 'service_worker.js';
          }
          if (chunkInfo.name === 'devtools') {
            return 'app/devtools/devtools.js';
          }
          return '[name]/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
