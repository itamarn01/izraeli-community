import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Accept the forwarded hostname when the dev server is shared through a
    // VS Code dev tunnel; without this Vite answers "Blocked request".
    allowedHosts: ['.devtunnels.ms', '.ngrok-free.app', 'localhost'],
    proxy: {
      // changeOrigin so the backend sees a localhost Host header even when the
      // request arrived through a tunnel domain.
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
