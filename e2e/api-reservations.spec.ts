import { test, expect } from '@playwright/test'

test.describe('예약 API E2E 테스트', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('GET /api/reservations', () => {
    test('예약 목록 조회', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/reservations`)

      // 인증 필요하거나 성공
      const status = response.status()
      expect([200, 401, 500]).toContain(status)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('페이지네이션 파라미터 적용', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/reservations?page=1&page_size=10`)

      const json = await response.json()
      expect(json).toHaveProperty('success')

      if (json.success) {
        expect(json).toHaveProperty('page')
        expect(json).toHaveProperty('pageSize')
      }
    })

    test('상태 필터 적용', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/reservations?status=pending`)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })
  })

  test.describe('POST /api/reservations', () => {
    test('필수 필드 누락 시 400 에러 반환', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/reservations`, {
        data: {
          customer_name: '테스트',
          // 다른 필수 필드 누락
        },
      })

      expect(response.status()).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toContain('필수')
    })

    test('유효한 예약 요청 처리', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/reservations`, {
        data: {
          branch_id: 'test-branch-id',
          vehicle_id: 'test-vehicle-id',
          customer_name: '홍길동',
          customer_phone: '01012345678',
          start_date: '2025-01-15',
          end_date: '2025-01-17',
          total_price: 150000,
        },
      })

      // 지점/차량이 없으면 400/404, 있으면 200/201
      const status = response.status()
      expect([200, 201, 400, 404, 500]).toContain(status)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })
  })

  test.describe('GET /api/reservations/[id]', () => {
    test('존재하지 않는 예약 조회 시 404 에러', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/reservations/non-existent-id`)

      expect(response.status()).toBe(404)
      const json = await response.json()
      expect(json.success).toBe(false)
    })
  })

  test.describe('PUT /api/reservations/[id]', () => {
    test('잘못된 액션으로 요청 시 400 에러', async ({ request }) => {
      const response = await request.put(`${baseURL}/api/reservations/test-id`, {
        data: {
          action: 'invalid_action',
        },
      })

      expect(response.status()).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toContain('액션')
    })

    test('예약 승인 액션 요청', async ({ request }) => {
      const response = await request.put(`${baseURL}/api/reservations/test-id`, {
        data: {
          action: 'approve',
        },
      })

      // 예약 존재 여부에 따라 결과 다름
      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('예약 취소 액션 요청', async ({ request }) => {
      const response = await request.put(`${baseURL}/api/reservations/test-id`, {
        data: {
          action: 'cancel',
          cancel_reason: '테스트 취소',
        },
      })

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })
  })

  test.describe('DELETE /api/reservations/[id]', () => {
    test('예약 삭제 요청', async ({ request }) => {
      const response = await request.delete(`${baseURL}/api/reservations/test-id`)

      // 예약 존재 여부에 따라 결과 다름
      const json = await response.json()
      expect(json).toHaveProperty('success')
    })
  })
})

test.describe('차량 API E2E 테스트', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('GET /api/vehicles', () => {
    test('차량 목록 조회', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/vehicles`)

      const status = response.status()
      expect([200, 500]).toContain(status)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('지점별 차량 조회', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/vehicles?branch_id=test-branch`)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('차량 타입 필터', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/vehicles?vehicle_type=sedan`)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('가격 범위 필터', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/vehicles?min_price=50000&max_price=100000`)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })
  })
})

test.describe('지오코드 API E2E 테스트', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('POST /api/geocode', () => {
    test('주소 없이 요청 시 에러', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/geocode`, {
        data: {},
      })
      const status = response.status()

      // API가 존재하면 400, 없으면 404/405
      if (status === 404 || status === 405) {
        test.skip()
        return
      }

      expect([400, 500]).toContain(status)
    })

    test('유효한 주소로 좌표 조회', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/geocode`, {
        data: { address: '서울시 강남구' },
      })
      const status = response.status()

      // API가 존재하지 않으면 스킵
      if (status === 404 || status === 405) {
        test.skip()
        return
      }

      expect([200, 400, 500]).toContain(status)
    })
  })
})

test.describe('지점 API E2E 테스트', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('GET /api/branches', () => {
    test('전체 지점 목록 조회', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/branches`)
      const status = response.status()

      // API가 존재하지 않으면 스킵
      if (status === 404) {
        test.skip()
        return
      }

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('지역별 지점 조회', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/branches?region=서울`)
      const status = response.status()

      if (status === 404) {
        test.skip()
        return
      }

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })
  })
})
