/**
 * @jest-environment node
 */

import crypto from 'crypto'

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

// HMAC-SHA256 서명 생성 헬퍼
function createSignature(rawBody: string, secret: string): string {
  const timestamp = Date.now().toString()
  const signaturePayload = `${timestamp}.${rawBody}`
  const sig = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload, 'utf8')
    .digest('hex')
  return `t=${timestamp},v1=${sig}`
}

const WEBHOOK_SECRET = 'webhook-secret'

describe('Payments Webhook API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET

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
    it('should return unauthorized when signature is missing', async () => {
      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {},
      })

      // Toss-Signature 헤더 없이 요청
      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('Unauthorized')
      expect(response.status).toBe(401)
    })

    it('should return 500 when webhook secret not configured', async () => {
      delete process.env.TOSS_PAYMENTS_WEBHOOK_SECRET

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {},
      })

      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('Webhook not configured')
      expect(response.status).toBe(500)
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
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          orderId: 'order-123',
          paymentKey: 'payment-key-123',
          status: 'DONE',
        },
      })

      const signature = createSignature(body, WEBHOOK_SECRET)
      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'Toss-Signature': signature,
        },
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
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          orderId: 'order-123',
          status: 'CANCELED',
        },
      })

      const signature = createSignature(body, WEBHOOK_SECRET)
      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'Toss-Signature': signature,
        },
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
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          orderId: 'order-123',
          status: 'EXPIRED',
        },
      })

      const signature = createSignature(body, WEBHOOK_SECRET)
      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'Toss-Signature': signature,
        },
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
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'SETTLEMENT_COMPLETED',
        data: {
          orderId: 'order-123',
          subMallId: 'branch-submall',
          settlementAmount: 90000,
        },
      })

      const signature = createSignature(body, WEBHOOK_SECRET)
      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'Toss-Signature': signature,
        },
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
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'SETTLEMENT_FAILED',
        data: {
          orderId: 'order-123',
          subMallId: 'branch-submall',
          failReason: '계좌 정보 오류',
        },
      })

      const signature = createSignature(body, WEBHOOK_SECRET)
      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'Toss-Signature': signature,
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should handle unknown event types gracefully', async () => {
      jest.resetModules()
      process.env.TOSS_PAYMENTS_WEBHOOK_SECRET = WEBHOOK_SECRET
      const { POST } = await import('@/app/api/payments/webhook/route')

      const body = JSON.stringify({
        eventType: 'UNKNOWN_EVENT',
        data: {},
      })

      const signature = createSignature(body, WEBHOOK_SECRET)
      const request = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'Toss-Signature': signature,
        },
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
    })
  })
})
