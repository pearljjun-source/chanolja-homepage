/**
 * @jest-environment node
 */

describe('Reservations Detail API', () => {
  let mockSupabase: any

  // 소유권 검증 쿼리용 mock 헬퍼
  const createOwnershipMock = () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { user_id: null, customer_email: null, branch_id: 'b-1' },
      error: null,
    }),
  })

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST202', message: 'Function not found' },
      }),
    }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    }))

    // 인증 레이어 mock: admin 사용자로 고정 (비즈니스 로직 테스트에 집중)
    jest.doMock('@/lib/auth/rbac', () => ({
      ...jest.requireActual('@/lib/auth/rbac'),
      checkAuth: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'admin-user', email: 'admin@test.com', role: 'admin' },
      }),
    }))
  })

  describe('GET /api/reservations/[id]', () => {
    it('should return reservation details', async () => {
      const mockReservation = {
        id: 'res-1',
        customer_name: '홍길동',
        customer_phone: '01012345678',
        status: 'confirmed',
        branch_id: 'b-1',
        vehicle: { id: 'v-1', name: 'K5' },
        branch: { id: 'b-1', name: '강남지점' },
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockReservation,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { GET } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1')
      const response = await GET(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data.customer_name).toBe('홍길동')
      expect(json.data.vehicle).toBeDefined()
    })

    it('should return 404 when reservation not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { GET } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/non-existent')
      const response = await GET(request as any, { params: Promise.resolve({ id: 'non-existent' }) })
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('예약을 찾을 수 없습니다.')
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/reservations/[id]', () => {
    it('should approve reservation', async () => {
      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'res-1', status: 'approved' },
          error: null,
        }),
      }

      // mockReturnValue → 소유권 검증과 업데이트 모두 같은 mock 사용
      mockSupabase.from.mockReturnValue(mockUpdateQuery)

      const { PUT } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'PUT',
        body: JSON.stringify({ action: 'approve' }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toBe('예약 상태가 변경되었습니다.')
    })

    it('should confirm reservation', async () => {
      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'res-1', status: 'confirmed', payment_status: 'paid' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockUpdateQuery)

      const { PUT } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'PUT',
        body: JSON.stringify({ action: 'confirm' }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should start rental (in_use)', async () => {
      // 1) 소유권 검증 쿼리
      const mockOwnershipQuery = createOwnershipMock()

      // 2) Get vehicle_id
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { vehicle_id: 'vehicle-1' },
          error: null,
        }),
      }

      // 3) Update vehicle status
      const mockVehicleUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      // 4) Update reservation status
      const mockReservationUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'res-1', status: 'in_use' },
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockOwnershipQuery)         // 소유권 검증
        .mockReturnValueOnce(mockSelectQuery)             // Get vehicle_id
        .mockReturnValueOnce(mockVehicleUpdateQuery)      // Update vehicle
        .mockReturnValueOnce(mockReservationUpdateQuery)  // Update reservation

      const { PUT } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'PUT',
        body: JSON.stringify({ action: 'start' }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should cancel reservation', async () => {
      const mockOwnershipQuery = createOwnershipMock()

      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { vehicle_id: 'vehicle-1' },
          error: null,
        }),
      }

      const mockVehicleUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      const mockReservationUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'res-1', status: 'cancelled' },
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockOwnershipQuery)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockVehicleUpdateQuery)
        .mockReturnValueOnce(mockReservationUpdateQuery)

      const { PUT } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'PUT',
        body: JSON.stringify({ action: 'cancel', cancel_reason: '고객 변심' }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(true)
    })

    it('should return error for invalid action', async () => {
      // 소유권 검증은 통과해야 함
      mockSupabase.from.mockReturnValue(createOwnershipMock())

      const { PUT } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'PUT',
        body: JSON.stringify({ action: 'invalid_action' }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('잘못된 액션입니다.')
      expect(response.status).toBe(400)
    })

    it('should update reservation info without action', async () => {
      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'res-1', customer_phone: '01098765432' },
          error: null,
        }),
      }

      // mockReturnValue → 소유권 검증과 업데이트 모두 같은 mock 사용
      mockSupabase.from.mockReturnValue(mockUpdateQuery)

      const { PUT } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'PUT',
        body: JSON.stringify({ customer_phone: '01098765432' }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toBe('예약 정보가 수정되었습니다.')
    })
  })

  describe('DELETE /api/reservations/[id]', () => {
    it('should cancel (soft delete) reservation', async () => {
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockSupabase.from.mockReturnValue(mockUpdateQuery)

      const { DELETE } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toBe('예약이 취소되었습니다.')
    })

    it('should handle delete errors', async () => {
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }

      mockSupabase.from.mockReturnValue(mockUpdateQuery)

      const { DELETE } = await import('@/app/api/reservations/[id]/route')

      const request = new Request('http://localhost:3000/api/reservations/res-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request as any, { params: Promise.resolve({ id: 'res-1' }) })
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('예약 취소에 실패했습니다.')
      expect(response.status).toBe(500)
    })
  })
})
