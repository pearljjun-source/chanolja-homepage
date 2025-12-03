'use client'

import { ArrowRight, CheckCircle } from 'lucide-react'

export default function StartupCostSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">
            창업 <span className="text-primary">비용</span> 비교
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            일반 렌트카 창업 vs 차놀자 창업스쿨
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* 일반 창업 */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-dark mb-6">렌트카 창업 기본조건</h3>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4">
                <p className="text-gray-600 mb-1">렌트카 차량 구매비용</p>
                <p className="font-semibold">최소평균 2,000만원 x 50대 = <span className="text-red-500">10억원</span></p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-gray-600 mb-1">렌트카 차량 최초 보험료</p>
                <p className="font-semibold">최소평균 150만원 x 50대 = <span className="text-red-500">7,500만원</span></p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-gray-600 mb-1">차량 등록비용</p>
                <p className="font-semibold">2,000만원 x 4% x 50대 = <span className="text-red-500">4,000만원</span></p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-red-50 rounded-xl text-center">
              <p className="text-gray-600 mb-2">최소 비용</p>
              <p className="text-3xl font-bold text-red-500">약 12억원</p>
              <p className="text-gray-600 mt-2">이상의 재정 필요</p>
            </div>
          </div>

          {/* 차놀자 창업스쿨 */}
          <div className="bg-primary/5 rounded-2xl p-8 border-2 border-primary">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-dark">렌트카 창업스쿨 가입 조건</h3>
              <span className="px-2 py-1 bg-primary text-white text-xs font-bold rounded">추천</span>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4">
                <p className="text-gray-600 mb-1">인수비 (설립비용)</p>
                <p className="font-semibold text-primary">4,000만원</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-gray-600 mb-1">차량구매비 대출을 위한 현금</p>
                <p className="font-semibold">예금담보 <span className="text-primary">5,000~1억원</span></p>
                <p className="text-sm text-gray-500 mt-1">▶ 초기차량 구매를 위한 예금담보</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-gray-600 mb-1">렌트카 창업 프로그램 보증금</p>
                <p className="font-semibold text-primary">5,000만원</p>
                <p className="text-sm text-gray-500 mt-1">▶ 보증보험</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-primary rounded-xl text-center text-white">
              <p className="text-white/80 mb-2">정부 창업 지원금을 통해</p>
              <p className="text-2xl font-bold">더더욱 효율적인</p>
              <p className="text-2xl font-bold">렌트카 창업 기반 조성</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-dark mb-8">
            차놀자 창업스쿨의 <span className="text-primary">혜택</span>
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              '자동차 업계 25년 이상의 경력이 보증',
              '자동차 전문가 전은태 대표와 함께',
              '16개 지점설립 경험 전수',
              '디지파츠, 한솔렌트카, 모아렌트카 등 파생법인 설립 경험',
              '체계적인 렌트카 설립 운영 방법 노하우',
              '렌트카 운영 및 소프트웨어 지원 개발',
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
