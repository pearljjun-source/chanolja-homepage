'use client'

import { Car, Building, Bus, Users } from 'lucide-react'

const startupTypes = [
  {
    icon: Car,
    title: '사고대차',
    description: '공업사, 렉카, 현·출 직원, 보험사 등을 통해 사고차량 / 보험사 청구',
    features: [
      '일반 렌트고객, 자동차 영업사원 (출고 지연 고객)',
      '일 또는 월 단위로 차량을 임대',
      'GS렌트카 매출 70% 이상 차지',
      '카플렛, 카모아 등 SNS or 플랫폼 활용',
    ],
    color: 'bg-slate-700',
  },
  {
    icon: Bus,
    title: '승합버스',
    description: '승합차 및 버스를 활용한 여행사 사업 및 운송 서비스',
    features: [
      '관광버스 운영 지원',
      '여행상품 개발 컨설팅',
      '차량 운영 및 마케팅 지원',
      '전국 네트워크 활용',
    ],
    color: 'bg-slate-600',
  },
  {
    icon: Building,
    title: '법인 설립',
    description: '렌트카 법인 설립부터 운영까지 원스톱 서비스 제공',
    features: [
      '법인 설립 대행 서비스',
      '세무/회계 지원',
      '운영 컨설팅 및 교육',
      '16개 이상 법인 설립 경험',
    ],
    color: 'bg-slate-800',
  },
  {
    icon: Users,
    title: '그룹형 카쉐어링',
    description: '기업 및 단체를 위한 맞춤형 카쉐어링 서비스 구축',
    features: [
      '기업 전용 차량 공유 시스템',
      '비용 절감 효과',
      '맞춤형 플랫폼 구축',
      '운영 관리 지원',
    ],
    color: 'bg-slate-700',
  },
]

export default function StartupTypesSection() {
  return (
    <section className="py-20 bg-rose-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">
            <span className="text-primary">창업 유형</span> 안내
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            본인의 상황과 목표에 맞는 창업 유형을 선택하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {startupTypes.map((type, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 ${type.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <type.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark">{type.title}</h3>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{type.description}</p>

              <ul className="space-y-2">
                {type.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
