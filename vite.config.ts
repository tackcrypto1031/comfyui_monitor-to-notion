import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: {
        app: 'index.html',
      },
    },
  },
  server: {
    port: 7890,
    host: '127.0.0.1',
  },
  preview: {
    port: 7890,
    host: '127.0.0.1',
  },
});
