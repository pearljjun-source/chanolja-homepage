/**
 * Role-Based Access Control (RBAC) 시스템
 *
 * 사용자 역할에 따른 접근 권한을 관리합니다.
 */

import { createClient } from '@/lib/supabase/server'

// 역할 정의
export type UserRole = 'super_admin' | 'admin' | 'branch_admin' | 'staff' | 'user'

// 역할 계층 (숫자가 높을수록 더 높은 권한)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  branch_admin: 60,
  staff: 40,
  user: 20,
}

// 권한 정의
export type Permission =
  | 'manage_users'          // 사용자 관리
  | 'manage_branches'       // 지점 관리
  | 'manage_payments'       // 결제 관리
  | 'manage_settings'       // 시스템 설정 관리
  | 'view_all_branches'     // 모든 지점 조회
  | 'view_own_branch'       // 자기 지점 조회
  | 'manage_reservations'   // 예약 관리
  | 'manage_vehicles'       // 차량 관리
  | 'view_reports'          // 리포트 조회

// 역할별 권한 매핑
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'manage_users',
    'manage_branches',
    'manage_payments',
    'manage_settings',
    'view_all_branches',
    'view_own_branch',
    'manage_reservations',
    'manage_vehicles',
    'view_reports',
  ],
  admin: [
    'manage_branches',
    'manage_payments',
    'view_all_branches',
    'view_own_branch',
    'manage_reservations',
    'manage_vehicles',
    'view_reports',
  ],
  branch_admin: [
    'view_own_branch',
    'manage_reservations',
    'manage_vehicles',
    'view_reports',
  ],
  staff: [
    'view_own_branch',
    'manage_reservations',
  ],
  user: [],
}

// 사용자 정보 타입
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  branchId?: string
}

/**
 * 현재 인증된 사용자 정보 가져오기
 * user_roles 테이블에서 역할을 조회 (user_metadata는 클라이언트에서 조작 가능하므로 신뢰하지 않음)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // user_roles 테이블에서 역할 조회 (신뢰할 수 있는 소스)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role, branch_id')
      .eq('user_id', user.id)
      .single()

    // user_roles 테이블에 행이 없으면 최소 권한 'user' 적용
    const role = (userRole?.role as UserRole) || 'user'
    const branchId = userRole?.branch_id as string | undefined

    return {
      id: user.id,
      email: user.email || '',
      role,
      branchId,
    }
  } catch {
    return null
  }
}

/**
 * 특정 역할 이상인지 확인
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * 특정 권한이 있는지 확인
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

/**
 * 인증 및 권한 검사 결과 타입
 */
export interface AuthCheckResult {
  success: boolean
  user?: AuthUser
  error?: string
  status?: number
}

/**
 * API 라우트에서 사용할 인증 및 권한 검사
 */
export async function checkAuth(options?: {
  requiredRole?: UserRole
  requiredPermission?: Permission
  requiredBranchId?: string
}): Promise<AuthCheckResult> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      success: false,
      error: '인증이 필요합니다.',
      status: 401,
    }
  }

  // 역할 검사
  if (options?.requiredRole) {
    if (!hasMinimumRole(user.role, options.requiredRole)) {
      return {
        success: false,
        user,
        error: '권한이 부족합니다.',
        status: 403,
      }
    }
  }

  // 권한 검사
  if (options?.requiredPermission) {
    if (!hasPermission(user.role, options.requiredPermission)) {
      return {
        success: false,
        user,
        error: '해당 작업에 대한 권한이 없습니다.',
        status: 403,
      }
    }
  }

  // 지점 검사 (super_admin, admin은 모든 지점 접근 가능)
  if (options?.requiredBranchId) {
    const canAccessAllBranches = hasPermission(user.role, 'view_all_branches')
    if (!canAccessAllBranches && user.branchId !== options.requiredBranchId) {
      return {
        success: false,
        user,
        error: '해당 지점에 대한 접근 권한이 없습니다.',
        status: 403,
      }
    }
  }

  return {
    success: true,
    user,
  }
}

/**
 * 관리자 전용 API 검사 (admin 이상)
 */
export async function requireAdmin(): Promise<AuthCheckResult> {
  return checkAuth({ requiredRole: 'admin' })
}

/**
 * 슈퍼 관리자 전용 API 검사
 */
export async function requireSuperAdmin(): Promise<AuthCheckResult> {
  return checkAuth({ requiredRole: 'super_admin' })
}

/**
 * 지점 관리자 이상 검사
 */
export async function requireBranchAdmin(branchId?: string): Promise<AuthCheckResult> {
  return checkAuth({
    requiredRole: 'branch_admin',
    requiredBranchId: branchId,
  })
}
