'use client'

import { CheckCircle, Shield, TrendingUp, Headphones, BookOpen, Award } from 'lucide-react'

const reasons = [
  {
    icon: Award,
    title: '27년 업계 경험',
    description: '1998년 대우자동차 판매 입사 이후, 자동차 업계에서 쌓아온 신뢰와 노하우',
  },
  {
    icon: TrendingUp,
    title: '검증된 성공 모델',
    description: '전국 16개 이상의 파생법인 설립 및 120개 지점 운영 실적',
  },
  {
    icon: Shield,
    title: '안정적인 수익 구조',
    description: '재고 부담 없는 렌트카 사업, 유행에 민감하지 않은 안정적 비즈니스',
  },
  {
    icon: BookOpen,
    title: '체계적인 교육 시스템',
    description: '차놀자 창업스쿨을 통한 각 분야 전문가의 효율적인 교육',
  },
  {
    icon: Headphones,
    title: '지속적인 본사 지원',
    description: '영업 노하우, 견적 프로그램, 시스템 등 운영 전반에 걸친 지원',
  },
  {
    icon: CheckCircle,
    title: '낮은 진입 장벽',
    description: '일반 창업 대비 저렴한 비용, 정부 지원금을 통한 효율적 창업 가능',
  },
]

export default function WhyChooseSection() {
  return (
    <section className="py-12 lg:py-20 bg-dark text-white">
      <div className="container-custom px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 lg:mb-6">
              렌트카 창업,<br />
              <span className="text-primary">왜 차놀자</span>와 함께 해야 할까요?
            </h2>
            <p className="text-gray-400 text-sm lg:text-lg mb-6 lg:mb-8 leading-relaxed">
              자동차 업계 25년 이상의 경력이 보증하는 자동차 전문가 전은태 대표와 함께하는 렌트카 창업.
              디지파츠, 한솔렌트카, 모아렌트카 등 수많은 렌트카 파생법인 설립 경험을 전수합니다.
            </p>

            <div className="bg-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <p className="text-lg lg:text-xl font-semibold text-primary mb-2">
                "본사의 이익만이 아니라"
              </p>
              <p className="text-gray-300 text-sm lg:text-base">
                고객, 지점도 함께 혜택을 누리고 함께 성장하는 것이 회사의 이념이며 사명입니다.
              </p>
            </div>
          </div>

          {/* Right Content - Grid */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-lg lg:rounded-xl p-4 lg:p-6 hover:bg-white/10 transition-colors duration-300"
              >
                <reason.icon className="w-6 h-6 lg:w-8 lg:h-8 text-primary mb-2 lg:mb-4" />
                <h3 className="font-semibold text-sm lg:text-lg mb-1 lg:mb-2">{reason.title}</h3>
                <p className="text-gray-400 text-xs lg:text-sm line-clamp-2 lg:line-clamp-none">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
