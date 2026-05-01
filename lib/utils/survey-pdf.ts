import type { FranchiseSurvey } from '@/types/franchise-survey'

export function generateSurveyPDF(survey: FranchiseSurvey) {
  const vehicleEntries = Object.entries(survey.vehicle_plan || {}).filter(
    ([, v]) => v && (v.model || v.count)
  )

  const vehicleRows = vehicleEntries.length > 0
    ? vehicleEntries.map(([size, plan]) => `${size}: ${plan.model || '-'} (${plan.count}대)`).join(' / ')
    : '미입력'

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>프랜차이즈 가맹 설문조사 - ${survey.name}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 12px; color: #333; padding: 30px; }
  .header { background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0; margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 20px; }
  .header .date { font-size: 11px; opacity: 0.8; }
  .content { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
  .section { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 13px; font-weight: bold; color: #1e40af; margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .field-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; }
  .field-value { font-size: 12px; font-weight: 500; }
  .badge { display: inline-block; padding: 2px 8px; background: #dbeafe; color: #1e40af; font-size: 10px; border-radius: 10px; margin: 2px; }
  .text-block { background: #f9fafb; padding: 10px; border-radius: 6px; font-size: 12px; line-height: 1.6; white-space: pre-line; }
  .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .swot-box { padding: 10px; border-radius: 6px; font-size: 11px; line-height: 1.5; }
  .swot-box .label { font-weight: bold; margin-bottom: 4px; font-size: 10px; }
  .swot-s { background: #dbeafe; border-left: 3px solid #3b82f6; }
  .swot-w { background: #fee2e2; border-left: 3px solid #ef4444; }
  .swot-o { background: #dcfce7; border-left: 3px solid #22c55e; }
  .swot-t { background: #fef9c3; border-left: 3px solid #eab308; }
  .footer { text-align: center; padding: 16px; font-size: 10px; color: #9ca3af; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>프랜차이즈 가맹 설문조사</h1>
    <p style="font-size:12px; margin-top:4px; opacity:0.9;">차놀자 렌트카</p>
  </div>
  <div class="date">제출일: ${new Date(survey.created_at).toLocaleString('ko-KR')}</div>
</div>

<div class="content">
  <div class="section">
    <div class="section-title">1. 개인정보</div>
    <div class="grid">
      <div><div class="field-label">이름</div><div class="field-value">${survey.name}</div></div>
      <div><div class="field-label">연락처</div><div class="field-value">${survey.phone}</div></div>
      <div><div class="field-label">이메일</div><div class="field-value">${survey.email || '-'}</div></div>
      <div><div class="field-label">지역</div><div class="field-value">${survey.region || '-'}</div></div>
      <div><div class="field-label">희망 연락방법</div><div class="field-value">${survey.preferred_contact}</div></div>
      <div><div class="field-label">연령대</div><div class="field-value">${survey.age_group}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. 창업 희망 이유</div>
    <div class="text-block">${escapeHtml(survey.startup_reason)}</div>
  </div>

  <div class="section">
    <div class="section-title">4. 관련 경험</div>
    <div>${survey.experience.map(e => `<span class="badge">${escapeHtml(e)}</span>`).join('')}${survey.experience.length === 0 ? '<span style="color:#9ca3af">선택 없음</span>' : ''}</div>
    ${survey.experience_other ? `<div style="margin-top:4px; font-size:11px; color:#6b7280;">기타: ${escapeHtml(survey.experience_other)}</div>` : ''}
    ${survey.experience_years != null ? `<div style="font-size:11px; color:#6b7280;">업력: ${survey.experience_years}년</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">5. 희망 비즈니스 모델</div>
    <div>${survey.business_models.map(m => `<span class="badge">${escapeHtml(m)}</span>`).join('')}${survey.business_models.length === 0 ? '<span style="color:#9ca3af">선택 없음</span>' : ''}</div>
  </div>

  <div class="section">
    <div class="section-title">6. 가장 중요한 요소</div>
    <div>${survey.important_factors.map(f => `<span class="badge">${escapeHtml(f)}</span>`).join('')}${survey.important_factors.length === 0 ? '<span style="color:#9ca3af">선택 없음</span>' : ''}</div>
    ${survey.important_factors_other ? `<div style="margin-top:4px; font-size:11px; color:#6b7280;">기타: ${escapeHtml(survey.important_factors_other)}</div>` : ''}
  </div>

  <div class="section">
    <div class="grid">
      <div>
        <div class="section-title">7. 예상 창업비용</div>
        <span class="badge">${escapeHtml(survey.estimated_budget)}</span>
      </div>
      <div>
        <div class="section-title">8. 초기 차량 계획</div>
        <div class="field-value">${escapeHtml(vehicleRows)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">9. SWOT 분석</div>
    <div class="swot-grid">
      <div class="swot-box swot-s"><div class="label">강점 (Strength)</div>${escapeHtml(survey.swot_strength || '-')}</div>
      <div class="swot-box swot-w"><div class="label">약점 (Weakness)</div>${escapeHtml(survey.swot_weakness || '-')}</div>
      <div class="swot-box swot-o"><div class="label">기회 (Opportunity)</div>${escapeHtml(survey.swot_opportunity || '-')}</div>
      <div class="swot-box swot-t"><div class="label">위협 (Threat)</div>${escapeHtml(survey.swot_threat || '-')}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">10. 알게 된 경로</div>
    <div>${survey.referral_source.map(r => `<span class="badge">${escapeHtml(r)}</span>`).join('')}${survey.referral_source.length === 0 ? '<span style="color:#9ca3af">선택 없음</span>' : ''}</div>
    ${survey.referral_source_other ? `<div style="margin-top:4px; font-size:11px; color:#6b7280;">기타: ${escapeHtml(survey.referral_source_other)}</div>` : ''}
  </div>
</div>

<div class="footer">
  이 설문조사는 프랜차이즈 가맹점이 되려는 이유와 이전 경험에 관해 이해하기 위해 작성되었습니다.
</div>

<script>window.onload = function() { window.print(); }</script>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}
