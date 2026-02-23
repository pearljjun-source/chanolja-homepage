-- =====================================================
-- DB 레벨 보안 수동 검증 SQL 스크립트
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 날짜: 2026-02-23
-- 목적: 마이그레이션으로 적용된 DB 보안 항목 검증
-- =====================================================

-- =============================================
-- 1. S-P0-001: 트리거 권한 상승 방지
-- handle_new_user() 트리거가 항상 'user' 역할만 부여하는지 확인
-- =============================================
SELECT '=== S-P0-001: 트리거 함수 검증 ===' AS test;

SELECT
  p.proname AS function_name,
  CASE
    WHEN p.prosrc LIKE '%''user''%' AND p.prosrc NOT LIKE '%raw_user_meta_data%role%'
    THEN 'PASS: 항상 user 역할 부여'
    WHEN p.prosrc LIKE '%raw_user_meta_data%role%'
    THEN 'FAIL: user_metadata에서 role 읽음 (권한 상승 취약)'
    ELSE 'CHECK: 수동 확인 필요'
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';


-- =============================================
-- 2. S-P0-004: 함수 search_path 고정
-- 모든 함수에 search_path = '' 설정 확인
-- =============================================
SELECT '=== S-P0-004: search_path 고정 검증 ===' AS test;

SELECT
  p.proname AS function_name,
  CASE
    WHEN array_to_string(p.proconfig, ',') LIKE '%search_path=%'
    THEN 'PASS: search_path 고정됨'
    ELSE 'FAIL: search_path 미설정'
  END AS status,
  COALESCE(array_to_string(p.proconfig, ', '), 'N/A') AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'generate_reservation_number',
    'update_updated_at_column',
    'update_user_roles_updated_at',
    'complete_payment_transaction',
    'process_refund_transaction',
    'confirm_virtual_account_deposit',
    'handle_new_user',
    'transition_reservation_status'
  )
ORDER BY p.proname;


-- =============================================
-- 3. S-P1-001: 컬럼 레벨 보안 (branches 테이블)
-- anon 역할이 민감 컬럼에 접근 불가한지 확인
-- =============================================
SELECT '=== S-P1-001: branches 컬럼 접근 권한 ===' AS test;

SELECT
  column_name,
  CASE
    WHEN has_column_privilege('anon', 'branches', column_name, 'SELECT')
    THEN CASE
      WHEN column_name IN ('api_key', 'admin_email', 'submall_id', 'hq_submall_id',
                           'bank_account_number', 'bank_name', 'bank_holder_name')
      THEN 'FAIL: 민감 컬럼 접근 가능'
      ELSE 'PASS: 공개 컬럼'
    END
    ELSE CASE
      WHEN column_name IN ('api_key', 'admin_email', 'submall_id', 'hq_submall_id',
                           'bank_account_number', 'bank_name', 'bank_holder_name')
      THEN 'PASS: 민감 컬럼 차단됨'
      ELSE 'INFO: 비공개 컬럼'
    END
  END AS status
FROM information_schema.columns
WHERE table_name = 'branches' AND table_schema = 'public'
ORDER BY
  CASE WHEN column_name IN ('api_key', 'admin_email', 'submall_id', 'hq_submall_id',
                             'bank_account_number', 'bank_name', 'bank_holder_name')
  THEN 0 ELSE 1 END,
  column_name;


-- =============================================
-- 4. S-P2-001 & S-P2-008: RLS 활성화 상태
-- 모든 주요 테이블에 RLS가 활성화되어 있는지 확인
-- =============================================
SELECT '=== S-P2-001: RLS 활성화 상태 ===' AS test;

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN 'PASS: RLS 활성화'
    ELSE 'FAIL: RLS 비활성화'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'vehicles',
    'reservations',
    'payments',
    'branches',
    'inquiries',
    'reviews',
    'vehicle_insurances',
    'user_roles'
  )
ORDER BY tablename;


-- =============================================
-- 5. S-P2-001: RLS 정책 목록
-- 각 테이블의 정책이 올바르게 설정되어 있는지 확인
-- =============================================
SELECT '=== S-P2-001: RLS 정책 목록 ===' AS test;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN qual = 'true' AND cmd IN ('SELECT', 'UPDATE', 'DELETE')
    THEN 'WARN: USING(true) - 과다 허용 가능'
    ELSE 'OK'
  END AS check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'vehicles',
    'reservations',
    'payments',
    'branches',
    'inquiries',
    'reviews',
    'vehicle_insurances'
  )
ORDER BY tablename, policyname;


-- =============================================
-- 6. S-P2-002: SECURITY INVOKER 뷰 확인
-- 뷰가 SECURITY INVOKER로 설정되어 있는지 확인
-- =============================================
SELECT '=== S-P2-002: 뷰 보안 설정 ===' AS test;

SELECT
  viewname,
  CASE
    WHEN (
      SELECT reloptions
      FROM pg_class
      WHERE relname = viewname AND relkind = 'v'
    )::text LIKE '%security_invoker=true%'
    THEN 'PASS: SECURITY INVOKER'
    ELSE 'FAIL: SECURITY DEFINER (기본값)'
  END AS status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('branch_revenue_stats', 'expiring_insurances', 'settlement_summary');


-- =============================================
-- 7. S-P2-006: FK ON DELETE RESTRICT 확인
-- 주요 FK가 CASCADE가 아닌 RESTRICT인지 확인
-- =============================================
SELECT '=== S-P2-006: FK 삭제 동작 ===' AS test;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule,
  CASE
    WHEN rc.delete_rule = 'RESTRICT' OR rc.delete_rule = 'NO ACTION'
    THEN 'PASS: 안전 (삭제 차단)'
    WHEN rc.delete_rule = 'CASCADE'
    THEN 'FAIL: CASCADE (연쇄 삭제 위험)'
    ELSE 'INFO: ' || rc.delete_rule
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('vehicles', 'reservations', 'payments', 'vehicle_insurances', 'reviews')
ORDER BY tc.table_name, kcu.column_name;


-- =============================================
-- 8. S-P1-006: 중복 결제 방지 인덱스
-- partial unique index 존재 확인
-- =============================================
SELECT '=== S-P1-006: 중복 결제 방지 인덱스 ===' AS test;

SELECT
  indexname,
  indexdef,
  CASE
    WHEN indexdef LIKE '%unique_active_per_reservation%'
      OR indexdef LIKE '%WHERE%pending%awaiting_deposit%'
    THEN 'PASS: 부분 유니크 인덱스 존재'
    ELSE 'INFO: 기타 인덱스'
  END AS status
FROM pg_indexes
WHERE tablename = 'payments'
  AND indexdef LIKE '%unique%' OR indexname LIKE '%unique_active%'
ORDER BY indexname;


-- =============================================
-- 9. S-P2-003: transition_reservation_status RPC 함수
-- 함수 존재 및 설정 확인
-- =============================================
SELECT '=== S-P2-003: 상태 전환 RPC 함수 ===' AS test;

SELECT
  p.proname AS function_name,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_mode,
  CASE
    WHEN array_to_string(p.proconfig, ',') LIKE '%search_path=%'
    THEN 'PASS: search_path 고정'
    ELSE 'FAIL: search_path 미설정'
  END AS search_path_status,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'transition_reservation_status';


-- =============================================
-- 10. reservations 테이블 user_id 컬럼 존재 확인
-- =============================================
SELECT '=== S-P3-001: reservations.user_id 컬럼 ===' AS test;

SELECT
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name = 'user_id' THEN 'PASS: user_id 컬럼 존재'
    ELSE 'INFO'
  END AS status
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND table_schema = 'public'
  AND column_name = 'user_id';


-- =============================================
-- 전체 요약
-- =============================================
SELECT '=== 전체 검증 요약 ===' AS test;

SELECT
  'S-P0-001' AS item, '트리거 권한 상승 방지' AS description,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
  ) THEN 'EXISTS' ELSE 'MISSING' END AS status
UNION ALL
SELECT 'S-P0-004', 'search_path 고정',
  (SELECT COUNT(*)::text || '/' || '8 함수 설정됨'
   FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public'
     AND array_to_string(p.proconfig, ',') LIKE '%search_path=%')
UNION ALL
SELECT 'S-P2-001', 'RLS 활성화',
  (SELECT COUNT(*)::text || '개 테이블 RLS 활성'
   FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = true
     AND tablename IN ('vehicles','reservations','payments','branches','inquiries','reviews','vehicle_insurances','user_roles'))
UNION ALL
SELECT 'S-P2-003', '상태 전환 RPC',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'transition_reservation_status'
  ) THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT 'S-P1-006', '중복 결제 방지 인덱스',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'payments' AND indexname LIKE '%unique_active%'
  ) THEN 'EXISTS' ELSE 'MISSING' END;
