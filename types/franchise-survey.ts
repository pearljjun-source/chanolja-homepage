export interface FranchiseSurvey {
  id: string
  // 1. 개인정보
  name: string
  phone: string
  email: string | null
  region: string | null
  // 2. 연령대
  age_group: string
  // 3. 창업 희망 이유
  startup_reason: string
  // 4. 관련 경험
  experience: string[]
  experience_other: string | null
  experience_years: number | null
  // 5. 비즈니스 모델
  business_models: string[]
  // 6. 중요 요소
  important_factors: string[]
  important_factors_other: string | null
  // 7. 예상 창업비용
  estimated_budget: string
  // 8. 차량 계획
  vehicle_plan: VehiclePlan
  // 9. SWOT
  swot_strength: string | null
  swot_weakness: string | null
  swot_opportunity: string | null
  swot_threat: string | null
  // 10. 알게 된 경로
  referral_source: string[]
  referral_source_other: string | null
  // 추가
  preferred_contact: string
  privacy_agreed: boolean
  // 관리
  is_read: boolean
  admin_memo: string | null
  created_at: string
  updated_at: string
}

export interface VehiclePlan {
  소형?: { model: string; count: number }
  준중형?: { model: string; count: number }
  중형?: { model: string; count: number }
  대형?: { model: string; count: number }
}

// 설문 상수
export const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '기타'] as const

export const EXPERIENCE_OPTIONS = [
  '공업사(카센타)',
  '자동차 영업',
  '렉카',
  '보험영업',
  '세차장',
] as const

export const BUSINESS_MODEL_OPTIONS = [
  '보험사고대차',
  '카쉐어링 및 일반대여',
  '리스 및 장기렌트',
  '캠핑카 대여',
  '승합차(스타렉스/솔라티) 이동서비스',
] as const

export const IMPORTANT_FACTOR_OPTIONS = [
  '자본금',
  '영업력',
  '인맥',
  '비즈니스모델',
  '본사운영',
] as const

export const BUDGET_OPTIONS = [
  '3천만원 이하',
  '3천~5천만원',
  '5천만원~1억원',
  '1억~2억원',
  '2억원 이상',
] as const

export const VEHICLE_SIZES = ['소형', '준중형', '중형', '대형'] as const

export const REFERRAL_OPTIONS = [
  '네이버검색',
  '지인소개',
  '유튜브',
  '페이스북',
  '인스타그램',
] as const

export const CONTACT_METHODS = ['전화', '카카오톡', '이메일'] as const

export const REGIONS = [
  '서울', '경기', '인천', '강원',
  '충남', '충북', '대전', '세종',
  '전남', '전북', '광주', '경남',
  '경북', '대구', '울산', '부산', '제주',
] as const
