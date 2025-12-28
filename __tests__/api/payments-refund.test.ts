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

describe('Payments Refund API', () => {
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

    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  afterEach(() => {
    delete process.env.TOSS_PAYMENTS_SECRET_KEY
  })

  describe('POST /api/payments/refund', () => {
    it('should return error when payment_id is missing', async () => {
      jest.resetModules()
      const { POST } = await import('@/app/api/payments/refund/route')

      const request = new Request('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('결제 ID가 필요합니다.')
      expect(response.status).toBe(400)
    })

    it('should return error when payment not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/refund/route')

      const request = new Request('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({ payment_id: 'non-existent' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('결제 정보를 찾을 수 없습니다.')
      expect(response.status).toBe(404)
    })

    it('should return error when payment is not completed', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'payment-1',
          status: 'pending', // Not completed
          amount: 100000,
        },
        error: null,
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/refund/route')

      const request = new Request('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({ payment_id: 'payment-1' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('완료된 결제만 환불 가능합니다.')
      expect(response.status).toBe(400)
    })

    it('should return error when secret key not configured', async () => {
      delete process.env.TOSS_PAYMENTS_SECRET_KEY

      mockSingle.mockResolvedValue({
        data: {
          id: 'payment-1',
          status: 'completed',
          amount: 100000,
        },
        error: null,
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/refund/route')

      const request = new Request('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({ payment_id: 'payment-1' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('결제 설정이 완료되지 않았습니다.')
      expect(response.status).toBe(500)
    })

    it('should process full refund successfully', async () => {
      // Payment query
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          status: 'completed',
          amount: 100000,
          pg_transaction_id: 'toss-key-123',
          reservation_id: 'reservation-1',
        },
        error: null,
      })

      // Toss API refund response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          paymentKey: 'toss-key-123',
          status: 'CANCELED',
          cancels: [{ cancelAmount: 100000 }],
        }),
      })

      // Payment update
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'payment-1', status: 'refunded' },
              error: null,
            }),
          }),
        }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_SECRET_KEY = 'test-secret-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/payments/refund/route')

      const request = new Request('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: 'payment-1',
          refund_reason: '고객 변심',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toContain('100,000원이 환불되었습니다')
    })

    it('should process partial refund successfully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          status: 'completed',
          amount: 100000,
          pg_transaction_id: 'toss-key-123',
          reservation_id: 'reservation-1',
        },
        error: null,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          paymentKey: 'toss-key-123',
          status: 'PARTIAL_CANCELED',
        }),
      })

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'payment-1', status: 'partial_refund' },
              error: null,
            }),
          }),
        }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_SECRET_KEY = 'test-secret-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/payments/refund/route')

      const request = new Request('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: 'payment-1',
          refund_amount: 30000, // Partial refund
          refund_reason: '부분 취소',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toContain('30,000원이 환불되었습니다')
    })

    it('should handle Toss API refund failure', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          status: 'completed',
          amount: 100000,
          pg_transaction_id: 'toss-key-123',
        },
        error: null,
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: '이미 취소된 결제입니다.',
        }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_SECRET_KEY = 'test-secret-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/payments/refund/route')

      const request = new Request('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        body: JSON.stringify({ payment_id: 'payment-1' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('이미 취소된 결제입니다.')
      expect(response.status).toBe(400)
    })
  })
})
