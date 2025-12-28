/**
 * @jest-environment node
 */

// Mock Supabase
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: mockFrom,
  })),
}))

// Mock calculateSplitAmounts
jest.mock('@/lib/payments/toss-client', () => ({
  calculateSplitAmounts: jest.fn((amount: number) => ({
    branchAmount: Math.floor(amount * 0.9),
    hqAmount: Math.ceil(amount * 0.1),
    branchRatio: 90,
    hqRatio: 10,
  })),
}))

describe('Payments Request API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DEFAULT_BRANCH_SUBMALL_ID = 'default-branch-submall'
    process.env.HQ_SUBMALL_ID = 'hq-submall'
    process.env.NEXT_PUBLIC_URL = 'http://localhost:3000'

    // Default mock chain setup
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  afterEach(() => {
    delete process.env.DEFAULT_BRANCH_SUBMALL_ID
    delete process.env.HQ_SUBMALL_ID
    delete process.env.NEXT_PUBLIC_URL
  })

  describe('POST /api/payments/request', () => {
    it('should return error when reservation_id is missing', async () => {
      jest.resetModules()
      const { POST } = await import('@/app/api/payments/request/route')

      const request = new Request('http://localhost:3000/api/payments/request', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('예약 ID가 필요합니다.')
      expect(response.status).toBe(400)
    })

    it('should return error when virtualAccount selected without bank', async () => {
      jest.resetModules()
      const { POST } = await import('@/app/api/payments/request/route')

      const request = new Request('http://localhost:3000/api/payments/request', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: 'test-reservation',
          payment_method: 'virtualAccount',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('가상계좌 발급 시 은행을 선택해주세요.')
      expect(response.status).toBe(400)
    })

    it('should return error when reservation not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/request/route')

      const request = new Request('http://localhost:3000/api/payments/request', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: 'non-existent',
          payment_method: 'card',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('예약을 찾을 수 없습니다.')
      expect(response.status).toBe(404)
    })

    it('should return error when reservation already paid', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'test-reservation',
          payment_status: 'paid',
          total_price: 100000,
          branch: { submall_id: 'branch-1', hq_submall_id: 'hq-1' },
        },
        error: null,
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/request/route')

      const request = new Request('http://localhost:3000/api/payments/request', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: 'test-reservation',
          payment_method: 'card',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('이미 결제가 완료된 예약입니다.')
      expect(response.status).toBe(400)
    })

    it('should create payment request for card payment', async () => {
      // First call - reservation query
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'test-reservation',
          payment_status: 'pending',
          total_price: 100000,
          customer_name: '홍길동',
          customer_phone: '01012345678',
          customer_email: 'test@test.com',
          start_date: '2024-01-15',
          end_date: '2024-01-17',
          branch_id: 'branch-1',
          branch: {
            id: 'branch-1',
            name: '강남지점',
            submall_id: 'branch-submall-1',
            hq_submall_id: 'hq-submall-1',
          },
          vehicle: {
            name: 'K5',
            brand: '기아',
            model: 'K5',
          },
        },
        error: null,
      })

      // Second call - payment insert
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'payment-1' },
            error: null,
          }),
        }),
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/request/route')

      const request = new Request('http://localhost:3000/api/payments/request', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: 'test-reservation',
          payment_method: 'card',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data).toHaveProperty('payment_id')
      expect(json.data).toHaveProperty('orderId')
      expect(json.data.amount).toBe(100000)
      expect(json.data.customerName).toBe('홍길동')
      expect(json.data.splitInfo).toBeDefined()
    })

    it('should include bank info for virtual account payment', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'test-reservation',
          payment_status: 'pending',
          total_price: 50000,
          customer_name: '김철수',
          customer_phone: '01098765432',
          start_date: '2024-02-01',
          end_date: '2024-02-03',
          branch_id: 'branch-1',
          branch: {
            submall_id: 'branch-submall',
            hq_submall_id: 'hq-submall',
          },
          vehicle: { name: '소나타' },
        },
        error: null,
      })

      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'payment-2' },
            error: null,
          }),
        }),
      })

      jest.resetModules()
      const { POST } = await import('@/app/api/payments/request/route')

      const request = new Request('http://localhost:3000/api/payments/request', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: 'test-reservation',
          payment_method: 'virtualAccount',
          bank: '국민',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data.bank).toBe('국민')
      expect(json.data.bankCode).toBe('KOOKMIN')
      expect(json.data.virtualAccountUrl).toBeDefined()
    })
  })
})
