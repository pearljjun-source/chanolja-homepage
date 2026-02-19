-- =====================================================
-- branches 테이블 컬럼 레벨 보안
-- 날짜: 2026-02-20
-- 목적: anon 사용자의 민감 컬럼(api_key, 정산정보, 은행정보) 접근 차단
-- 차단 컬럼: api_key, admin_email, submall_id, hq_submall_id,
--           bank_account_number, bank_name, bank_holder_name
-- =====================================================

-- anon 역할의 branches 전체 SELECT 권한 회수
REVOKE SELECT ON branches FROM anon;

-- anon 역할에 공개 컬럼만 SELECT 허용
GRANT SELECT (
  id, name, region, address, phone, owner_name, branch_type,
  lat, lng,
  website_url, subdomain, is_active,
  created_at, updated_at,
  business_hours, business_number, description, introduction, theme
) ON branches TO anon;

-- authenticated 역할은 전체 컬럼 접근 유지 (관리자 기능에 필요)
GRANT SELECT ON branches TO authenticated;
