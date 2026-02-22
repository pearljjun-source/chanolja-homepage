/**
 * 리소스 소유권 검증 유틸리티
 *
 * 역할별 접근 규칙:
 *   super_admin, admin → 전체 접근
 *   branch_admin, staff → 자기 지점(branch_id 일치)만
 *   user → 자기 예약(user_id 또는 email 일치)만
 */

import type { AuthUser } from './rbac'

interface ReservationOwnership {
  user_id?: string | null
  customer_email?: string | null
  branch_id: string
}

/**
 * 사용자가 해당 예약에 접근 가능한지 확인
 */
export function canAccessReservation(user: AuthUser, reservation: ReservationOwnership): boolean {
  // admin, super_admin → 전체 접근
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true
  }

  // branch_admin, staff → 자기 지점만
  if (user.role === 'branch_admin' || user.role === 'staff') {
    return !!user.branchId && user.branchId === reservation.branch_id
  }

  // 일반 user → user_id 매칭 우선, 없으면 email 매칭
  if (reservation.user_id) {
    return reservation.user_id === user.id
  }
  return !!reservation.customer_email && reservation.customer_email === user.email
}
