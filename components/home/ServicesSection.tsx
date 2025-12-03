'use client'

import Link from 'next/link'
import { Car, Building, FileCheck, Bus, ArrowRight } from 'lucide-react'

const services = [
  {
    icon: Car,
    title: '렌트카 지점 개설',
    description: '전국 120개 지점 운영 노하우로 성공적인 렌트카 지점 개설을 지원합니다. 체계적인 교육과 지속적인 본사 지원으로 안정적인 사업 운영이 가능합니다.',
    features: ['경영 컨설팅', '행정 업무 지원', '영업 교육'],
    href: '/startup',
    color: 'bg-primary',
    lightColor: 'bg-primary/15',
  },
  {
    icon: Building,
    title: '법인 설립',
    description: '렌트카 법인 설립부터 운영까지 원스톱 서비스를 제공합니다. 27년간 16개 이상의 법인 설립 경험을 바탕으로 최적의 솔루션을 제안합니다.',
    features: ['법인 설립 대행', '세무/회계 지원', '운영 컨설팅'],
    href: '/startup',
    color: 'bg-cyan-600',
    lightColor: 'bg-cyan-600/15',
  },
  {
    icon: FileCheck,
    title: '리스 및 장기렌트카',
    description: '개인 및 법인 고객을 위한 맞춤형 리스·장기렌트 서비스를 제공합니다. 다양한 차종과 합리적인 조건으로 최적의 솔루션을 제안합니다.',
    features: ['맞춤형 견적', '다양한 차종', '세금 절감 효과'],
    href: '/startup',
    color: 'bg-teal-600',
    lightColor: 'bg-teal-600/15',
  },
  {
    icon: Bus,
    title: '승합 버스 여행사 사업',
    description: '승합차 및 버스를 활용한 여행사 사업을 지원합니다. 관광버스 운영부터 여행상품 개발까지 토탈 솔루션을 제공합니다.',
    features: ['차량 운영 지원', '여행상품 개발', '마케팅 지원'],
    href: '/startup',
    color: 'bg-sky-700',
    lightColor: 'bg-sky-700/15',
  },
]

export default function ServicesSection() {
  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className="container-custom px-4">
        <div className="text-center mb-8 lg:mb-16">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-dark mb-3 lg:mb-4">
            차놀자와 함께하는 <span className="text-primary">사업 영역</span>
          </h2>
          <p className="text-sm lg:text-base text-gray-600 max-w-2xl mx-auto">
            지점과 영업소 개설부터 창업 컨설팅까지 차놀자와 함께하세요
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 lg:gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className={`group ${service.lightColor} rounded-xl lg:rounded-2xl p-5 lg:p-8 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 hover:bg-white`}
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 lg:w-14 lg:h-14 ${service.color} rounded-lg lg:rounded-xl mb-4 lg:mb-6 shadow-lg`}>
                <service.icon className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
              </div>

              <h3 className="text-lg lg:text-2xl font-bold text-dark mb-2 lg:mb-4">{service.title}</h3>
              <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base line-clamp-3 lg:line-clamp-none">{service.description}</p>

              <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-4 lg:mb-6">
                {service.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="px-2 lg:px-3 py-0.5 lg:py-1 bg-white text-gray-700 text-xs lg:text-sm font-medium rounded-full border border-gray-200"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <Link
                href={service.href}
                className="inline-flex items-center gap-2 text-primary font-semibold text-sm lg:text-base group-hover:gap-3 transition-all"
              >
                자세히 보기
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
