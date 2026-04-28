import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'https://poker-coins.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
