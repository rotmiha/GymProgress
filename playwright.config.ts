import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  // OneDrive lahko zaklene stare posnetke; vsak zagon dobi svojo mapo.
  outputDir: `test-results/run-${Date.now()}`,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 1000 },
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -w frontend -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: {
      GYMPROGRESS_UI_TEST: '1',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-public-key',
    },
  },
});
