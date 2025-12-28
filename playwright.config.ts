import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 순차 실행으로 서버 부하 감소
  forbidOnly: !!process.env.CI,
  retries: 1, // 실패 시 1회 재시도
  workers: 1, // 단일 워커로 실행
  timeout: 60000, // 테스트당 60초 타임아웃
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // 기존 서버 재사용
    timeout: 120 * 1000,
  },
})
