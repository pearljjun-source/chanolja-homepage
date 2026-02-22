-- =====================================================
-- reservations 테이블에 user_id 컬럼 추가
-- 날짜: 2026-02-22
-- 목적: 예약의 소유권을 인증된 사용자와 연결하여 IDOR 방지
-- 비회원 예약은 user_id = NULL (기존 동작 유지)
-- =====================================================

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 인덱스 추가 (사용자별 예약 조회 성능)
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id) WHERE user_id IS NOT NULL;
