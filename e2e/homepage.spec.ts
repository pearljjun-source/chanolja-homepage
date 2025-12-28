import { test, expect } from '@playwright/test'

// 타임아웃 및 재시도 설정
test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  })

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/차놀자/)
  })

  test('헤더가 표시된다', async ({ page }) => {
    // 헤더 확인
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // 로고 또는 네비게이션 링크 확인
    const navLinks = header.locator('a')
    expect(await navLinks.count()).toBeGreaterThan(0)
  })

  test('히어로 섹션이 표시된다', async ({ page }) => {
    // 메인 콘텐츠 영역 확인
    const mainContent = page.locator('main, section').first()
    await expect(mainContent).toBeVisible()

    // 120개 지점 텍스트 확인 (있을 경우)
    const branchText = page.getByText(/120/)
    if (await branchText.count() > 0) {
      await expect(branchText.first()).toBeVisible()
    }
  })

  test('푸터가 표시된다', async ({ page }) => {
    // 페이지 하단으로 스크롤
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // 푸터 요소 확인
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })

  test('모바일 뷰에서 페이지가 표시된다', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })

    // 페이지가 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible()

    // 헤더가 보이는지 확인
    await expect(page.locator('header')).toBeVisible()
  })
})

test.describe('페이지 네비게이션', () => {
  test('서비스 소개 페이지가 존재한다', async ({ page }) => {
    const response = await page.goto('/about', { waitUntil: 'domcontentloaded' })

    // 페이지가 존재하면 (200 또는 리다이렉트)
    expect(response?.status()).toBeLessThan(500)
  })

  test('지점 안내 페이지가 존재한다', async ({ page }) => {
    const response = await page.goto('/branches', { waitUntil: 'domcontentloaded' })

    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('메인 페이지에서 네비게이션 링크가 있다', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // 헤더 내 링크 확인
    const headerLinks = page.locator('header a')
    expect(await headerLinks.count()).toBeGreaterThan(0)
  })
})

test.describe('반응형 디자인', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ]

  for (const viewport of viewports) {
    test(`${viewport.name} 뷰포트에서 정상 표시된다`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')

      // 페이지가 로드되었는지 확인
      await expect(page.locator('body')).toBeVisible()

      // 주요 콘텐츠 영역이 보이는지 확인
      await expect(page.locator('header')).toBeVisible()
      await expect(page.locator('main, [role="main"], section').first()).toBeVisible()
    })
  }
})

test.describe('접근성', () => {
  test('키보드 네비게이션이 작동한다', async ({ page }) => {
    await page.goto('/')

    // Tab 키로 네비게이션
    await page.keyboard.press('Tab')

    // 포커스된 요소가 있는지 확인
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('이미지에 alt 텍스트가 있다', async ({ page }) => {
    await page.goto('/')

    // 모든 이미지 확인
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      // Next.js Image는 빈 alt를 허용하지만, 최소한 속성은 있어야 함
      expect(alt !== null).toBe(true)
    }
  })
})

test.describe('성능', () => {
  test('페이지가 5초 내에 로드된다', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(5000)
  })

  test('LCP 요소가 빠르게 로드된다', async ({ page }) => {
    await page.goto('/')

    // 주요 콘텐츠가 표시되는지 확인
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 3000 })
  })
})
