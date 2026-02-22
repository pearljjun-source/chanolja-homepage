-- =====================================================
-- handle_new_user() 트리거 권한 상승 취약점 수정
-- 날짜: 2026-02-22
-- 문제: 트리거가 raw_user_meta_data에서 role/branch_id를 읽어 user_roles에 삽입.
--       Supabase Auth API는 공개 접근이 가능하므로, 공격자가 signUp() 시
--       user_metadata: { role: 'super_admin' }을 전달해 관리자 권한 자가 부여 가능.
-- 해결: 트리거에서 항상 'user' 역할만 부여. 관리자 계정은 create-user API에서
--       upsert로 역할을 덮어쓰므로 기존 관리자 생성 흐름에 영향 없음.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, branch_id)
  VALUES (
    NEW.id,
    'user',
    NULL
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';
