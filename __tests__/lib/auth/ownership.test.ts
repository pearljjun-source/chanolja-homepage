/**
 * @jest-environment node
 */

import { canAccessReservation } from '@/lib/auth/ownership'
import type { AuthUser } from '@/lib/auth/rbac'

describe('canAccessReservation', () => {
  // 테스트용 예약 데이터
  const reservation = {
    user_id: 'user-123',
    customer_email: 'customer@example.com',
    branch_id: 'branch-A',
  }

  describe('admin/super_admin → 전체 접근', () => {
    it('super_admin은 모든 예약에 접근 가능', () => {
      const user: AuthUser = { id: 'other', email: 'sa@test.com', role: 'super_admin' }
      expect(canAccessReservation(user, reservation)).toBe(true)
    })

    it('admin은 모든 예약에 접근 가능', () => {
      const user: AuthUser = { id: 'other', email: 'admin@test.com', role: 'admin' }
      expect(canAccessReservation(user, reservation)).toBe(true)
    })
  })

  describe('branch_admin/staff → 자기 지점만', () => {
    it('branch_admin이 자기 지점 예약 접근 → true', () => {
      const user: AuthUser = { id: 'ba-1', email: 'ba@test.com', role: 'branch_admin', branchId: 'branch-A' }
      expect(canAccessReservation(user, reservation)).toBe(true)
    })

    it('branch_admin이 다른 지점 예약 접근 → false', () => {
      const user: AuthUser = { id: 'ba-1', email: 'ba@test.com', role: 'branch_admin', branchId: 'branch-B' }
      expect(canAccessReservation(user, reservation)).toBe(false)
    })

    it('staff가 자기 지점 예약 접근 → true', () => {
      const user: AuthUser = { id: 'staff-1', email: 'staff@test.com', role: 'staff', branchId: 'branch-A' }
      expect(canAccessReservation(user, reservation)).toBe(true)
    })

    it('staff가 다른 지점 예약 접근 → false', () => {
      const user: AuthUser = { id: 'staff-1', email: 'staff@test.com', role: 'staff', branchId: 'branch-B' }
      expect(canAccessReservation(user, reservation)).toBe(false)
    })

    it('branchId가 없는 branch_admin → false', () => {
      const user: AuthUser = { id: 'ba-1', email: 'ba@test.com', role: 'branch_admin' }
      expect(canAccessReservation(user, reservation)).toBe(false)
    })
  })

  describe('user → user_id 매칭 우선, 없으면 email 매칭', () => {
    it('user_id가 일치 → true', () => {
      const user: AuthUser = { id: 'user-123', email: 'different@test.com', role: 'user' }
      expect(canAccessReservation(user, reservation)).toBe(true)
    })

    it('user_id가 불일치 → false (email이 같아도)', () => {
      const user: AuthUser = { id: 'user-999', email: 'customer@example.com', role: 'user' }
      expect(canAccessReservation(user, reservation)).toBe(false)
    })

    it('user_id가 null이고 email 일치 → true', () => {
      const noUserIdReservation = { ...reservation, user_id: null }
      const user: AuthUser = { id: 'user-999', email: 'customer@example.com', role: 'user' }
      expect(canAccessReservation(user, noUserIdReservation)).toBe(true)
    })

    it('user_id가 null이고 email 불일치 → false', () => {
      const noUserIdReservation = { ...reservation, user_id: null }
      const user: AuthUser = { id: 'user-999', email: 'wrong@test.com', role: 'user' }
      expect(canAccessReservation(user, noUserIdReservation)).toBe(false)
    })

    it('user_id와 email 모두 null → false', () => {
      const emptyReservation = { user_id: null, customer_email: null, branch_id: 'branch-A' }
      const user: AuthUser = { id: 'user-999', email: 'test@test.com', role: 'user' }
      expect(canAccessReservation(user, emptyReservation)).toBe(false)
    })
  })
})
