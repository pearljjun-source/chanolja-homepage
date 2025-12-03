'use client'

import { Building2, FileText, MapPin, Calendar, Coins, TrendingUp } from 'lucide-react'

const companies = [
  {
    name: '지에스렌트카(주)',
    info: [
      { label: '사업자번호', value: '312-81-96863' },
      { label: '법인번호', value: '161511-0096101' },
      { label: '대표자', value: '전 은 태' },
      { label: '본사주소', value: '충남 천안시 동남구 충절로 224, 1층' },
      { label: '설립연도', value: '2008년 02월 11일' },
      { label: '자본금', value: '21억' },
      { label: '자산규모', value: '200억 (2022년 01월 기준)' },
    ],
  },
  {
    name: '(주) 차놀자',
    info: [
      { label: '사업자번호', value: '471-81-03474' },
      { label: '법인번호', value: '161511-0365217' },
      { label: '본사주소', value: '충남 천안시 동남구 충절로 224, 3층' },
      { label: '설립연도', value: '2024년' },
      { label: '사업영역', value: '차놀자 관련 법인 사업 기획 운영' },
    ],
  },
  {
    name: '차놀자협동조합',
    info: [
      { label: '사업자번호', value: '694-81-02025' },
      { label: '법인번호', value: '161571-0012440' },
      { label: '본사주소', value: '충남 천안시 동남구 충절로 224, 1층' },
      { label: '설립연도', value: '2021년' },
      { label: '사업영역', value: '협동조합원 모집, 조합사업, 조합비/운영비 관리' },
    ],
  },
]

export default function CompanyInfoSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            회사 <span className="text-primary">개요</span>
          </h2>
          <p className="text-lg text-gray-600 font-medium tracking-wide">
            차놀자 그룹사 소개
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {companies.map((company, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-dark">{company.name}</h3>
              </div>

              <div className="space-y-4">
                {company.info.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 min-w-[80px]">{item.label}</span>
                    <span className="text-sm text-dark font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Business Structure */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-dark mb-8 text-center">
            차놀자 <span className="text-primary">사업 구조</span>
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 text-center border border-primary/20">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h4 className="font-bold text-dark mb-2">렌트카 지점 창업</h4>
              <p className="text-sm text-gray-600 whitespace-nowrap">지점 개설 / 법인 설립 / 창업 컨설팅</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
              <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚗</span>
              </div>
              <h4 className="font-bold text-dark mb-2">자동차렌트</h4>
              <p className="text-sm text-gray-600">사고대차 / 리스 / 장기렌트카</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center border border-slate-200">
              <div className="w-14 h-14 bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h4 className="font-bold text-dark mb-2">자동차정비</h4>
              <p className="text-sm text-gray-600">1급공업사 / 자동차정비</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 text-center border border-teal-200">
              <div className="w-14 h-14 bg-teal-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏕️</span>
              </div>
              <h4 className="font-bold text-dark mb-2">캠핑카 / 여행</h4>
              <p className="text-sm text-gray-600">차놀자캠핑 / 관광버스 / 화물운송</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
