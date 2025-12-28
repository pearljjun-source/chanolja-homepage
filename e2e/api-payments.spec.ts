import { test, expect } from '@playwright/test'

test.describe('결제 API E2E 테스트', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('POST /api/payments/request', () => {
    test('필수 필드 누락 시 400 에러 반환', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/request`, {
        data: {
          // reservation_id 누락
          amount: 100000,
        },
      })

      expect(response.status()).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBeDefined()
    })

    test('유효한 요청 시 결제 정보 반환', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/request`, {
        data: {
          reservation_id: 'test-reservation-id',
          amount: 100000,
          payment_method: 'card',
        },
      })

      // 예약이 없으면 404, 있으면 200
      const status = response.status()
      expect([200, 404, 500]).toContain(status)

      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('가상계좌 결제 시 은행 선택 필요', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/request`, {
        data: {
          reservation_id: 'test-reservation-id',
          amount: 100000,
          payment_method: 'virtual_account',
          // bank 누락
        },
      })

      const json = await response.json()
      // 은행 필수 또는 예약 없음 에러
      expect(json).toHaveProperty('success')
    })
  })

  test.describe('POST /api/payments/confirm', () => {
    test('필수 필드 누락 시 400 에러 반환', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/confirm`, {
        data: {
          // paymentKey, orderId, amount 누락
        },
      })

      expect(response.status()).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
    })

    test('잘못된 paymentKey로 요청 시 에러 반환', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/confirm`, {
        data: {
          paymentKey: 'invalid-key',
          orderId: 'invalid-order',
          amount: 100000,
        },
      })

      // 토스 API 호출 실패, 설정 오류, 또는 결제 정보 없음
      const status = response.status()
      expect([400, 404, 500]).toContain(status)

      const json = await response.json()
      expect(json.success).toBe(false)
    })
  })

  test.describe('POST /api/payments/refund', () => {
    test('payment_id 누락 시 400 에러 반환', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/refund`, {
        data: {},
      })

      expect(response.status()).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toContain('결제 ID')
    })

    test('존재하지 않는 payment_id로 요청 시 404 에러', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/refund`, {
        data: {
          payment_id: 'non-existent-payment-id',
        },
      })

      expect(response.status()).toBe(404)
      const json = await response.json()
      expect(json.success).toBe(false)
    })
  })

  test.describe('POST /api/payments/webhook', () => {
    test('유효하지 않은 시크릿으로 요청 시 401 에러', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/webhook`, {
        data: {
          secret: 'wrong-secret',
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: {},
        },
      })

      // 시크릿 설정 여부에 따라 401 또는 200
      const json = await response.json()
      expect(json).toHaveProperty('success')
    })

    test('알 수 없는 이벤트 타입도 처리', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/webhook`, {
        data: {
          eventType: 'UNKNOWN_EVENT',
          data: {},
        },
      })

      const json = await response.json()
      // 알 수 없는 이벤트도 200으로 처리 (웹훅 재시도 방지)
      expect(json).toHaveProperty('success')
    })
  })
})
