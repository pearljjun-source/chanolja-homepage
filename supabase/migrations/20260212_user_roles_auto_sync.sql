-- =====================================================
-- user_roles 자동 동기화 트리거
-- 날짜: 2026-02-11
-- 문제: auth.users에 새 사용자가 생성되면 user_roles에 행이 없어서
--       RLS 정책에서 권한 확인이 안 됨
-- 해결: DB 트리거로 자동 INSERT
-- =====================================================

-- auth.users INSERT 시 user_roles에 자동으로 행 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, branch_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    CASE
      WHEN NEW.raw_user_meta_data->>'branch_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'branch_id')::UUID
      ELSE NULL
    END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
