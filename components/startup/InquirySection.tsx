'use client'

import { useState } from 'react'
import { Send, Phone, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inquiryTypes = [
  { value: 'branch', label: '지점 개설' },
  { value: 'corporation', label: '법인 설립' },
  { value: 'camping', label: '캠핑카 사업' },
  { value: 'other', label: '기타 문의' },
]

const regions = [
  '서울', '경기', '인천', '강원',
  '충남', '충북', '대전', '세종',
  '전남', '전북', '광주', '경남',
  '경북', '대구', '울산', '부산', '제주',
]

export default function InquirySection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    region: '',
    inquiryType: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('inquiries')
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          region: formData.region || null,
          inquiry_type: formData.inquiryType,
          message: formData.message,
        })

      if (insertError) {
        throw insertError
      }

      // 네이버 로그분석 전환스크립트 (신청완료/lead)
      if (typeof window !== 'undefined' && (window as any).wcs) {
        const wcs = (window as any).wcs
        if (!(window as any).wcs_add) (window as any).wcs_add = {}
        ;(window as any).wcs_add['wa'] = 's_4c8ee71f4c72'
        const _conv = { type: 'lead' }
        wcs.trans(_conv)
      }

      setIsSubmitted(true)
      setFormData({
        name: '',
        phone: '',
        email: '',
        region: '',
        inquiryType: '',
        message: '',
      })
    } catch (err) {
      console.error('Error submitting inquiry:', err)
      setError('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <section id="inquiry" className="py-20 bg-primary">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-4">문의가 접수되었습니다</h2>
            <p className="text-white/90 text-lg mb-8">
              빠른 시일 내에 담당자가 연락드리겠습니다.<br />
              감사합니다.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              추가 문의하기
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="inquiry" className="py-20 bg-primary">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              창업 문의
            </h2>
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              렌트카 창업에 관심이 있으신가요?<br />
              아래 양식을 작성해 주시면 빠른 시일 내에 연락드리겠습니다.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold mb-1">대표전화</p>
                  <a href="tel:041-522-7000" className="text-white/80 hover:text-white">
                    041-522-7000~1
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold mb-1">운영시간</p>
                  <p className="text-white/80">월~금 09:00 - 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold mb-1">본사 위치</p>
                  <p className="text-white/80">
                    충청남도 천안시 동남구 충절로 224 1층
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Form */}
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="example@email.com"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                    희망 지역
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">선택하세요</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-1">
                    문의 유형 *
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">선택하세요</option>
                    {inquiryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  문의 내용 *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="input-field resize-none"
                  placeholder="문의 내용을 입력해주세요"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '전송 중...' : '문의하기'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                제출하신 정보는 창업 상담 목적으로만 사용됩니다.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
