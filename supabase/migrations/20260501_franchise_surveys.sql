-- =====================================================
-- 프랜차이즈 가맹 설문조사 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS franchise_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 1. 개인정보
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  region TEXT,

  -- 2. 연령대
  age_group TEXT NOT NULL, -- '10대','20대','30대','40대','50대','기타'

  -- 3. 창업 희망 이유
  startup_reason TEXT NOT NULL,

  -- 4. 관련 경험 (복수선택 배열 + 기타 텍스트 + 업력)
  experience TEXT[] DEFAULT '{}', -- ['공업사(카센타)','자동차 영업','렉카','보험영업','세차장']
  experience_other TEXT,
  experience_years INTEGER,

  -- 5. 희망 비즈니스 모델 (복수선택 배열)
  business_models TEXT[] DEFAULT '{}', -- ['보험사고대차','카쉐어링 및 일반대여','리스 및 장기렌트','캠핑카 대여','승합차 이동서비스']

  -- 6. 가장 중요한 요소 (복수선택 배열 + 기타 텍스트)
  important_factors TEXT[] DEFAULT '{}', -- ['자본금','영업력','인맥','비즈니스모델','본사운영']
  important_factors_other TEXT,

  -- 7. 예상 창업비용
  estimated_budget TEXT NOT NULL, -- '3천만원 이하','3천~5천만원','5천만원~1억원','1억~2억원','2억원 이상'

  -- 8. 초기 차량 계획 (JSON)
  vehicle_plan JSONB DEFAULT '{}', -- {"소형": {"model":"","count":0}, "준중형": {...}, "중형": {...}, "대형": {...}}

  -- 9. SWOT 분석 (주관식)
  swot_strength TEXT,
  swot_weakness TEXT,
  swot_opportunity TEXT,
  swot_threat TEXT,

  -- 10. 알게 된 경로 (복수선택 배열 + 기타 텍스트)
  referral_source TEXT[] DEFAULT '{}', -- ['네이버검색','지인소개','유튜브','페이스북','인스타그램']
  referral_source_other TEXT,

  -- 추가: 희망 연락 방법
  preferred_contact TEXT DEFAULT '전화', -- '전화','카카오톡','이메일'

  -- 개인정보 동의
  privacy_agreed BOOLEAN NOT NULL DEFAULT false,

  -- 관리 필드
  is_read BOOLEAN NOT NULL DEFAULT false,
  admin_memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_franchise_surveys_created_at ON franchise_surveys(created_at DESC);
CREATE INDEX idx_franchise_surveys_is_read ON franchise_surveys(is_read);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_franchise_surveys_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_franchise_surveys_updated_at
  BEFORE UPDATE ON franchise_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_franchise_surveys_updated_at();

-- =====================================================
-- RLS 정책
-- =====================================================

ALTER TABLE franchise_surveys ENABLE ROW LEVEL SECURITY;

-- 누구나 설문 제출 가능 (privacy_agreed가 true일 때만)
CREATE POLICY franchise_surveys_insert_public
  ON franchise_surveys FOR INSERT
  TO anon, authenticated
  WITH CHECK (privacy_agreed = true AND is_read = false);

-- 관리자만 조회 가능
CREATE POLICY franchise_surveys_select_admin
  ON franchise_surveys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- 관리자만 수정 가능
CREATE POLICY franchise_surveys_update_admin
  ON franchise_surveys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- super_admin만 삭제 가능
CREATE POLICY franchise_surveys_delete_admin
  ON franchise_surveys FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
    )
  );
