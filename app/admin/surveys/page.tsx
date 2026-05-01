'use client'

import { useState } from 'react'
import { Search, Mail, MailOpen, Trash2, Eye, FileDown, FileSpreadsheet, ClipboardList, Link2, Check, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FranchiseSurvey } from '@/types/franchise-survey'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { useAdminSurveys } from '@/lib/hooks/use-admin-queries'
import { useQueryClient } from '@tanstack/react-query'
import { generateSurveyPDF } from '@/lib/utils/survey-pdf'
import { downloadSurveysExcel } from '@/lib/utils/survey-excel'

const budgetLabels: Record<string, string> = {
  '3천만원 이하': '3천만원 이하',
  '3천~5천만원': '3천~5천만원',
  '5천만원~1억원': '5천~1억',
  '1억~2억원': '1~2억',
  '2억원 이상': '2억 이상',
}

export default function AdminSurveysPage() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<FranchiseSurvey | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const surveyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/survey/franchise`
    : '/survey/franchise'

  const copyLink = async () => {
    await navigator.clipboard.writeText(surveyUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const { data: surveys = [], isLoading } = useAdminSurveys()

  const markAsRead = async (survey: FranchiseSurvey) => {
    if (survey.is_read) return
    const supabase = createClient()
    const { error } = await supabase.from('franchise_surveys').update({ is_read: true }).eq('id', survey.id)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'surveys'] })
      if (selected?.id === survey.id) setSelected({ ...survey, is_read: true })
    }
  }

  const deleteSurvey = async (id: string) => {
    if (!await confirm({ title: '정말 삭제하시겠습니까?', variant: 'danger' })) return
    const supabase = createClient()
    const { error } = await supabase.from('franchise_surveys').delete().eq('id', id)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'surveys'] })
      if (selected?.id === id) setSelected(null)
    }
  }

  const handleSelect = (survey: FranchiseSurvey) => {
    setSelected(survey)
    markAsRead(survey)
  }

  const filtered = surveys.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.region || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-dark">설문 관리</h1>
            <p className="text-gray-500">프랜차이즈 가맹 설문 응답을 확인하고 관리합니다.</p>
          </div>
          {surveys.length > 0 && (
            <button onClick={() => downloadSurveysExcel(surveys)}
              className="btn-outline flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              전체 엑셀 다운로드
            </button>
          )}
        </div>

        {/* 설문 링크 공유 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-900">설문지 링크</p>
              <p className="text-sm text-blue-700 truncate">{surveyUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={copyLink}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                linkCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}>
              {linkCopied ? <><Check className="w-4 h-4" /> 복사됨</> : <><Link2 className="w-4 h-4" /> 링크 복사</>}
            </button>
            <a href={`https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(surveyUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#FEE500] text-[#3C1E1E] hover:bg-[#F0D800] transition-colors">
              <MessageCircle className="w-4 h-4" />
              카카오톡 공유
            </a>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm mb-4">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="이름 또는 지역 검색..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  aria-label="설문 검색" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filtered.map(survey => (
                <button key={survey.id} onClick={() => handleSelect(survey)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selected?.id === survey.id ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    {survey.is_read ? (
                      <MailOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                    ) : (
                      <Mail className="w-5 h-5 text-primary mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium ${survey.is_read ? 'text-gray-600' : 'text-dark'}`}>
                          {survey.name}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(survey.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{survey.region || '지역 미입력'} · {survey.age_group}</p>
                      <p className="text-sm text-gray-400 mt-1">{budgetLabels[survey.estimated_budget] || survey.estimated_budget}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-500">설문 응답이 없습니다.</div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <SurveyDetail survey={selected} onMarkRead={() => markAsRead(selected)}
              onDelete={() => deleteSurvey(selected.id)} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">왼쪽에서 설문을 선택해주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SurveyDetail({ survey, onMarkRead, onDelete }: {
  survey: FranchiseSurvey
  onMarkRead: () => void
  onDelete: () => void
}) {
  const vehicleEntries = Object.entries(survey.vehicle_plan || {}).filter(
    ([, v]) => v && (v.model || v.count)
  )

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dark">{survey.name}</h2>
            <p className="text-gray-500">{survey.region || '지역 미입력'} · {survey.age_group} · {survey.estimated_budget}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => generateSurveyPDF(survey)}
              className="p-2 text-gray-400 hover:text-primary transition-colors" title="PDF 다운로드" aria-label="PDF 다운로드">
              <FileDown className="w-5 h-5" />
            </button>
            <button onClick={onMarkRead}
              className="p-2 text-gray-400 hover:text-primary transition-colors" title="읽음 표시" aria-label="읽음 표시">
              <Eye className="w-5 h-5" />
            </button>
            <button onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="삭제" aria-label="삭제">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 개인정보 */}
        <Section title="1. 개인정보">
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="이름" value={survey.name} />
            <InfoItem label="연락처" value={survey.phone} href={`tel:${survey.phone}`} />
            <InfoItem label="이메일" value={survey.email || '-'} href={survey.email ? `mailto:${survey.email}` : undefined} />
            <InfoItem label="지역" value={survey.region || '-'} />
            <InfoItem label="희망 연락방법" value={survey.preferred_contact} />
            <InfoItem label="제출일시" value={new Date(survey.created_at).toLocaleString('ko-KR')} />
          </div>
        </Section>

        {/* 연령대 */}
        <Section title="2. 연령대">
          <Badge>{survey.age_group}</Badge>
        </Section>

        {/* 창업 이유 */}
        <Section title="3. 창업 희망 이유">
          <p className="text-gray-700 whitespace-pre-line">{survey.startup_reason}</p>
        </Section>

        {/* 경험 */}
        <Section title="4. 관련 경험">
          <div className="flex flex-wrap gap-2 mb-2">
            {survey.experience.map(exp => <Badge key={exp}>{exp}</Badge>)}
            {survey.experience.length === 0 && <span className="text-gray-400 text-sm">선택 없음</span>}
          </div>
          {survey.experience_other && <p className="text-sm text-gray-600">기타: {survey.experience_other}</p>}
          {survey.experience_years != null && <p className="text-sm text-gray-600">업력: {survey.experience_years}년</p>}
        </Section>

        {/* 비즈니스 모델 */}
        <Section title="5. 희망 비즈니스 모델">
          <div className="flex flex-wrap gap-2">
            {survey.business_models.map(m => <Badge key={m}>{m}</Badge>)}
            {survey.business_models.length === 0 && <span className="text-gray-400 text-sm">선택 없음</span>}
          </div>
        </Section>

        {/* 중요 요소 */}
        <Section title="6. 가장 중요한 요소">
          <div className="flex flex-wrap gap-2 mb-2">
            {survey.important_factors.map(f => <Badge key={f}>{f}</Badge>)}
            {survey.important_factors.length === 0 && <span className="text-gray-400 text-sm">선택 없음</span>}
          </div>
          {survey.important_factors_other && <p className="text-sm text-gray-600">기타: {survey.important_factors_other}</p>}
        </Section>

        {/* 예상 창업비용 */}
        <Section title="7. 예상 창업비용">
          <Badge>{survey.estimated_budget}</Badge>
        </Section>

        {/* 차량 계획 */}
        <Section title="8. 초기 차량 계획">
          {vehicleEntries.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {vehicleEntries.map(([size, plan]) => (
                <div key={size} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700 w-16">{size}</span>
                  <span className="text-gray-600">{plan.model || '-'}</span>
                  <span className="text-gray-500">({plan.count}대)</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">미입력</span>
          )}
        </Section>

        {/* SWOT */}
        <Section title="9. SWOT 분석">
          <div className="grid sm:grid-cols-2 gap-4">
            <SwotBox label="강점 (S)" value={survey.swot_strength} color="blue" />
            <SwotBox label="약점 (W)" value={survey.swot_weakness} color="red" />
            <SwotBox label="기회 (O)" value={survey.swot_opportunity} color="green" />
            <SwotBox label="위협 (T)" value={survey.swot_threat} color="yellow" />
          </div>
        </Section>

        {/* 알게 된 경로 */}
        <Section title="10. 알게 된 경로">
          <div className="flex flex-wrap gap-2 mb-2">
            {survey.referral_source.map(r => <Badge key={r}>{r}</Badge>)}
            {survey.referral_source.length === 0 && <span className="text-gray-400 text-sm">선택 없음</span>}
          </div>
          {survey.referral_source_other && <p className="text-sm text-gray-600">기타: {survey.referral_source_other}</p>}
        </Section>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <a href={`tel:${survey.phone}`} className="btn-primary">전화 연결</a>
          {survey.email && <a href={`mailto:${survey.email}`} className="btn-outline">이메일 보내기</a>}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="p-4 bg-gray-50 rounded-lg">{children}</div>
    </div>
  )
}

function InfoItem({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {href ? (
        <a href={href} className="text-sm font-medium text-primary hover:underline">{value}</a>
      ) : (
        <p className="text-sm font-medium text-gray-800">{value}</p>
      )}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
      {children}
    </span>
  )
}

function SwotBox({ label, value, color }: { label: string; value: string | null; color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-l-blue-500',
    red: 'border-l-red-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500',
  }
  return (
    <div className={`bg-white border-l-4 ${colors[color]} p-3 rounded`}>
      <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-line">{value || '-'}</p>
    </div>
  )
}
