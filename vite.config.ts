import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
              },
            },
          },
        },
      },
      {
        // Preload script
        entry: 'src/main/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload.js',
              },
            },
          },
        },
      },
    ]),
  ],
  base: './',
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: {
        app: 'index.html',
      },
    },
  },
  server: {
    port: 5173,
  },
});
