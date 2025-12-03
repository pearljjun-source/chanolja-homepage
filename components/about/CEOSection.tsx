'use client'

import Image from 'next/image'
import { Award, Briefcase, Users, Building2 } from 'lucide-react'

const socialActivities = [
  '충남신문 자문위원 (前)',
  '(사) 천안시 개발 위원회 이사',
  '(사) 천안한빛회 이사 (25년)',
  '국민생활체육 천안시 야구연합회 부회장 (前)',
  '(사) 초록우산 어린이재단 후원회원 (25년)',
  '국제 로타리 3620지구 도솔로타리 회원 (10년)',
  '대한 장애인 배드민턴 협회, 충남지부 부회장 (前)',
  '한국 장애인 협회, 천안지회 봉사과장 (前)',
  'JCI - KOREA 동천안 청년회의소 부회장 (前)',
  'CRIC 충남혁신 사업단 23기',
  '단국대학교 최고 경영자과정 총동문회 사무총장 (40기)',
]

const career = [
  { year: '1998년', content: '대우자동차 판매 입사' },
  { year: '2000~2010년', content: '쌍용자동차 판매 1위' },
  { year: '2002년', content: '최연소 대우자동차 대리점 대표' },
  { year: '2003년', content: '대우자동차 판매 1위 선정' },
  { year: '2008년', content: '지에스렌트카 설립' },
  { year: '2021년', content: '차놀자협동조합 설립 초대 이사장' },
  { year: '2023~2025년', content: '충청남도 정책자문위원 (건설/교통위원회)' },
  { year: '현재', content: '(주)차놀자 공동대표' },
]

export default function CEOSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">
            CEO <span className="text-primary">소개</span>
          </h2>
          <p className="section-subtitle">
            27년 자동차 업계 경력의 전문가
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* CEO Profile */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/ceo_img.png"
                  alt="전은태 대표이사"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm text-primary font-medium mb-1">대표이사</p>
                <h3 className="text-3xl font-bold text-dark">전 은 태</h3>
                <p className="text-gray-500 mt-1">1974년 충남 천안 출생</p>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="flex items-center gap-2 text-lg font-bold text-dark mb-4">
                <Briefcase className="w-5 h-5 text-primary" />
                CAREER
              </h4>
              <div className="space-y-3">
                {career.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <span className="text-sm text-primary font-medium min-w-[100px]">{item.year}</span>
                    <span className="text-gray-700">{item.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Activities */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h4 className="flex items-center gap-2 text-lg font-bold text-dark mb-6">
              <Users className="w-5 h-5 text-primary" />
              SOCIAL ACTIVITY
            </h4>
            <ul className="space-y-3">
              {socialActivities.map((activity, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
