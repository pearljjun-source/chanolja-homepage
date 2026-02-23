-- =====================================================
-- 동일 예약에 대한 중복 활성 결제 방지
-- 날짜: 2026-02-23
-- 목적: Race condition(TOCTOU)으로 인한 동일 예약에 대한 중복 결제 생성 방지
-- 방법: partial unique index로 예약당 하나의 활성 결제만 허용
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_active_per_reservation
ON payments(reservation_id)
WHERE status IN ('pending', 'awaiting_deposit');
