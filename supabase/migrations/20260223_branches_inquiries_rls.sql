-- =====================================================
-- branches, inquiries 테이블 RLS 활성화 + 정책 추가
-- 날짜: 2026-02-23
-- 목적: 누락된 RLS 활성화 및 역할별 접근 제어
-- =====================================================

-- ===================
-- 1. branches 테이블
-- ===================

-- RLS 활성화 (이미 활성화된 경우 무시됨)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리 (중복 방지)
DROP POLICY IF EXISTS "branches_select_public" ON branches;
DROP POLICY IF EXISTS "branches_select_authenticated" ON branches;
DROP POLICY IF EXISTS "branches_insert_admin" ON branches;
DROP POLICY IF EXISTS "branches_delete_admin" ON branches;

-- 누구나 활성 지점 조회 가능 (공개 정보)
-- 컬럼 레벨 보안은 20260220_branches_column_security.sql에서 GRANT로 처리
CREATE POLICY "branches_select_public" ON branches
  FOR SELECT
  USING (is_active = true);

-- 인증된 관리자는 비활성 지점도 조회 가능
CREATE POLICY "branches_select_authenticated" ON branches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'branch_admin', 'staff')
    )
  );

-- 지점 추가는 super_admin/admin만
CREATE POLICY "branches_insert_admin" ON branches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- 지점 삭제는 super_admin만
CREATE POLICY "branches_delete_admin" ON branches
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- branches_update_admin은 20260211_security_hardening.sql에서 이미 생성됨


-- ===================
-- 2. inquiries 테이블
-- ===================

-- RLS 활성화
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리 (중복 방지)
DROP POLICY IF EXISTS "inquiries_select_admin" ON inquiries;
DROP POLICY IF EXISTS "inquiries_update_admin" ON inquiries;
DROP POLICY IF EXISTS "inquiries_delete_admin" ON inquiries;

-- inquiries_insert_public은 20260211_security_hardening.sql에서 이미 생성됨

-- 문의 조회는 관리자만 (고객 연락처 등 개인정보 포함)
CREATE POLICY "inquiries_select_admin" ON inquiries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- 문의 수정은 관리자만 (읽음 처리 등)
CREATE POLICY "inquiries_update_admin" ON inquiries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- 문의 삭제는 super_admin만
CREATE POLICY "inquiries_delete_admin" ON inquiries
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );
