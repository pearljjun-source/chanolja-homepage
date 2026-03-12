// 본사(HQ) 고정 정보 - 변경 시 이 파일만 수정
export const HQ = {
  phone: '041-522-7000',
  address: '충남 천안시 동남구 충절로 224',
  companyName: '지에스렌트카(주)',
  ceo: '전은태',
  businessNumber: '312-81-96863',
  brandName: '차놀자',
  brandNameEn: 'CHANOLJA',
  slogan: 'GROW TOGETHER',
  sloganKo: '우리 모두가 함께 성장합니다',
  experience: '27년 자동차 업계 경력',
  branchCount: '전국 120개 이상 지점',
  operatingHours: '월~금 09:00 - 18:00',
} as const

// 지점 기본값 (DB에 값이 없을 때 fallback)
export const BRANCH_DEFAULTS = {
  businessHours: '09:00 - 21:00',
  description: '깨끗하고 안전한 차량, 합리적인 가격으로 고객님의 특별한 여정을 함께합니다.',
} as const
