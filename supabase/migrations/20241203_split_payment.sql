-- 스플릿 결제 시스템을 위한 DB 스키마 마이그레이션
-- 지점 90%, 본사 10% 자동 정산

-- 0. 기존 뷰 삭제 (컬럼 타입 변경을 위해)
DROP VIEW IF EXISTS branch_revenue_stats CASCADE;
DROP VIEW IF EXISTS settlement_summary CASCADE;

-- 1. branches 테이블에 서브몰 ID 컬럼 추가
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS submall_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS hq_submall_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_holder_name VARCHAR(100);

COMMENT ON COLUMN branches.submall_id IS '토스페이먼츠 지점 서브몰 ID';
COMMENT ON COLUMN branches.hq_submall_id IS '토스페이먼츠 본사 서브몰 ID (기본값 사용 가능)';
COMMENT ON COLUMN branches.bank_account_number IS '지점 정산 계좌번호';
COMMENT ON COLUMN branches.bank_name IS '지점 정산 은행명';
COMMENT ON COLUMN branches.bank_holder_name IS '지점 정산 계좌 예금주';

-- 2. payments 테이블 스플릿 정산 컬럼 추가
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS branch_submall_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS hq_submall_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS branch_settlement_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hq_settlement_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS branch_settlement_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS hq_settlement_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS branch_settled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hq_settled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS branch_settled_amount INTEGER,
ADD COLUMN IF NOT EXISTS hq_settled_amount INTEGER,
ADD COLUMN IF NOT EXISTS settlement_error_message TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS virtual_account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS virtual_account_bank VARCHAR(50),
ADD COLUMN IF NOT EXISTS virtual_account_holder VARCHAR(100),
ADD COLUMN IF NOT EXISTS virtual_account_due_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN payments.branch_submall_id IS '지점 서브몰 ID';
COMMENT ON COLUMN payments.hq_submall_id IS '본사 서브몰 ID';
COMMENT ON COLUMN payments.branch_settlement_amount IS '지점 정산 예정 금액 (90%)';
COMMENT ON COLUMN payments.hq_settlement_amount IS '본사 정산 예정 금액 (10%)';
COMMENT ON COLUMN payments.branch_settlement_status IS '지점 정산 상태: pending, processing, completed, failed';
COMMENT ON COLUMN payments.hq_settlement_status IS '본사 정산 상태: pending, processing, completed, failed';
COMMENT ON COLUMN payments.branch_settled_at IS '지점 정산 완료 시간';
COMMENT ON COLUMN payments.hq_settled_at IS '본사 정산 완료 시간';
COMMENT ON COLUMN payments.virtual_account_number IS '가상계좌 번호';
COMMENT ON COLUMN payments.virtual_account_bank IS '가상계좌 은행';
COMMENT ON COLUMN payments.virtual_account_holder IS '가상계좌 예금주';
COMMENT ON COLUMN payments.virtual_account_due_date IS '가상계좌 입금 기한';

-- 3. payment_method 타입 업데이트 (가상계좌 추가)
-- 기존 payment_method 컬럼이 enum이 아닌 varchar인 경우
ALTER TABLE payments
ALTER COLUMN payment_method TYPE VARCHAR(50);

-- 4. status 컬럼 업데이트 (awaiting_deposit 추가)
ALTER TABLE payments
ALTER COLUMN status TYPE VARCHAR(50);

-- 5. reservations 테이블 payment_status 업데이트
ALTER TABLE reservations
ALTER COLUMN payment_status TYPE VARCHAR(50);

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_payments_branch_submall_id ON payments(branch_submall_id);
CREATE INDEX IF NOT EXISTS idx_payments_hq_submall_id ON payments(hq_submall_id);
CREATE INDEX IF NOT EXISTS idx_payments_settlement_status ON payments(settlement_status);
CREATE INDEX IF NOT EXISTS idx_payments_branch_settlement_status ON payments(branch_settlement_status);
CREATE INDEX IF NOT EXISTS idx_payments_hq_settlement_status ON payments(hq_settlement_status);
CREATE INDEX IF NOT EXISTS idx_payments_virtual_account_due_date ON payments(virtual_account_due_date);

-- 7. 정산 요약 뷰 생성
CREATE OR REPLACE VIEW settlement_summary AS
SELECT
  p.branch_id,
  b.name AS branch_name,
  DATE_TRUNC('day', p.paid_at) AS settlement_date,
  COUNT(*) AS payment_count,
  SUM(p.amount) AS total_amount,
  SUM(p.branch_settlement_amount) AS total_branch_amount,
  SUM(p.hq_settlement_amount) AS total_hq_amount,
  COUNT(CASE WHEN p.settlement_status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN p.settlement_status = 'pending' THEN 1 END) AS pending_count,
  COUNT(CASE WHEN p.settlement_status = 'failed' THEN 1 END) AS failed_count
FROM payments p
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.status = 'completed'
GROUP BY p.branch_id, b.name, DATE_TRUNC('day', p.paid_at)
ORDER BY settlement_date DESC;

COMMENT ON VIEW settlement_summary IS '일별 정산 요약 (지점별)';

-- 8. branch_revenue_stats 뷰 재생성
CREATE OR REPLACE VIEW branch_revenue_stats AS
SELECT
  p.branch_id,
  b.name AS branch_name,
  DATE_TRUNC('month', p.paid_at) AS month,
  COUNT(*) AS payment_count,
  SUM(p.amount) AS total_revenue,
  SUM(p.branch_settlement_amount) AS branch_revenue,
  SUM(p.hq_settlement_amount) AS hq_revenue,
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) AS completed_payments,
  COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) AS refunded_payments
FROM payments p
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.status IN ('completed', 'refunded')
GROUP BY p.branch_id, b.name, DATE_TRUNC('month', p.paid_at)
ORDER BY month DESC;

COMMENT ON VIEW branch_revenue_stats IS '지점별 월간 매출 통계';
