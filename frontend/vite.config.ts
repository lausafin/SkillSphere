import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Or your preferred port
    // Optional: Proxy API requests during development to avoid CORS issues
    // proxy: {
    //   '/api': { // Match requests starting with /api
    //     target: 'http://localhost:3000', // Your backend server URL
    //     changeOrigin: true, // Needed for virtual hosted sites
    //     // rewrite: (path) => path.replace(/^\/api/, '') // Optional: remove /api prefix if backend doesn't expect it
    //   }
    // }
  },
  build: {
    outDir: 'dist', // Output directory for production build
  },
});