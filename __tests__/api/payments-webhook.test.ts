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

describe('Payments Webhook API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = 'webhook-secret'

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

    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    })
  })

  afterEach(() => {
    delete process.env.TOSS_PAYMENTS_WEBHOOK_SECRET
  })

  describe('POST /api/payments/webhook', () => {
    it('should return unauthorized when secret mismatch', async () => {
      jest.resetModules()
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          secret: 'wrong-secret',
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: {},
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('Unauthorized')
      expect(response.status).toBe(401)
    })

    it('should handle PAYMENT_STATUS_CHANGED with DONE status', async () => {
      // Payment query
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          pg_order_id: 'order-123',
          reservation_id: 'reservation-1',
          branch_settlement_amount: 90000,
          hq_settlement_amount: 10000,
        },
        error: null,
      })

      // Payment update
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = 'webhook-secret'
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          secret: 'webhook-secret',
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: {
            orderId: 'order-123',
            paymentKey: 'payment-key-123',
            status: 'DONE',
          },
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should handle PAYMENT_STATUS_CHANGED with CANCELED status', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          pg_order_id: 'order-123',
          reservation_id: 'reservation-1',
        },
        error: null,
      })

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = 'webhook-secret'
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          secret: 'webhook-secret',
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: {
            orderId: 'order-123',
            status: 'CANCELED',
          },
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should handle PAYMENT_STATUS_CHANGED with EXPIRED status', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          pg_order_id: 'order-123',
          reservation_id: 'reservation-1',
        },
        error: null,
      })

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = 'webhook-secret'
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          secret: 'webhook-secret',
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: {
            orderId: 'order-123',
            status: 'EXPIRED',
          },
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should handle SETTLEMENT_COMPLETED event', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          pg_order_id: 'order-123',
          branch_submall_id: 'branch-submall',
          hq_submall_id: 'hq-submall',
          branch_settlement_status: 'processing',
          hq_settlement_status: 'processing',
        },
        error: null,
      })

      // Update returns payment with updated status
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                branch_settlement_status: 'completed',
                hq_settlement_status: 'processing',
              },
              error: null,
            }),
          }),
        }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = 'webhook-secret'
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          secret: 'webhook-secret',
          eventType: 'SETTLEMENT_COMPLETED',
          data: {
            orderId: 'order-123',
            subMallId: 'branch-submall',
            settlementAmount: 90000,
          },
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should handle SETTLEMENT_FAILED event', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'payment-1',
          pg_order_id: 'order-123',
          branch_submall_id: 'branch-submall',
          hq_submall_id: 'hq-submall',
        },
        error: null,
      })

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })

      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = 'webhook-secret'
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          secret: 'webhook-secret',
          eventType: 'SETTLEMENT_FAILED',
          data: {
            orderId: 'order-123',
            subMallId: 'branch-submall',
            failReason: '계좌 정보 오류',
          },
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should handle unknown event types gracefully', async () => {
      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = 'webhook-secret'
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          secret: 'webhook-secret',
          eventType: 'UNKNOWN_EVENT',
          data: {},
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should work without webhook secret configured', async () => {
      delete process.env.TOSS_PAYMENTS_WEBHOOK_SECRET

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/webhook/route')

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: { status: 'DONE' },
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      // Should succeed when no secret is configured (no verification)
      expect(json.success).toBe(true)
    })
  })
})
