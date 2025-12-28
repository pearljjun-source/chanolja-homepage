/**
 * @jest-environment node
 */

// Mock Supabase
const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: mockFrom,
  })),
}))

// Mock fetch for Toss API
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Payments Confirm API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TOSS_PAYMENTS_SECRET_KEY = 'test-secret-key'

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  afterEach(() => {
    delete process.env.TOSS_PAYMENTS_SECRET_KEY
  })

  describe('POST /api/payments/confirm', () => {
    it('should return error when required params are missing', async () => {
      jest.resetModules()
      const { POST } = await import('@/app/api/payments/confirm/route')

      const request = new Request('http://localhost:3000/api/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentKey: 'key123' }), // missing orderId, amount
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('필수 파라미터가 누락되었습니다.')
      expect(response.status).toBe(400)
    })

    it('should return error when payment record not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/confirm/route')

      const request = new Request('http://localhost:3000/api/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentKey: 'key123',
          orderId: 'order123',
          amount: 100000,
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('결제 정보를 찾을 수 없습니다.')
      expect(response.status).toBe(404)
    })

    it('should return error when amount mismatch', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'payment-1',
          amount: 100000, // DB amount
          branch_submall_id: 'branch-1',
          hq_submall_id: 'hq-1',
        },
        error: null,
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/confirm/route')

      const request = new Request('http://localhost:3000/api/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentKey: 'key123',
          orderId: 'order123',
          amount: 50000, // Different amount
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('결제 금액이 일치하지 않습니다.')
      expect(response.status).toBe(400)
    })

    it('should return error when secret key not configured', async () => {
      delete process.env.TOSS_PAYMENTS_SECRET_KEY

      mockSingle.mockResolvedValue({
        data: {
          id: 'payment-1',
          amount: 100000,
        },
        error: null,
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/confirm/route')

      const request = new Request('http://localhost:3000/api/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentKey: 'key123',
          orderId: 'order123',
          amount: 100000,
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('결제 설정이 완료되지 않았습니다.')
      expect(response.status).toBe(500)
    })

    it('should confirm payment successfully', async () => {
      // Payment record query
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          amount: 100000,
          branch_submall_id: 'branch-submall',
          hq_submall_id: 'hq-submall',
          branch_settlement_amount: 90000,
          hq_settlement_amount: 10000,
        },
        error: null,
      })

      // Toss API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          paymentKey: 'key123',
          status: 'DONE',
          card: {
            company: '신한카드',
            number: '1234-****-****-5678',
            installmentPlanMonths: 0,
          },
        }),
      })

      // Payment update
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          reservation_id: 'reservation-1',
          status: 'completed',
        },
        error: null,
      })

      // Reservation update mock
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_SECRET_KEY = 'test-secret-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/payments/confirm/route')

      const request = new Request('http://localhost:3000/api/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentKey: 'key123',
          orderId: 'order123',
          amount: 100000,
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toBe('결제가 완료되었습니다.')
      expect(json.data.splitInfo).toBeDefined()
    })

    it('should handle Toss API failure', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          amount: 100000,
          branch_submall_id: 'branch-submall',
          hq_submall_id: 'hq-submall',
        },
        error: null,
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: '카드 한도 초과',
        }),
      })

      // Update for failure record
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_SECRET_KEY = 'test-secret-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/payments/confirm/route')

      const request = new Request('http://localhost:3000/api/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentKey: 'key123',
          orderId: 'order123',
          amount: 100000,
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('카드 한도 초과')
      expect(response.status).toBe(400)
    })
  })
})
