'use client'

import { Package, TrendingUp, BarChart3, Smile, Shield, Wallet } from 'lucide-react'

const benefits = [
  {
    icon: Package,
    title: '재고 부담이 없다',
    description: '차량 구매 비용 부담 없이 시작할 수 있습니다.',
  },
  {
    icon: TrendingUp,
    title: '환금성 용이하다',
    description: '차량은 언제든 현금화가 가능한 자산입니다.',
  },
  {
    icon: BarChart3,
    title: '사업의 기복이 없다',
    description: '경기 변동에 영향을 적게 받는 안정적 사업입니다.',
  },
  {
    icon: Smile,
    title: '유행에 민감하지 않다',
    description: '트렌드에 관계없이 꾸준한 수요가 있습니다.',
  },
  {
    icon: Shield,
    title: '사업의 위험성이 적다',
    description: '보험과 시스템으로 리스크를 최소화합니다.',
  },
  {
    icon: Wallet,
    title: '창업 비용이 저렴한 편이다',
    description: '일반 창업 대비 낮은 비용으로 시작 가능합니다.',
  },
]

export default function WhyStartupSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">
            렌트카 사업의 <span className="text-primary">장점</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            안정적인 수익과 낮은 리스크, 렌트카 사업의 6가지 장점
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-primary hover:text-white group transition-all duration-300"
            >
              <div className="w-14 h-14 bg-primary/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <benefit.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-white">{benefit.title}</h3>
              <p className="text-sm text-gray-600 group-hover:text-white/80 transition-colors">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
