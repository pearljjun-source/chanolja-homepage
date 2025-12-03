-- =====================================================
-- 차놀자 통합 예약관리 시스템 데이터베이스 스키마
-- =====================================================

-- 기존 branches 테이블에 API 키 추가 (지점 인증용)
ALTER TABLE branches ADD COLUMN IF NOT EXISTS api_key UUID DEFAULT gen_random_uuid();
ALTER TABLE branches ADD COLUMN IF NOT EXISTS subdomain VARCHAR(50) UNIQUE;

-- =====================================================
-- 차량 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- 차량 기본 정보
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  license_plate VARCHAR(20),
  vehicle_type VARCHAR(30) NOT NULL DEFAULT 'sedan',
  -- vehicle_type: 'sedan', 'suv', 'van', 'truck', 'camper', 'luxury'

  -- 가격 정보
  price_per_day INTEGER NOT NULL DEFAULT 0,
  price_per_hour INTEGER,
  deposit INTEGER DEFAULT 0,

  -- 차량 상세
  color VARCHAR(30),
  seats INTEGER DEFAULT 5,
  fuel_type VARCHAR(20), -- 'gasoline', 'diesel', 'electric', 'hybrid', 'lpg'
  transmission VARCHAR(20), -- 'automatic', 'manual'
  mileage INTEGER,

  -- 이미지
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- 설명
  description TEXT,
  features TEXT[], -- 옵션: ['네비게이션', '후방카메라', '열선시트', ...]

  -- 상태
  status VARCHAR(20) DEFAULT 'available',
  -- status: 'available', 'rented', 'maintenance', 'reserved'
  is_active BOOLEAN DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 차량 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_vehicles_branch_id ON vehicles(branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);

-- =====================================================
-- 차량 보험 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- 보험 기본 정보
  insurance_company VARCHAR(50) NOT NULL,
  policy_number VARCHAR(50),
  insurance_type VARCHAR(30) DEFAULT 'comprehensive',
  -- insurance_type: 'comprehensive'(종합), 'liability_only'(책임)

  -- 보장 내용 (JSON)
  coverage JSONB DEFAULT '{
    "liability_per_person": 100000000,
    "liability_per_accident": 200000000,
    "property_damage": 20000000,
    "uninsured_motorist": 20000000,
    "self_damage": true,
    "self_damage_deductible": 300000
  }',

  -- 보험 기간
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 보험료
  annual_premium INTEGER,
  monthly_premium INTEGER,

  -- 서류
  document_url TEXT,

  -- 상태
  is_active BOOLEAN DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 보험 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_vehicle_insurances_vehicle_id ON vehicle_insurances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_insurances_end_date ON vehicle_insurances(end_date);

-- =====================================================
-- 예약 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- 예약 번호 (조회용)
  reservation_number VARCHAR(20) UNIQUE,

  -- 고객 정보
  customer_name VARCHAR(50) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  customer_birth DATE,
  license_number VARCHAR(30),
  license_type VARCHAR(20), -- '1종보통', '2종보통', '대형'

  -- 예약 기간
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME DEFAULT '10:00',
  end_time TIME DEFAULT '10:00',

  -- 픽업/반납 장소
  pickup_location TEXT,
  return_location TEXT,

  -- 가격 정보
  base_price INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  insurance_fee INTEGER DEFAULT 0,
  additional_fee INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,

  -- 추가 옵션
  options JSONB DEFAULT '{}',
  -- 예: {"child_seat": true, "gps": true, "wifi": false}

  -- 상태
  status VARCHAR(20) DEFAULT 'pending',
  -- status: 'pending'(대기), 'approved'(승인), 'confirmed'(확정),
  --         'in_use'(이용중), 'completed'(완료), 'cancelled'(취소)

  -- 결제 상태
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  -- payment_status: 'unpaid', 'partial', 'paid', 'refunded'

  -- 메모
  customer_memo TEXT,
  admin_memo TEXT,

  -- 취소 정보
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 예약 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_branch_id ON reservations(branch_id);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_id ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_number ON reservations(reservation_number);

-- =====================================================
-- 결제 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- 결제 금액
  amount INTEGER NOT NULL,

  -- 결제 수단
  payment_method VARCHAR(20) NOT NULL,
  -- payment_method: 'card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'cash'

  -- PG 정보
  pg_provider VARCHAR(30),
  -- pg_provider: 'tosspayments', 'inicis', 'nicepay', 'kakao', 'naver'
  pg_transaction_id VARCHAR(100),
  pg_order_id VARCHAR(100),

  -- 카드 정보 (카드 결제 시)
  card_company VARCHAR(30),
  card_number VARCHAR(20), -- 마스킹된 번호
  installment_months INTEGER DEFAULT 0,

  -- 상태
  status VARCHAR(20) DEFAULT 'pending',
  -- status: 'pending', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refund'

  -- 환불 정보
  refund_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- 정산 정보 (본사-지점 정산용)
  settlement_status VARCHAR(20) DEFAULT 'pending',
  -- settlement_status: 'pending', 'processing', 'completed'
  settlement_amount INTEGER,
  settlement_date DATE,
  hq_fee_rate DECIMAL(5,2) DEFAULT 5.00, -- 본사 수수료율 (%)
  hq_fee_amount INTEGER,

  -- 결제 완료 시간
  paid_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_settlement_status ON payments(settlement_status);

-- =====================================================
-- 뷰: 만료 임박 보험
-- =====================================================
CREATE OR REPLACE VIEW expiring_insurances AS
SELECT
  vi.*,
  v.name as vehicle_name,
  v.license_plate,
  b.name as branch_name
FROM vehicle_insurances vi
JOIN vehicles v ON vi.vehicle_id = v.id
JOIN branches b ON vi.branch_id = b.id
WHERE vi.end_date <= CURRENT_DATE + INTERVAL '30 days'
  AND vi.is_active = true
ORDER BY vi.end_date ASC;

-- =====================================================
-- 뷰: 지점별 매출 통계
-- =====================================================
CREATE OR REPLACE VIEW branch_revenue_stats AS
SELECT
  b.id as branch_id,
  b.name as branch_name,
  COUNT(DISTINCT r.id) as total_reservations,
  COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_reservations,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.hq_fee_amount ELSE 0 END), 0) as total_hq_fee
FROM branches b
LEFT JOIN reservations r ON b.id = r.branch_id
LEFT JOIN payments p ON r.id = p.reservation_id
GROUP BY b.id, b.name;

-- =====================================================
-- 함수: 예약 번호 생성
-- =====================================================
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reservation_number := 'RV' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 예약 생성 시 예약 번호 자동 생성
DROP TRIGGER IF EXISTS set_reservation_number ON reservations;
CREATE TRIGGER set_reservation_number
  BEFORE INSERT ON reservations
  FOR EACH ROW
  WHEN (NEW.reservation_number IS NULL)
  EXECUTE FUNCTION generate_reservation_number();

-- =====================================================
-- 함수: updated_at 자동 갱신
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: updated_at 자동 갱신
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_insurances_updated_at ON vehicle_insurances;
CREATE TRIGGER update_vehicle_insurances_updated_at
  BEFORE UPDATE ON vehicle_insurances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- vehicles 테이블 RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select_all" ON vehicles
  FOR SELECT USING (true);

CREATE POLICY "vehicles_insert_own" ON vehicles
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

CREATE POLICY "vehicles_update_own" ON vehicles
  FOR UPDATE USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

-- reservations 테이블 RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_select_own" ON reservations
  FOR SELECT USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

CREATE POLICY "reservations_insert_all" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reservations_update_own" ON reservations
  FOR UPDATE USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

-- payments 테이블 RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

-- vehicle_insurances 테이블 RLS
ALTER TABLE vehicle_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insurances_select_own" ON vehicle_insurances
  FOR SELECT USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

CREATE POLICY "insurances_insert_own" ON vehicle_insurances
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

CREATE POLICY "insurances_update_own" ON vehicle_insurances
  FOR UPDATE USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

-- =====================================================
-- 리뷰 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- 고객 정보
  customer_name VARCHAR(50) NOT NULL,
  customer_phone VARCHAR(20), -- 선택사항 (비공개)

  -- 리뷰 내용
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  vehicle_name VARCHAR(100), -- 차량이 삭제되어도 표시용으로 저장

  -- 상태
  is_approved BOOLEAN DEFAULT false, -- 관리자 승인 여부
  is_visible BOOLEAN DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리뷰 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_branch_id ON reviews(branch_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id ON reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 리뷰 updated_at 트리거
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- reviews 테이블 RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 승인된 리뷰는 누구나 조회 가능
CREATE POLICY "reviews_select_approved" ON reviews
  FOR SELECT USING (
    is_approved = true AND is_visible = true
  );

-- 지점 관리자는 자기 지점 리뷰 모두 조회 가능
CREATE POLICY "reviews_select_branch" ON reviews
  FOR SELECT USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );

-- 누구나 리뷰 작성 가능
CREATE POLICY "reviews_insert_all" ON reviews
  FOR INSERT WITH CHECK (true);

-- 지점 관리자만 수정 가능
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (
    branch_id IN (
      SELECT id FROM branches WHERE api_key = current_setting('app.branch_api_key', true)::uuid
    )
    OR current_setting('app.is_admin', true) = 'true'
  );
