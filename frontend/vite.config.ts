import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || process.env.APP_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: (process.env.VITE_WS_URL || process.env.APP_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/^http/, 'ws'),
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/motion/') || id.includes('node_modules/motion-dom/')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/zustand/')) {
            return 'vendor-state';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
