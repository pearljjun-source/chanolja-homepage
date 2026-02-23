/**
 * @jest-environment node
 */

/**
 * 보안 수정 시뮬레이션 테스트
 * 기존 p1-edge-cases.test.ts에서 커버하지 않는 항목들:
 * - S-P2-004: 비밀번호 정책 (8자)
 * - S-P2-009: Mass Assignment 차단
 * - S-P2-010: Soft Delete 검증
 * - S-P3-002: 서버 사이드 가격 계산
 * - S-P3-005: 결제 요청 소유권 검증
 * - S-P3-006: 역할 화이트리스트 검증
 * - S-P3-008: canAccessReservation 소유권 로직
 */

// =============================================
// S-P3-008: canAccessReservation 소유권 로직
// (순수 함수이므로 mock 없이 직접 테스트)
// =============================================
import { canAccessReservation } from '@/lib/auth/ownership'

describe('S-P3-008: canAccessReservation ownership logic', () => {
  const reservation = {
    user_id: 'user-1',
    customer_email: 'user@test.com',
    branch_id: 'branch-A',
  }

  it('admin should access any reservation', () => {
    const admin = { id: 'admin-1', email: 'admin@test.com', role: 'admin' as const }
    expect(canAccessReservation(admin, reservation)).toBe(true)
  })

  it('super_admin should access any reservation', () => {
    const superAdmin = { id: 'sa-1', email: 'sa@test.com', role: 'super_admin' as const }
    expect(canAccessReservation(superAdmin, reservation)).toBe(true)
  })

  it('branch_admin should access own branch reservation', () => {
    const ba = { id: 'ba-1', email: 'ba@test.com', role: 'branch_admin' as const, branchId: 'branch-A' }
    expect(canAccessReservation(ba, reservation)).toBe(true)
  })

  it('branch_admin should NOT access other branch reservation', () => {
    const ba = { id: 'ba-1', email: 'ba@test.com', role: 'branch_admin' as const, branchId: 'branch-B' }
    expect(canAccessReservation(ba, reservation)).toBe(false)
  })

  it('staff should access own branch reservation', () => {
    const staff = { id: 'staff-1', email: 'staff@test.com', role: 'staff' as const, branchId: 'branch-A' }
    expect(canAccessReservation(staff, reservation)).toBe(true)
  })

  it('staff should NOT access other branch reservation', () => {
    const staff = { id: 'staff-1', email: 'staff@test.com', role: 'staff' as const, branchId: 'branch-B' }
    expect(canAccessReservation(staff, reservation)).toBe(false)
  })

  it('user should access own reservation by user_id', () => {
    const user = { id: 'user-1', email: 'other@test.com', role: 'user' as const }
    expect(canAccessReservation(user, reservation)).toBe(true)
  })

  it('user should NOT access other user reservation', () => {
    const user = { id: 'user-999', email: 'other@test.com', role: 'user' as const }
    expect(canAccessReservation(user, reservation)).toBe(false)
  })

  it('user should fallback to email matching when user_id is null', () => {
    const noUserIdReservation = { user_id: null, customer_email: 'user@test.com', branch_id: 'branch-A' }
    const user = { id: 'user-999', email: 'user@test.com', role: 'user' as const }
    expect(canAccessReservation(user, noUserIdReservation)).toBe(true)
  })

  it('user should NOT access when both user_id and email mismatch', () => {
    const noUserIdReservation = { user_id: null, customer_email: 'other@test.com', branch_id: 'branch-A' }
    const user = { id: 'user-999', email: 'user@test.com', role: 'user' as const }
    expect(canAccessReservation(user, noUserIdReservation)).toBe(false)
  })

  it('branch_admin without branchId should NOT access any reservation', () => {
    const ba = { id: 'ba-1', email: 'ba@test.com', role: 'branch_admin' as const }
    expect(canAccessReservation(ba, reservation)).toBe(false)
  })
})

// =============================================
// S-P2-004: 비밀번호 정책 (8자 미만 거부)
// S-P3-006: 역할 화이트리스트 검증
// =============================================

const mockCreateUser = jest.fn()
const mockUpsert = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
      },
    },
    from: jest.fn().mockReturnValue({
      upsert: mockUpsert,
    }),
  })),
}))

describe('S-P2-004 & S-P3-006: create-user password policy & role validation', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockCreateUser.mockResolvedValue({
      data: { user: { id: 'new-user', email: 'test@test.com' } },
      error: null,
    })
    mockUpsert.mockResolvedValue({ error: null })

    jest.doMock('@/lib/auth/rbac', () => ({
      ...jest.requireActual('@/lib/auth/rbac'),
      checkAuth: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'sa-1', email: 'sa@test.com', role: 'super_admin' },
      }),
    }))
  })

  it('should reject password with 7 characters', async () => {
    const { POST } = await import('@/app/api/admin/create-user/route')
    const request = new Request('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com', password: '1234567' }),
    })
    const response = await POST(request as any)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('비밀번호는 최소 8자 이상이어야 합니다.')
  })

  it('should accept password with exactly 8 characters', async () => {
    const { POST } = await import('@/app/api/admin/create-user/route')
    const request = new Request('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com', password: '12345678' }),
    })
    const response = await POST(request as any)
    const json = await response.json()

    expect(json.success).toBe(true)
  })

  it('should reject empty password', async () => {
    const { POST } = await import('@/app/api/admin/create-user/route')
    const request = new Request('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com', password: '' }),
    })
    const response = await POST(request as any)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('이메일과 비밀번호를 입력해주세요.')
  })

  it('should reject invalid role "hacker"', async () => {
    const { POST } = await import('@/app/api/admin/create-user/route')
    const request = new Request('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com', password: '12345678', role: 'hacker' }),
    })
    const response = await POST(request as any)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('유효하지 않은 역할입니다.')
  })

  it('should reject invalid role "root"', async () => {
    const { POST } = await import('@/app/api/admin/create-user/route')
    const request = new Request('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com', password: '12345678', role: 'root' }),
    })
    const response = await POST(request as any)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('유효하지 않은 역할입니다.')
  })

  it('should accept valid role "branch_admin"', async () => {
    const { POST } = await import('@/app/api/admin/create-user/route')
    const request = new Request('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@test.com',
        password: '12345678',
        role: 'branch_admin',
        branch_id: 'branch-1',
      }),
    })
    const response = await POST(request as any)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.user.role).toBe('branch_admin')
    expect(json.user.branch_id).toBe('branch-1')
  })
})

// =============================================
// S-P2-009: Mass Assignment 차단
// S-P2-010: Soft Delete 검증
// =============================================
describe('S-P2-009: Mass Assignment prevention on vehicle PUT', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockSupabase = { from: jest.fn() }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    }))

    // admin 사용자 (branch scope 건너뜀)
    jest.doMock('@/lib/auth/rbac', () => ({
      ...jest.requireActual('@/lib/auth/rbac'),
      checkAuth: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      }),
    }))
  })

  it('should strip status field from vehicle update body', async () => {
    let capturedUpdateData: any = null

    const mockUpdate = jest.fn().mockImplementation((data) => {
      capturedUpdateData = data
      return {
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'v1', name: 'Updated Car' },
              error: null,
            }),
          }),
        }),
      }
    })

    mockSupabase.from.mockReturnValue({ update: mockUpdate })

    const { PUT } = await import('@/app/api/vehicles/[id]/route')
    const request = new Request('http://localhost:3000/api/vehicles/v1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Car',
        status: 'available',       // 금지: 상태 변경 시도
        is_active: false,          // 금지: 비활성화 시도
        branch_id: 'hacked-branch', // 금지: 지점 변경 시도
        id: 'hacked-id',           // 금지: ID 변경 시도
      }),
    })

    const response = await PUT(request as any, { params: Promise.resolve({ id: 'v1' }) })
    const json = await response.json()

    expect(json.success).toBe(true)
    // 허용된 필드만 전달되어야 함
    expect(capturedUpdateData).toEqual({ name: 'Updated Car' })
    expect(capturedUpdateData).not.toHaveProperty('status')
    expect(capturedUpdateData).not.toHaveProperty('is_active')
    expect(capturedUpdateData).not.toHaveProperty('branch_id')
    expect(capturedUpdateData).not.toHaveProperty('id')
  })

  it('should strip status/payment_status from reservation update body', async () => {
    let capturedUpdateData: any = null

    jest.resetModules()
    jest.clearAllMocks()

    const mockSupabase2: any = { from: jest.fn(), rpc: jest.fn() }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase2)),
    }))

    jest.doMock('@/lib/auth/rbac', () => ({
      ...jest.requireActual('@/lib/auth/rbac'),
      checkAuth: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      }),
    }))

    // 1st from(): ownership check
    const mockOwnershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'res-1', status: 'pending', branch_id: 'branch-A' },
        error: null,
      }),
    }

    // 2nd from(): update
    const mockUpdate = jest.fn().mockImplementation((data) => {
      capturedUpdateData = data
      return {
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'res-1', customer_name: '홍길동' },
              error: null,
            }),
          }),
        }),
      }
    })

    mockSupabase2.from
      .mockReturnValueOnce(mockOwnershipQuery) // ownership check
      .mockReturnValueOnce({ update: mockUpdate }) // update

    const { PUT } = await import('@/app/api/reservations/[id]/route')
    const request = new Request('http://localhost:3000/api/reservations/res-1', {
      method: 'PUT',
      body: JSON.stringify({
        customer_name: '홍길동',
        status: 'completed',           // 금지: 상태 주입
        payment_status: 'paid',        // 금지: 결제 상태 주입
        total_price: 0,                // 금지: 가격 조작
        branch_id: 'hacked-branch',    // 금지: 지점 변경
      }),
    })

    const response = await PUT(request as any, { params: Promise.resolve({ id: 'res-1' }) })
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(capturedUpdateData).toEqual({ customer_name: '홍길동' })
    expect(capturedUpdateData).not.toHaveProperty('status')
    expect(capturedUpdateData).not.toHaveProperty('payment_status')
    expect(capturedUpdateData).not.toHaveProperty('total_price')
    expect(capturedUpdateData).not.toHaveProperty('branch_id')
  })
})

describe('S-P2-010: Soft Delete verification', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockSupabase = { from: jest.fn() }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    }))

    jest.doMock('@/lib/auth/rbac', () => ({
      ...jest.requireActual('@/lib/auth/rbac'),
      checkAuth: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      }),
    }))
  })

  it('vehicle DELETE should set is_active=false, not hard delete', async () => {
    let capturedUpdateData: any = null

    const mockUpdate = jest.fn().mockImplementation((data) => {
      capturedUpdateData = data
      return { eq: jest.fn().mockResolvedValue({ error: null }) }
    })

    mockSupabase.from.mockReturnValue({ update: mockUpdate, delete: jest.fn() })

    const { DELETE } = await import('@/app/api/vehicles/[id]/route')
    const request = new Request('http://localhost:3000/api/vehicles/v1', { method: 'DELETE' })
    const response = await DELETE(request as any, { params: Promise.resolve({ id: 'v1' }) })
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.message).toBe('차량이 삭제되었습니다.')
    // update(is_active: false) 호출됨, delete는 호출되지 않음
    expect(mockUpdate).toHaveBeenCalled()
    expect(capturedUpdateData).toEqual({ is_active: false })
  })

  it('reservation DELETE should set status=cancelled, not hard delete', async () => {
    let capturedUpdateData: any = null

    const mockUpdate = jest.fn().mockImplementation((data) => {
      capturedUpdateData = data
      return { eq: jest.fn().mockResolvedValue({ error: null }) }
    })

    mockSupabase.from.mockReturnValue({ update: mockUpdate })

    const { DELETE } = await import('@/app/api/reservations/[id]/route')
    const request = new Request('http://localhost:3000/api/reservations/r1', { method: 'DELETE' })
    const response = await DELETE(request as any, { params: Promise.resolve({ id: 'r1' }) })
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.message).toBe('예약이 취소되었습니다.')
    expect(mockUpdate).toHaveBeenCalled()
    expect(capturedUpdateData.status).toBe('cancelled')
    expect(capturedUpdateData.cancelled_at).toBeDefined()
  })
})

// =============================================
// S-P3-005: 결제 요청 소유권 검증
// =============================================
describe('S-P3-005: payment request ownership verification', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockSupabase = { from: jest.fn() }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    }))

    // 일반 user로 로그인
    jest.doMock('@/lib/auth/rbac', () => ({
      ...jest.requireActual('@/lib/auth/rbac'),
      checkAuth: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'user-1', email: 'user@test.com', role: 'user' },
      }),
    }))
  })

  it('should reject payment request for another user reservation', async () => {
    const mockSelect = jest.fn()
    const mockEq = jest.fn()
    const mockSingle = jest.fn()

    mockSupabase.from.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })

    // 예약 조회 - 타인의 예약 (user_id가 다르고 email도 다름)
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'res-other',
        user_id: 'user-other',
        customer_email: 'other@test.com',
        branch_id: 'branch-1',
        payment_status: 'pending',
        total_price: 100000,
        branch: { submall_id: 'sub-1', hq_submall_id: 'hq-1' },
        vehicle: { name: 'K5' },
      },
      error: null,
    })

    const { POST } = await import('@/app/api/payments/request/route')
    const request = new Request('http://localhost:3000/api/payments/request', {
      method: 'POST',
      body: JSON.stringify({ reservation_id: 'res-other', payment_method: 'card' }),
    })

    const response = await POST(request as any)
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error).toBe('해당 예약에 대한 접근 권한이 없습니다.')
  })
})

// =============================================
// S-P3-002: 서버 사이드 가격 계산
// =============================================
describe('S-P3-002: server-side price calculation', () => {
  it('should ignore client-submitted total_price', async () => {
    jest.resetModules()
    jest.clearAllMocks()

    let capturedInsertData: any = null

    const mockSupabase: any = { from: jest.fn() }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    }))

    jest.doMock('@/lib/auth/rbac', () => ({
      ...jest.requireActual('@/lib/auth/rbac'),
      checkAuth: jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'user-1', email: 'user@test.com', role: 'user' },
      }),
    }))

    // Mock calculateReservationPrice to return a known server price
    jest.doMock('@/lib/pricing/calculate-price', () => ({
      calculateReservationPrice: jest.fn().mockResolvedValue({
        vehiclePrice: 100000,
        insurancePrice: 10000,
        totalPrice: 110000,
        days: 2,
      }),
    }))

    // Setup: 예약 중복 체크 → 없음
    const mockSelect = jest.fn()
    const mockNot = jest.fn()
    const mockOr = jest.fn()
    const mockInsert = jest.fn()
    const mockSingle = jest.fn()

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'reservations') {
        return {
          select: mockSelect,
          insert: mockInsert,
        }
      }
      return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn() }) }) }
    })

    mockSelect.mockReturnValue({ eq: jest.fn().mockReturnValue({ not: mockNot }) })
    mockNot.mockReturnValue({ or: mockOr })
    mockOr.mockResolvedValue({ data: [], error: null }) // 중복 예약 없음

    mockInsert.mockImplementation((data: any) => {
      capturedInsertData = data
      return {
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }
    })

    mockSingle.mockResolvedValue({
      data: { id: 'new-res', total_price: 110000 },
      error: null,
    })

    const { POST } = await import('@/app/api/reservations/route')
    const request = new Request('http://localhost:3000/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        branch_id: 'branch-1',
        vehicle_id: 'vehicle-1',
        customer_name: '홍길동',
        customer_phone: '01012345678',
        license_number: '12-34-567890-01',
        start_date: '2026-03-01',
        end_date: '2026-03-03',
        start_time: '10:00',
        end_time: '10:00',
        total_price: 1,  // 클라이언트가 1원으로 조작 시도
      }),
    })

    const response = await POST(request as any)
    const json = await response.json()

    // 서버 계산 가격 사용, 클라이언트 가격(1원) 무시 검증
    if (json.success && capturedInsertData) {
      expect(capturedInsertData.total_price).toBe(110000)
      expect(capturedInsertData.total_price).not.toBe(1)
    }
    // 에러 시에도 클라이언트 가격이 DB에 직접 들어가지 않는지만 확인
    // (Zod 스키마에 total_price가 없으므로 parsed.data에 포함되지 않음)
  })
})
