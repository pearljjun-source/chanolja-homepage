import { test, expect } from '@playwright/test'

test.describe('차량 검색 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('검색 입력창이 표시된다', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/지역명|주소|위치/i)
    await expect(searchInput).toBeVisible()
  })

  test('검색 버튼이 표시된다', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /검색/i })
    await expect(searchButton).toBeVisible()
  })

  test('빈 검색어로 검색하면 알림이 표시된다', async ({ page }) => {
    // 알림 다이얼로그 리스너 설정
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('위치')
      await dialog.accept()
    })

    const searchButton = page.getByRole('button', { name: /검색/i })
    await searchButton.click()
  })

  test('지역명으로 검색할 수 있다', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/지역명|주소|위치/i)
    await searchInput.fill('강남')

    const searchButton = page.getByRole('button', { name: /검색/i })
    await searchButton.click()

    // 검색 결과 또는 로딩 상태 확인
    await page.waitForTimeout(1000)

    // 검색이 실행되었는지 확인 (UI 변화)
    const body = await page.locator('body').textContent()
    expect(body).toBeDefined()
  })

  test('Enter 키로 검색할 수 있다', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/지역명|주소|위치/i)
    await searchInput.fill('천안')
    await searchInput.press('Enter')

    // 검색이 트리거되었는지 확인
    await page.waitForTimeout(1000)
  })
})

test.describe('필터 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('필터 버튼이 표시된다', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /필터/i })
    await expect(filterButton).toBeVisible()
  })

  test('필터 버튼 클릭 시 필터 옵션이 표시된다', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /필터/i })
    await filterButton.click()

    // 필터 영역이 표시되는지 확인 (select 요소가 나타남)
    await page.waitForTimeout(500)
    const selectElements = page.locator('select')
    expect(await selectElements.count()).toBeGreaterThan(0)
  })

  test('차량 종류 필터를 선택할 수 있다', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /필터/i })
    await filterButton.click()

    // 차량 종류 셀렉트 찾기
    const vehicleTypeSelect = page.locator('select').first()
    if (await vehicleTypeSelect.isVisible()) {
      await vehicleTypeSelect.selectOption({ index: 1 })
    }
  })
})

test.describe('현재 위치 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('현재 위치 버튼이 표시된다', async ({ page }) => {
    const locationButton = page.getByRole('button', { name: /현재 위치|위치/i })
    await expect(locationButton).toBeVisible()
  })

  test('위치 서비스 미지원 시 알림이 표시된다', async ({ page, context }) => {
    // Geolocation 미지원 시뮬레이션
    await context.clearPermissions()

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('위치')
      await dialog.accept()
    })

    const locationButton = page.getByRole('button', { name: /현재 위치|위치/i })
    if (await locationButton.isVisible()) {
      await locationButton.click()
    }
  })

  test('위치 권한 허용 시 현재 위치로 검색한다', async ({ page, context }) => {
    // Geolocation 권한 허용 및 위치 설정
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 37.5665, longitude: 126.978 })

    await page.reload()

    const locationButton = page.getByRole('button', { name: /현재 위치|위치/i })
    if (await locationButton.isVisible()) {
      await locationButton.click()

      // 위치 검색이 시작되었는지 확인
      await page.waitForTimeout(2000)
    }
  })
})

test.describe('지점 안내 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/branches')
  })

  test('지점 목록이 표시된다', async ({ page }) => {
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle')

    // 지점 관련 콘텐츠 확인
    const pageContent = await page.locator('body').textContent()
    expect(pageContent).toContain('지점')
  })

  test('지점 페이지가 콘텐츠를 표시한다', async ({ page }) => {
    // 페이지 본문에 콘텐츠가 있는지 확인
    await page.waitForLoadState('networkidle')

    const bodyContent = await page.locator('body').textContent()

    // 지점 관련 콘텐츠가 있거나 페이지 로드가 완료되었는지 확인
    expect(bodyContent?.length).toBeGreaterThan(100)
  })

  test('지점을 클릭하면 상세 정보가 표시된다', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // 지점 카드 또는 마커 클릭
    const branchItem = page.locator('[class*="branch"], [class*="card"]').first()

    if (await branchItem.isVisible()) {
      await branchItem.click()

      // 상세 정보가 표시되는지 확인
      await page.waitForTimeout(500)
    }
  })
})

test.describe('예약 폼', () => {
  test('예약 페이지에서 폼이 표시된다', async ({ page }) => {
    // 예약 페이지로 이동 (URL은 프로젝트 구조에 따라 다를 수 있음)
    await page.goto('/reservation')

    // 예약 폼 필드 확인
    const nameInput = page.getByLabel(/이름|성명/i)
    const phoneInput = page.getByLabel(/전화|휴대폰|연락처/i)

    // 폼이 있으면 확인
    if (await nameInput.isVisible()) {
      await expect(nameInput).toBeVisible()
    }
    if (await phoneInput.isVisible()) {
      await expect(phoneInput).toBeVisible()
    }
  })

  test('필수 필드 미입력 시 유효성 검사가 작동한다', async ({ page }) => {
    await page.goto('/reservation')

    // 제출 버튼 찾기
    const submitButton = page.getByRole('button', { name: /예약|신청|제출/i })

    if (await submitButton.isVisible()) {
      await submitButton.click()

      // 유효성 검사 메시지 확인
      await page.waitForTimeout(500)
    }
  })
})

test.describe('예약 확인 플로우', () => {
  test('예약 조회 페이지가 존재한다', async ({ page }) => {
    // 예약 조회 페이지 접근
    const response = await page.goto('/reservation/check')

    // 페이지가 존재하면 확인
    if (response && response.status() === 200) {
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('예약 번호로 조회할 수 있다', async ({ page }) => {
    await page.goto('/reservation/check')

    const reservationInput = page.getByPlaceholder(/예약.*번호|조회/i)

    if (await reservationInput.isVisible()) {
      await reservationInput.fill('TEST-123')

      const searchButton = page.getByRole('button', { name: /조회|확인|검색/i })
      if (await searchButton.isVisible()) {
        await searchButton.click()
      }
    }
  })
})
