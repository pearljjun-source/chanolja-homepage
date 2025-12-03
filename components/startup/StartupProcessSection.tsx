'use client'

import { PhoneCall, FileCheck, GraduationCap, Building2, Car, Rocket } from 'lucide-react'

const steps = [
  {
    icon: PhoneCall,
    step: 'STEP 1',
    title: '상담 신청',
    description: '전화 또는 온라인으로 상담을 신청하세요.',
  },
  {
    icon: FileCheck,
    step: 'STEP 2',
    title: '사업 분석',
    description: '본인의 상황에 맞는 최적의 창업 유형을 분석합니다.',
  },
  {
    icon: GraduationCap,
    step: 'STEP 3',
    title: '교육 진행',
    description: '차놀자 창업스쿨에서 전문 교육을 받습니다.',
  },
  {
    icon: Building2,
    step: 'STEP 4',
    title: '법인 및 지점 설립',
    description: '법인 설립 및 사업자 등록을 진행합니다.',
  },
  {
    icon: Car,
    step: 'STEP 5',
    title: '차량 출고',
    description: '렌트카 차량을 출고받고 영업을 준비합니다.',
  },
  {
    icon: Rocket,
    step: 'STEP 6',
    title: '영업 시작',
    description: '본사 지원 하에 영업을 시작합니다.',
  },
]

export default function StartupProcessSection() {
  return (
    <section className="py-20 bg-dark text-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            창업 <span className="text-primary">절차</span>
          </h2>
          <p className="text-gray-400 text-lg">
            차놀자와 함께하는 체계적인 창업 프로세스
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-slate-700/90 backdrop-blur-sm rounded-2xl p-6 hover:bg-slate-600/90 transition-all duration-300 shadow-lg shadow-black/20 border border-slate-600/50"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>

              <div className="pt-4">
                <step.icon className="w-10 h-10 text-primary mb-4" />
                <p className="text-primary text-sm font-medium mb-1">{step.step}</p>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && index !== 2 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
