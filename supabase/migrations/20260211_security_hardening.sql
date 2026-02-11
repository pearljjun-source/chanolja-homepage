-- =====================================================
-- Supabase 보안 강화 마이그레이션
-- 날짜: 2026-02-11
-- Supabase Linter 에러/경고 전체 수정
-- =====================================================


-- =====================================================
-- 1. [ERROR] reviews 테이블: RLS 활성화 + 정책 재설정
-- Issues: policy_exists_rls_disabled, rls_disabled_in_public
-- 원인: 20241205_reviews_rls.sql에서 개발용으로 RLS를 껐음
-- =====================================================

-- 프로덕션에 존재할 수 있는 모든 기존 정책 삭제
DROP POLICY IF EXISTS "reviews_insert_all" ON reviews;
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_select_approved" ON reviews;
DROP POLICY IF EXISTS "reviews_select_branch" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated can update reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated can delete reviews" ON reviews;

-- RLS 활성화
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 승인된 리뷰 조회 가능
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT
  USING (is_approved = true AND is_visible = true);

-- 관리자는 자기 지점 리뷰 전체 조회 가능
CREATE POLICY "reviews_select_admin" ON reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = reviews.branch_id)
      )
    )
  );

-- 누구나 리뷰 작성 가능 (단, 반드시 미승인 상태로 생성)
CREATE POLICY "reviews_insert_public" ON reviews
  FOR INSERT
  WITH CHECK (is_approved = false);

-- 관리자만 리뷰 수정 가능 (승인/비공개 처리)
CREATE POLICY "reviews_update_admin" ON reviews
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = reviews.branch_id)
      )
    )
  );

-- 관리자만 리뷰 삭제 가능
CREATE POLICY "reviews_delete_admin" ON reviews
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = reviews.branch_id)
      )
    )
  );


-- =====================================================
-- 2. [ERROR] SECURITY DEFINER 뷰 → SECURITY INVOKER 변경
-- Issue: security_definer_view
-- 원인: 뷰 생성 시 기본값이 SECURITY DEFINER
-- SECURITY INVOKER로 변경하면 조회하는 사용자의 RLS가 적용됨
-- =====================================================

ALTER VIEW branch_revenue_stats SET (security_invoker = true);
ALTER VIEW expiring_insurances SET (security_invoker = true);
ALTER VIEW settlement_summary SET (security_invoker = true);


-- =====================================================
-- 3. [WARN] 함수 search_path 고정
-- Issue: function_search_path_mutable
-- 원인: search_path 미설정 시 악의적 사용자가 같은 이름의 악성 함수를
--       다른 스키마에 생성해서 실행시킬 수 있음
-- =====================================================

ALTER FUNCTION generate_reservation_number() SET search_path = '';
ALTER FUNCTION update_updated_at_column() SET search_path = '';
ALTER FUNCTION update_user_roles_updated_at() SET search_path = '';
ALTER FUNCTION complete_payment_transaction(TEXT, TEXT, TEXT, TEXT, INTEGER) SET search_path = '';
ALTER FUNCTION process_refund_transaction(UUID, INTEGER, TEXT) SET search_path = '';
ALTER FUNCTION confirm_virtual_account_deposit(TEXT, TEXT) SET search_path = '';


-- =====================================================
-- 4. [WARN] 과도하게 허용적인 RLS 정책 수정
-- Issue: rls_policy_always_true
-- 원인: INSERT/UPDATE/DELETE에 USING(true) / WITH CHECK(true) 사용
-- 수정: user_roles 테이블 기반 역할 검증으로 변경
-- =====================================================

-- --- branches 테이블: UPDATE 제한 ---
-- 기존: 누구나 UPDATE 가능 → 수정: 관리자/지점관리자만
DROP POLICY IF EXISTS "Allow Update" ON branches;

CREATE POLICY "branches_update_admin" ON branches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = branches.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = branches.id)
      )
    )
  );


-- --- inquiries 테이블: INSERT 제한 ---
-- 기존: 누구나 무조건 INSERT → 수정: 읽지 않은 상태로만 생성 가능
DROP POLICY IF EXISTS "비인증 사용자 문의 작성" ON inquiries;

CREATE POLICY "inquiries_insert_public" ON inquiries
  FOR INSERT
  WITH CHECK (is_read IS DISTINCT FROM true);


-- --- reservations 테이블: INSERT 제한 ---
-- 기존: 누구나 무조건 INSERT → 수정: pending/unpaid 상태로만 생성 가능
DROP POLICY IF EXISTS "reservations_insert_all" ON reservations;

CREATE POLICY "reservations_insert_public" ON reservations
  FOR INSERT
  WITH CHECK (status = 'pending' AND payment_status = 'unpaid');


-- --- vehicles 테이블: INSERT/UPDATE/DELETE 제한 ---
-- 기존: 누구나 INSERT/UPDATE/DELETE → 수정: 인증된 관리자만

-- 기존 정책 삭제 (프로덕션 + schema.sql 양쪽 이름 모두)
DROP POLICY IF EXISTS "vehicles_insert_all" ON vehicles;
DROP POLICY IF EXISTS "vehicles_insert_own" ON vehicles;
DROP POLICY IF EXISTS "vehicles_update_all" ON vehicles;
DROP POLICY IF EXISTS "vehicles_update_own" ON vehicles;
DROP POLICY IF EXISTS "vehicles_delete_all" ON vehicles;

CREATE POLICY "vehicles_insert_admin" ON vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = vehicles.branch_id)
      )
    )
  );

CREATE POLICY "vehicles_update_admin" ON vehicles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = vehicles.branch_id)
      )
    )
  );

CREATE POLICY "vehicles_delete_admin" ON vehicles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );


-- --- vehicle_insurances 테이블: INSERT/UPDATE 제한 ---
-- 기존: 누구나 INSERT/UPDATE → 수정: 인증된 관리자만

-- 기존 정책 삭제
DROP POLICY IF EXISTS "insurances_insert_all" ON vehicle_insurances;
DROP POLICY IF EXISTS "insurances_insert_own" ON vehicle_insurances;
DROP POLICY IF EXISTS "insurances_update_all" ON vehicle_insurances;
DROP POLICY IF EXISTS "insurances_update_own" ON vehicle_insurances;

CREATE POLICY "insurances_insert_admin" ON vehicle_insurances
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = vehicle_insurances.branch_id)
      )
    )
  );

CREATE POLICY "insurances_update_admin" ON vehicle_insurances
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (
        user_roles.role IN ('super_admin', 'admin')
        OR (user_roles.role = 'branch_admin' AND user_roles.branch_id = vehicle_insurances.branch_id)
      )
    )
  );


-- =====================================================
-- 참고: auth_leaked_password_protection (유출 비밀번호 보호)
-- 이 설정은 SQL로 변경할 수 없습니다.
-- Supabase Dashboard → Authentication → Settings에서
-- "Leaked Password Protection" 을 활성화해야 합니다.
-- https://supabase.com/docs/guides/auth/password-security
-- =====================================================
