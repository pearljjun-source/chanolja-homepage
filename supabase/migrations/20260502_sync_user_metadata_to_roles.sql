-- =====================================================
-- user_metadata 변경 시 user_roles 자동 동기화 트리거
-- 날짜: 2026-05-02
-- 문제: Supabase 대시보드에서 user_metadata.role을 변경해도
--       user_roles 테이블이 업데이트되지 않아 역할이 불일치
-- 해결: auth.users UPDATE 시 user_metadata.role이 변경되면
--       user_roles 테이블도 자동으로 동기화
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS TRIGGER AS $$
DECLARE
  new_role TEXT;
  new_branch_id UUID;
  valid_roles TEXT[] := ARRAY['super_admin', 'admin', 'branch_admin', 'staff', 'user'];
BEGIN
  -- user_metadata에서 role 추출
  new_role := NEW.raw_user_meta_data->>'role';

  -- role이 없거나 유효하지 않으면 무시
  IF new_role IS NULL OR new_role = '' OR NOT (new_role = ANY(valid_roles)) THEN
    RETURN NEW;
  END IF;

  -- 이전 값과 같으면 무시
  IF OLD.raw_user_meta_data->>'role' = new_role THEN
    RETURN NEW;
  END IF;

  -- branch_id 추출
  new_branch_id := NULL;
  IF NEW.raw_user_meta_data->>'branch_id' IS NOT NULL
     AND NEW.raw_user_meta_data->>'branch_id' != '' THEN
    new_branch_id := (NEW.raw_user_meta_data->>'branch_id')::UUID;
  END IF;

  -- user_roles 테이블 동기화
  UPDATE public.user_roles
  SET role = new_role,
      branch_id = new_branch_id,
      updated_at = now()
  WHERE user_id = NEW.id;

  -- user_roles에 행이 없으면 생성
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role, branch_id)
    VALUES (NEW.id, new_role, new_branch_id)
    ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;

CREATE TRIGGER on_auth_user_metadata_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_metadata_update();
