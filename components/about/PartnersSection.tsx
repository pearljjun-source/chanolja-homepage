'use client'

import { GraduationCap, Building, Handshake } from 'lucide-react'

const partnerCategories = [
  {
    icon: GraduationCap,
    title: '교육기관',
    partners: ['인천대학교', '호서대학교', '백석대학교 산하 청소년 수련원'],
  },
  {
    icon: Building,
    title: '공공기관 & 협회',
    partners: [
      '강원특별자치도관광협회',
      '인천관광공사',
      '전라특별자치도청',
      '한국노총 충남지부',
      '천안시청',
      '충청남도 도의회',
      '천안신문',
      '캠핑크',
    ],
  },
  {
    icon: Handshake,
    title: '협력기업',
    partners: [
      '(주)유비퍼스트대원',
      '제이스모빌리티(주)',
      '(주)더쎄븐렌트카',
      '래인보우모빌리티(주)',
      '하이랜더RV:(주)글램핑월드',
      '(주)탑스모빌',
      '(주)스와컴',
      '나비네트웍스(주)',
      '비전오토코리아(주)',
      '(주)넥스트모빌',
      '(주)부러나',
      '(주)브이닷',
      '스카이오토넷(주)',
      '(주)네이처모빌리티',
    ],
  },
]

export default function PartnersSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">
            차놀자 <span className="text-primary">협력업체</span>
          </h2>
          <p className="section-subtitle">
            함께 성장하는 파트너들을 소개합니다
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {partnerCategories.map((category, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <category.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-dark">{category.title}</h3>
              </div>

              <ul className="space-y-2">
                {category.partners.map((partner, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {partner}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="mt-16">
          <h3 className="text-2xl md:text-3xl font-bold text-dark text-center mb-10 tracking-tight">
            인증 <span className="text-primary">&</span> 특허
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { name: '벤처기업 인증', icon: '🏆' },
              { name: 'ISO14001 환경경영시스템 인증', icon: '🌿' },
              { name: '기업부설연구소 인정서', icon: '🔬' },
              { name: '수익형 렌트카 시스템 특허', icon: '📋' },
              { name: '차량 관련 정보 서버 특허', icon: '💻' },
              { name: '렌트카 대여업 상표등록', icon: '®️' },
            ].map((cert, index) => (
              <div
                key={index}
                className="group flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:from-slate-700 hover:to-slate-600 transition-all duration-300"
              >
                <span className="text-base">{cert.icon}</span>
                <span className="tracking-wide">{cert.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
