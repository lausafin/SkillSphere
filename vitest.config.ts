import { defineConfig, mergeConfig } from 'vitest/config';
import * as viteConfig from './frontend/vite.config'; // Import the frontend's Vite config

export default mergeConfig(
  viteConfig, // First, apply all the settings from your frontend config
  defineConfig({
    // Then, define the test-specific settings here
    test: {
      // Vitest will now definitively use this environment setting
      environment: 'jsdom',
      globals: true,
      setupFiles: './frontend/src/setupTests.ts', // Use a path from the root
    },
  })
);