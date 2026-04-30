import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      // Disable source maps in production release build
      sourcemap: false,
      // Suppress the chunk size warning (we handle it via splitting)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Split vendor libraries into dedicated chunks for better caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-state': ['zustand'],
            'vendor-ui': ['lucide-react'],
          }
        }
      }
    }
  };
});
