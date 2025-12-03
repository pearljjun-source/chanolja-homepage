'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: '법인 회사가 부도나면 어떻게 되나요?',
    answer: `렌트 회사는 부도날 일이 거의 없습니다. 렌트카 회사가 부동산 담보 등을 설정하지 않는 한, 은행에서 대출을 해주기 않기 때문입니다.

2금융 캐피탈에서 각각 한대의 차량마다 저당권 설정을 하고 할부 여신 한도를 주는데 (자동차 할부) 본사 대표가 나쁜 마음을 먹고 횡령하지 않는 한 잘못될 일이 없습니다.

미납된 차량할부금이 있다 해도 차량을 처분해서 남은 할부금을 처리하게 됩니다.

방법: 차량마다 1순위 저당권 설정 (할부시, 캐피탈사가 1순위 저당)`,
  },
  {
    question: '기존 사업자 (공업사, 카센타 사업자)에 렌트카 업종 추가해도 되나요?',
    answer: `"안됩니다"

렌트 사업은 "허가증"을 요하는 사업 입니다. 공업사 사업자, 카세센타, 사업자, 세차장, 사업자 등은 렌트사업 "허가증"이 없기 때문에 이 허가증을 보유한, 차놀자의 지점 사업자로 운영 하셔야 합니다.`,
  },
  {
    question: '그렇다면 기존 사업자 (공업사, 세차장, 카센타 등) 종합소득세가 합산 되나요?',
    answer: `"안됩니다"

카센타를 운영하시는 홍길동 사장님께서 카센타 사업자와 GS렌트카 홍길동 지점과는 종합소득세 합산이 안됩니다.
( 홍길동 카센타 + GS렌트카 홍길동 지점 X )
→ GS렌트카 홍길동 지점 매출은 GS렌트카 본사 매출로 합산이 됩니다.`,
  },
  {
    question: '간판, 보험, 차량 구매 별도로 구입해도 되나요?',
    answer: `별도로 가능 합니다. 하지만 간판, 명함 등은 색상이나 시안이 변경 되어서는 안됩니다.

보험, 차량 구매로 별도 가능하지만 본사와 협약시 다양한 혜택을 누릴 수 있습니다.`,
  },
  {
    question: '중고차량을 구매해도 이전이 가능한가요?',
    answer: `1) 일반 차량에서 렌트카로 이전 시: 승용은 1년 미만, 승합은 3년 미만 차량만 이전 가능
2) A렌트카에서 B렌트카로 이전 시: 차량 연식과 관계없이 이전 가능`,
  },
  {
    question: '지점간 이전시 유의할 점?',
    answer: `A지점에서 B지점에 판매를 했을 때, 판매 시점 이전의 과태료 등은 A지점이 책임.
판매 이후 개별소비세(5년간 보유), 부가세는 최종 구매자인 B지점이 책임을 져야합니다.

※ 중고차 거래 시 (부가세, 개별소비세)를 감안해서 구입하셔야 합니다.`,
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">
            자주 묻는 <span className="text-primary">질문</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            렌트카 창업에 대해 궁금한 점을 확인하세요
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-dark pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
