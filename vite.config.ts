import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    tailwindcss(),
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
        manualChunks(id: string) {
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('zustand')) return 'vendor-state';
          if (id.includes('lucide-react')) return 'vendor-ui';
          if (id.includes('react-router-dom')) return 'vendor-router';
        },
      },
    },
  },
});
