-- Reviews 테이블 RLS 정책 설정
-- 현재 RLS가 활성화되어 있어서 업데이트가 안 됨

-- 1. RLS 비활성화 (임시) 또는 정책 추가
-- 옵션 A: RLS 완전 비활성화 (개발/테스트용)
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- 옵션 B: 적절한 RLS 정책 추가 (프로덕션용)
-- RLS 활성화 상태 유지하면서 정책 추가
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (승인된 후기만)
-- DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
-- CREATE POLICY "Public can view approved reviews" ON reviews
--   FOR SELECT USING (is_approved = true AND is_visible = true);

-- 인증된 사용자가 모든 후기 읽기 가능
-- DROP POLICY IF EXISTS "Authenticated can view all reviews" ON reviews;
-- CREATE POLICY "Authenticated can view all reviews" ON reviews
--   FOR SELECT TO authenticated USING (true);

-- 인증된 사용자가 후기 수정 가능
-- DROP POLICY IF EXISTS "Authenticated can update reviews" ON reviews;
-- CREATE POLICY "Authenticated can update reviews" ON reviews
--   FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 모든 사용자가 후기 작성 가능
-- DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
-- CREATE POLICY "Anyone can insert reviews" ON reviews
--   FOR INSERT WITH CHECK (true);

-- 인증된 사용자가 후기 삭제 가능
-- DROP POLICY IF EXISTS "Authenticated can delete reviews" ON reviews;
-- CREATE POLICY "Authenticated can delete reviews" ON reviews
--   FOR DELETE TO authenticated USING (true);
