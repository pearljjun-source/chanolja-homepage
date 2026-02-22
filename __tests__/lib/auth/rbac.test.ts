/**
 * @jest-environment node
 */

describe('RBAC', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    }

    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => Promise.resolve(mockSupabase)),
    }))
  })

  describe('hasMinimumRole', () => {
    it('super_admin >= admin → true', async () => {
      const { hasMinimumRole } = await import('@/lib/auth/rbac')
      expect(hasMinimumRole('super_admin', 'admin')).toBe(true)
    })

    it('admin >= branch_admin → true', async () => {
      const { hasMinimumRole } = await import('@/lib/auth/rbac')
      expect(hasMinimumRole('admin', 'branch_admin')).toBe(true)
    })

    it('user >= admin → false', async () => {
      const { hasMinimumRole } = await import('@/lib/auth/rbac')
      expect(hasMinimumRole('user', 'admin')).toBe(false)
    })

    it('branch_admin >= branch_admin → true (같은 역할)', async () => {
      const { hasMinimumRole } = await import('@/lib/auth/rbac')
      expect(hasMinimumRole('branch_admin', 'branch_admin')).toBe(true)
    })

    it('staff >= branch_admin → false', async () => {
      const { hasMinimumRole } = await import('@/lib/auth/rbac')
      expect(hasMinimumRole('staff', 'branch_admin')).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('super_admin은 manage_users 권한 있음', async () => {
      const { hasPermission } = await import('@/lib/auth/rbac')
      expect(hasPermission('super_admin', 'manage_users')).toBe(true)
    })

    it('admin은 manage_users 권한 없음', async () => {
      const { hasPermission } = await import('@/lib/auth/rbac')
      expect(hasPermission('admin', 'manage_users')).toBe(false)
    })

    it('branch_admin은 manage_reservations 권한 있음', async () => {
      const { hasPermission } = await import('@/lib/auth/rbac')
      expect(hasPermission('branch_admin', 'manage_reservations')).toBe(true)
    })

    it('user는 어떤 권한도 없음', async () => {
      const { hasPermission } = await import('@/lib/auth/rbac')
      expect(hasPermission('user', 'manage_reservations')).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('인증된 사용자 + user_roles 있음 → AuthUser 반환', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@test.com' } },
        error: null,
      })

      const mockUserRoleQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'branch_admin', branch_id: 'branch-A' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValue(mockUserRoleQuery)

      const { getCurrentUser } = await import('@/lib/auth/rbac')
      const user = await getCurrentUser()

      expect(user).toEqual({
        id: 'user-1',
        email: 'test@test.com',
        role: 'branch_admin',
        branchId: 'branch-A',
      })
    })

    it('인증된 사용자 + user_roles 없음 → role: user 기본값', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-2', email: 'new@test.com' } },
        error: null,
      })

      const mockUserRoleQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows' },
        }),
      }
      mockSupabase.from.mockReturnValue(mockUserRoleQuery)

      const { getCurrentUser } = await import('@/lib/auth/rbac')
      const user = await getCurrentUser()

      expect(user).toEqual({
        id: 'user-2',
        email: 'new@test.com',
        role: 'user',
        branchId: undefined,
      })
    })

    it('인증 안 됨 (getUser 에러) → null', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { getCurrentUser } = await import('@/lib/auth/rbac')
      const user = await getCurrentUser()

      expect(user).toBeNull()
    })
  })

  describe('checkAuth', () => {
    it('인증 안 된 사용자 → 401', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { checkAuth } = await import('@/lib/auth/rbac')
      const result = await checkAuth()

      expect(result.success).toBe(false)
      expect(result.status).toBe(401)
      expect(result.error).toBe('인증이 필요합니다.')
    })

    it('역할 부족 (user가 admin API 접근) → 403', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u-1', email: 'user@test.com' } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user', branch_id: null },
          error: null,
        }),
      })

      const { checkAuth } = await import('@/lib/auth/rbac')
      const result = await checkAuth({ requiredRole: 'admin' })

      expect(result.success).toBe(false)
      expect(result.status).toBe(403)
      expect(result.error).toBe('권한이 부족합니다.')
    })

    it('역할 충분 (admin이 admin API 접근) → 성공', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'a-1', email: 'admin@test.com' } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin', branch_id: null },
          error: null,
        }),
      })

      const { checkAuth } = await import('@/lib/auth/rbac')
      const result = await checkAuth({ requiredRole: 'admin' })

      expect(result.success).toBe(true)
      expect(result.user?.role).toBe('admin')
    })

    it('branch_admin이 다른 지점 접근 → 403', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'ba-1', email: 'ba@test.com' } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'branch_admin', branch_id: 'branch-A' },
          error: null,
        }),
      })

      const { checkAuth } = await import('@/lib/auth/rbac')
      const result = await checkAuth({
        requiredRole: 'branch_admin',
        requiredBranchId: 'branch-B',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(403)
    })

    it('admin이 다른 지점 접근 → 성공 (view_all_branches 권한)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'a-1', email: 'admin@test.com' } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin', branch_id: null },
          error: null,
        }),
      })

      const { checkAuth } = await import('@/lib/auth/rbac')
      const result = await checkAuth({
        requiredRole: 'admin',
        requiredBranchId: 'branch-B',
      })

      expect(result.success).toBe(true)
    })

    it('권한 체크 실패 (staff → manage_payments) → 403', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 's-1', email: 'staff@test.com' } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'staff', branch_id: 'branch-A' },
          error: null,
        }),
      })

      const { checkAuth } = await import('@/lib/auth/rbac')
      const result = await checkAuth({ requiredPermission: 'manage_payments' })

      expect(result.success).toBe(false)
      expect(result.status).toBe(403)
      expect(result.error).toBe('해당 작업에 대한 권한이 없습니다.')
    })
  })
})
