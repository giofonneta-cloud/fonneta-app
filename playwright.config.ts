import { defineConfig, devices } from '@playwright/test'

// BASE_URL permite apuntar a un preview/producción: BASE_URL=https://fonneta-app.vercel.app npm run test:e2e
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-safari', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone-safari', use: { ...devices['iPhone 14'] } },
  ],
})
