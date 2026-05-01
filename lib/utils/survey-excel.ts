import type { FranchiseSurvey } from '@/types/franchise-survey'

export function downloadSurveysExcel(surveys: FranchiseSurvey[]) {
  const headers = [
    '제출일', '이름', '연락처', '이메일', '지역', '연령대',
    '창업 희망 이유', '관련 경험', '기타 경험', '업력(년)',
    '비즈니스 모델', '중요 요소', '기타 요소',
    '예상 창업비용', '차량 계획',
    '강점(S)', '약점(W)', '기회(O)', '위협(T)',
    '알게 된 경로', '기타 경로', '희망 연락방법', '읽음',
  ]

  const rows = surveys.map(s => {
    const vehicleStr = Object.entries(s.vehicle_plan || {})
      .filter(([, v]) => v && (v.model || v.count))
      .map(([size, plan]) => `${size}:${plan.model || '-'}(${plan.count}대)`)
      .join(', ')

    return [
      new Date(s.created_at).toLocaleString('ko-KR'),
      s.name,
      s.phone,
      s.email || '',
      s.region || '',
      s.age_group,
      s.startup_reason,
      s.experience.join(', '),
      s.experience_other || '',
      s.experience_years?.toString() || '',
      s.business_models.join(', '),
      s.important_factors.join(', '),
      s.important_factors_other || '',
      s.estimated_budget,
      vehicleStr,
      s.swot_strength || '',
      s.swot_weakness || '',
      s.swot_opportunity || '',
      s.swot_threat || '',
      s.referral_source.join(', '),
      s.referral_source_other || '',
      s.preferred_contact,
      s.is_read ? 'Y' : 'N',
    ]
  })

  // BOM + CSV 생성 (한글 엑셀 호환)
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `프랜차이즈_설문_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
