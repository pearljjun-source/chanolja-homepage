'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import {
  AGE_GROUPS,
  EXPERIENCE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  IMPORTANT_FACTOR_OPTIONS,
  BUDGET_OPTIONS,
  VEHICLE_SIZES,
  REFERRAL_OPTIONS,
  CONTACT_METHODS,
  REGIONS,
} from '@/types/franchise-survey'

interface FormState {
  name: string
  phone: string
  email: string
  region: string
  age_group: string
  age_group_other: string
  startup_reason: string
  experience: string[]
  experience_other: string
  experience_years: string
  business_models: string[]
  important_factors: string[]
  important_factors_other: string
  estimated_budget: string
  vehicle_plan: Record<string, { model: string; count: string }>
  swot_strength: string
  swot_weakness: string
  swot_opportunity: string
  swot_threat: string
  referral_source: string[]
  referral_source_other: string
  preferred_contact: string
  privacy_agreed: boolean
}

const initialState: FormState = {
  name: '',
  phone: '',
  email: '',
  region: '',
  age_group: '',
  age_group_other: '',
  startup_reason: '',
  experience: [],
  experience_other: '',
  experience_years: '',
  business_models: [],
  important_factors: [],
  important_factors_other: '',
  estimated_budget: '',
  vehicle_plan: {
    소형: { model: '', count: '' },
    준중형: { model: '', count: '' },
    중형: { model: '', count: '' },
    대형: { model: '', count: '' },
  },
  swot_strength: '',
  swot_weakness: '',
  swot_opportunity: '',
  swot_threat: '',
  referral_source: [],
  referral_source_other: '',
  preferred_contact: '전화',
  privacy_agreed: false,
}

export default function FranchiseSurveyPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckbox = (field: 'experience' | 'business_models' | 'important_factors' | 'referral_source', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  const handleVehiclePlan = (size: string, key: 'model' | 'count', value: string) => {
    setForm(prev => ({
      ...prev,
      vehicle_plan: {
        ...prev.vehicle_plan,
        [size]: { ...prev.vehicle_plan[size], [key]: value },
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 필수 필드 검증 (sr-only 라디오는 브라우저 유효성 검사가 작동하지 않을 수 있음)
    if (!form.name || !form.phone) {
      setError('이름과 연락처를 입력해주세요.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!form.age_group) {
      setError('연령대를 선택해주세요.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!form.startup_reason) {
      setError('창업 희망 이유를 입력해주세요.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!form.estimated_budget) {
      setError('예상 창업비용을 선택해주세요.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)

    try {
      const vehiclePlan: Record<string, { model: string; count: number }> = {}
      for (const size of VEHICLE_SIZES) {
        const plan = form.vehicle_plan[size]
        if (plan.model || plan.count) {
          vehiclePlan[size] = { model: plan.model, count: Number(plan.count) || 0 }
        }
      }

      const response = await fetch('/api/franchise-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          region: form.region || null,
          age_group: form.age_group === '기타' ? `기타(${form.age_group_other})` : form.age_group,
          startup_reason: form.startup_reason,
          experience: form.experience,
          experience_other: form.experience_other || null,
          experience_years: form.experience_years ? Number(form.experience_years) : null,
          business_models: form.business_models,
          important_factors: form.important_factors,
          important_factors_other: form.important_factors_other || null,
          estimated_budget: form.estimated_budget,
          vehicle_plan: vehiclePlan,
          swot_strength: form.swot_strength || null,
          swot_weakness: form.swot_weakness || null,
          swot_opportunity: form.swot_opportunity || null,
          swot_threat: form.swot_threat || null,
          referral_source: form.referral_source,
          referral_source_other: form.referral_source_other || null,
          preferred_contact: form.preferred_contact,
          privacy_agreed: form.privacy_agreed,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '설문 제출 실패')
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('Error submitting survey:', err)
      setError(err instanceof Error ? err.message : '설문 제출 중 오류가 발생했습니다.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">설문이 제출되었습니다</h2>
          <p className="text-gray-600 mb-2">
            소중한 시간 내어 응답해 주셔서 감사합니다.
          </p>
          <p className="text-gray-600">
            작성해 주신 내용을 바탕으로 상담을 진행하겠습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-primary text-white rounded-t-2xl p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">프랜차이즈 가맹 설문조사</h1>
          <p className="text-white/80">
            차놀자 렌트카 프랜차이즈 가맹점이 되려는 이유와 이전 경험에 관해 이해하기 위해 작성되었습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl shadow-lg">
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Q1. 개인정보 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">1. 개인정보를 적어주세요</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input type="text" id="name" name="name" value={form.name} onChange={handleChange}
                  className="input-field" placeholder="홍길동" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange}
                  className="input-field" placeholder="010-0000-0000" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input type="email" id="email" name="email" value={form.email} onChange={handleChange}
                  className="input-field" placeholder="example@email.com" />
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                <select id="region" name="region" value={form.region} onChange={handleChange} className="input-field">
                  <option value="">선택하세요</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Q2. 연령대 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">2. 연령대는 어떻게 되십니까? *</legend>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {AGE_GROUPS.map(age => (
                <label key={age} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors text-sm
                  ${form.age_group === age ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="radio" name="age_group" value={age} checked={form.age_group === age}
                    onChange={handleChange} className="sr-only" />
                  {age}
                </label>
              ))}
            </div>
            {form.age_group === '기타' && (
              <input type="text" name="age_group_other" value={form.age_group_other} onChange={handleChange}
                className="input-field mt-3" placeholder="연령대를 입력해주세요" />
            )}
          </fieldset>

          {/* Q3. 창업 희망 이유 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-2">3. 차놀자 렌트카 창업을 희망하는 이유는 무엇입니까? *</legend>
            <p className="text-sm text-gray-500 mb-3">예시) 렉카나 공업사 운영하는 지인이 많다.</p>
            <textarea name="startup_reason" rows={3} value={form.startup_reason} onChange={handleChange}
              className="input-field resize-none" placeholder="창업 희망 이유를 적어주세요" />
          </fieldset>

          {/* Q4. 관련 경험 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">4. 렌트카 창업과 관련된 이전 경험이 있으십니까? (복수선택)</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {EXPERIENCE_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm
                  ${form.experience.includes(opt) ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="checkbox" checked={form.experience.includes(opt)}
                    onChange={() => handleCheckbox('experience', opt)} className="sr-only" />
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                    ${form.experience.includes(opt) ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                    {form.experience.includes(opt) && <span className="text-xs">&#10003;</span>}
                  </span>
                  {opt}
                </label>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기타 경험</label>
                <input type="text" name="experience_other" value={form.experience_other} onChange={handleChange}
                  className="input-field" placeholder="기타 경험을 입력해주세요" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업력 (년)</label>
                <input type="number" name="experience_years" value={form.experience_years} onChange={handleChange}
                  className="input-field" placeholder="예: 5" min="0" max="50" />
              </div>
            </div>
          </fieldset>

          {/* Q5. 비즈니스 모델 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">5. 현재 고려하고 있는 렌트카 사업 비즈니스 모델은? (복수선택)</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              {BUSINESS_MODEL_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm
                  ${form.business_models.includes(opt) ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="checkbox" checked={form.business_models.includes(opt)}
                    onChange={() => handleCheckbox('business_models', opt)} className="sr-only" />
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                    ${form.business_models.includes(opt) ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                    {form.business_models.includes(opt) && <span className="text-xs">&#10003;</span>}
                  </span>
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Q6. 가장 중요한 요소 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">6. 렌트카 창업을 고려하는데 가장 중요한 요소는? (복수선택)</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {IMPORTANT_FACTOR_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm
                  ${form.important_factors.includes(opt) ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="checkbox" checked={form.important_factors.includes(opt)}
                    onChange={() => handleCheckbox('important_factors', opt)} className="sr-only" />
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                    ${form.important_factors.includes(opt) ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                    {form.important_factors.includes(opt) && <span className="text-xs">&#10003;</span>}
                  </span>
                  {opt}
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">기타</label>
              <input type="text" name="important_factors_other" value={form.important_factors_other} onChange={handleChange}
                className="input-field" placeholder="기타 요소를 입력해주세요" />
            </div>
          </fieldset>

          {/* Q7. 예상 창업비용 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">7. 렌트카 창업비용은 어느정도 예상하고 계신가요? *</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUDGET_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors text-sm
                  ${form.estimated_budget === opt ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="radio" name="estimated_budget" value={opt} checked={form.estimated_budget === opt}
                    onChange={handleChange} className="sr-only" />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Q8. 차량 계획 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">8. 계획하고 있는 초기 렌트카 대수와 차종은?</legend>
            <div className="space-y-3">
              {VEHICLE_SIZES.map(size => (
                <div key={size} className="grid grid-cols-[80px_1fr_100px] gap-3 items-center">
                  <span className="text-sm font-medium text-gray-700">{size}</span>
                  <input type="text" value={form.vehicle_plan[size]?.model || ''} placeholder="차종 (예: 모닝, 아반떼)"
                    onChange={e => handleVehiclePlan(size, 'model', e.target.value)} className="input-field" />
                  <div className="flex items-center gap-1">
                    <input type="number" value={form.vehicle_plan[size]?.count || ''} placeholder="대수" min="0"
                      onChange={e => handleVehiclePlan(size, 'count', e.target.value)} className="input-field" />
                    <span className="text-sm text-gray-500">대</span>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Q9. SWOT 분석 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">9. SWOT 분석</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                  강점 (Strength)
                </label>
                <textarea name="swot_strength" rows={3} value={form.swot_strength} onChange={handleChange}
                  className="input-field resize-none" placeholder="본인이 가진 강점을 적어주세요" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                  약점 (Weakness)
                </label>
                <textarea name="swot_weakness" rows={3} value={form.swot_weakness} onChange={handleChange}
                  className="input-field resize-none" placeholder="부족하다고 느끼는 부분을 적어주세요" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  기회 (Opportunity)
                </label>
                <textarea name="swot_opportunity" rows={3} value={form.swot_opportunity} onChange={handleChange}
                  className="input-field resize-none" placeholder="사업 기회 요인을 적어주세요" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></span>
                  위협 (Threat)
                </label>
                <textarea name="swot_threat" rows={3} value={form.swot_threat} onChange={handleChange}
                  className="input-field resize-none" placeholder="우려되는 위험요소를 적어주세요" />
              </div>
            </div>
          </fieldset>

          {/* Q10. 알게 된 경로 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">10. 차놀자렌트카를 알게 된 경로는? (복수선택)</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {REFERRAL_OPTIONS.map(opt => (
                <label key={opt} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm
                  ${form.referral_source.includes(opt) ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="checkbox" checked={form.referral_source.includes(opt)}
                    onChange={() => handleCheckbox('referral_source', opt)} className="sr-only" />
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                    ${form.referral_source.includes(opt) ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                    {form.referral_source.includes(opt) && <span className="text-xs">&#10003;</span>}
                  </span>
                  {opt}
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">기타</label>
              <input type="text" name="referral_source_other" value={form.referral_source_other} onChange={handleChange}
                className="input-field" placeholder="기타 경로를 입력해주세요" />
            </div>
          </fieldset>

          {/* 희망 연락 방법 */}
          <fieldset className="p-8 border-b border-gray-100">
            <legend className="text-lg font-bold text-gray-900 mb-4">희망 연락 방법</legend>
            <div className="grid grid-cols-3 gap-3">
              {CONTACT_METHODS.map(method => (
                <label key={method} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors text-sm
                  ${form.preferred_contact === method ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="radio" name="preferred_contact" value={method} checked={form.preferred_contact === method}
                    onChange={handleChange} className="sr-only" />
                  {method}
                </label>
              ))}
            </div>
          </fieldset>

          {/* 개인정보 동의 + 제출 */}
          <div className="p-8">
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input type="checkbox" checked={form.privacy_agreed}
                onChange={e => setForm(prev => ({ ...prev, privacy_agreed: e.target.checked }))}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
              <span className="text-sm text-gray-700">
                <strong>[필수]</strong> 본 설문조사는 프랜차이즈 가맹 상담 목적으로만 사용되며,
                개인정보(이름, 연락처, 이메일)는 상담 완료 후 관련 법령에 따라 보관 또는 파기됩니다.
                개인정보 수집 및 이용에 동의합니다.
              </span>
            </label>

            <button type="submit" disabled={isSubmitting || !form.privacy_agreed}
              className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />
              {isSubmitting ? '제출 중...' : '설문 제출하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
