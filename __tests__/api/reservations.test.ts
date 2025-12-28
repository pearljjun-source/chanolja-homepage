/**
 * @jest-environment node
 */

describe('Reservations API', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn(),
    }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    }))
  })

  describe('GET /api/reservations', () => {
    it('should return reservations list with pagination', async () => {
      const mockReservations = [
        { id: 'res-1', customer_name: '홍길동', status: 'pending' },
        { id: 'res-2', customer_name: '김철수', status: 'confirmed' },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockReservations,
          error: null,
          count: 2,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { GET } = await import('@/app/api/reservations/route')

      const request = new Request('http://localhost:3000/api/reservations?page=1&page_size=20')
      const response = await GET(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockReservations)
      expect(json.total).toBe(2)
      expect(json.page).toBe(1)
      expect(json.pageSize).toBe(20)
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: 0,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { GET } = await import('@/app/api/reservations/route')

      const request = new Request('http://localhost:3000/api/reservations')
      const response = await GET(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('Database error')
      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/reservations', () => {
    it('should return error when required fields are missing', async () => {
      const { POST } = await import('@/app/api/reservations/route')

      const request = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: '홍길동',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('필수 필드가 누락되었습니다.')
      expect(response.status).toBe(400)
    })

    it('should return error when vehicle is already reserved', async () => {
      const mockCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [{ id: 'existing-res' }],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockCheckQuery)

      const { POST } = await import('@/app/api/reservations/route')

      const request = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          branch_id: 'branch-1',
          vehicle_id: 'vehicle-1',
          customer_name: '홍길동',
          customer_phone: '01012345678',
          start_date: '2024-01-15',
          end_date: '2024-01-17',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('해당 기간에 이미 예약이 있습니다.')
      expect(response.status).toBe(400)
    })

    it('should create reservation successfully', async () => {
      // First call - check existing reservations (none found)
      const mockCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      // Second call - insert reservation
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-reservation',
            customer_name: '홍길동',
            status: 'pending',
          },
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockInsertQuery)

      const { POST } = await import('@/app/api/reservations/route')

      const request = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          branch_id: 'branch-1',
          vehicle_id: 'vehicle-1',
          customer_name: '홍길동',
          customer_phone: '01012345678',
          start_date: '2024-01-15',
          end_date: '2024-01-17',
          total_price: 150000,
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toBe('예약이 접수되었습니다.')
    })

    it('should handle insert errors', async () => {
      const mockCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockInsertQuery)

      const { POST } = await import('@/app/api/reservations/route')

      const request = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          branch_id: 'branch-1',
          vehicle_id: 'vehicle-1',
          customer_name: '홍길동',
          customer_phone: '01012345678',
          start_date: '2024-01-15',
          end_date: '2024-01-17',
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('Insert failed')
      expect(response.status).toBe(500)
    })
  })
})
