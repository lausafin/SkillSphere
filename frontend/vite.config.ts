import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Define the Vite-specific configuration
const viteConfig = defineViteConfig({
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
    outDir: 'dist',
  },
});

// Define the Vitest-specific configuration
const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});

// Merge the two configurations and export the result
export default mergeConfig(viteConfig, vitestConfig);