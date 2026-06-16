import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 400,
    cssCodeSplit: false,
    minify: 'esbuild' as const,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-motion': ['framer-motion'],
          'vendor-state': ['zustand'],
          'vendor-ui': ['lucide-react'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
  },
});
