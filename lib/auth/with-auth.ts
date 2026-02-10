/**
 * API 라우트용 인증/인가 래퍼
 *
 * 사용 예시:
 *   export const GET = withAuth({ auth: 'admin' }, async (request, { user }) => { ... })
 *   export const POST = withAuth({ auth: 'public', rateLimit: 'reservation' }, async (request) => { ... })
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, type AuthUser, type Permission, type UserRole } from './rbac'
import { apiError, withRateLimit, API_ERRORS } from '@/lib/api-utils'

export interface AuthConfig {
  /** 인증 수준 */
  auth: 'public' | 'authenticated' | 'admin' | 'super_admin' | 'branch_admin'
  /** 세부 권한 체크 (optional) */
  permission?: Permission
  /** Rate limit 설정 키 (optional) */
  rateLimit?: string
  /** 지점 범위 검사 여부 (optional) */
  branchScoped?: boolean
}

export interface AuthContext {
  user: AuthUser | null
  params?: Record<string, string>
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>

/** auth 레벨을 역할로 매핑 */
const AUTH_TO_ROLE: Record<string, UserRole | null> = {
  public: null,
  authenticated: null, // 로그인만 필요, 역할 무관
  branch_admin: 'branch_admin',
  admin: 'admin',
  super_admin: 'super_admin',
}

export function withAuth(config: AuthConfig, handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext?: { params?: Promise<Record<string, string>> }) => {
    try {
      // 1. Rate limit 체크
      if (config.rateLimit) {
        const rateLimitCheck = await withRateLimit(request, config.rateLimit)
        if (!rateLimitCheck.success) {
          return rateLimitCheck.response
        }
      }

      // 2. Public 엔드포인트는 인증 스킵
      if (config.auth === 'public') {
        const params = routeContext?.params ? await routeContext.params : undefined
        return handler(request, { user: null, params })
      }

      // 3. 인증 체크
      const requiredRole = AUTH_TO_ROLE[config.auth] || undefined
      const authResult = await checkAuth({
        requiredRole: requiredRole ?? undefined,
        requiredPermission: config.permission,
      })

      if (!authResult.success) {
        return apiError(
          authResult.error || API_ERRORS.UNAUTHORIZED,
          authResult.status || 401
        )
      }

      // 4. 지점 범위 검사
      if (config.branchScoped && authResult.user) {
        const branchId = extractBranchId(request)
        if (branchId) {
          const branchCheck = await checkAuth({
            requiredRole: requiredRole ?? undefined,
            requiredBranchId: branchId,
          })
          if (!branchCheck.success) {
            return apiError(
              branchCheck.error || API_ERRORS.FORBIDDEN,
              branchCheck.status || 403
            )
          }
        }
      }

      const params = routeContext?.params ? await routeContext.params : undefined
      return handler(request, { user: authResult.user!, params })
    } catch (error) {
      console.error('Auth wrapper error:', error)
      return apiError(API_ERRORS.INTERNAL_ERROR, 500)
    }
  }
}

/** 요청에서 branch_id 추출 (쿼리 파라미터 또는 바디) */
function extractBranchId(request: NextRequest): string | null {
  const url = new URL(request.url)
  return url.searchParams.get('branch_id')
}
