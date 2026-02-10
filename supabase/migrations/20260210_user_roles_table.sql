-- user_roles 테이블: 사용자 역할을 DB에서 관리 (user_metadata 대신)
-- user_metadata.role은 클라이언트에서 수정 가능하므로 보안 취약점이 존재

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'branch_admin', 'staff', 'user')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- RLS 활성화
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 역할만 읽기 가능
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 정책: service_role은 모든 접근 가능 (관리자 API에서 사용)
CREATE POLICY "Service role full access" ON user_roles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 기존 user_metadata에서 역할 마이그레이션
INSERT INTO user_roles (user_id, role, branch_id)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'role', 'user'),
  CASE
    WHEN raw_user_meta_data->>'branch_id' IS NOT NULL
    THEN (raw_user_meta_data->>'branch_id')::UUID
    ELSE NULL
  END
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();
