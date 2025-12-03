'use client'

const historyData = [
  {
    period: '2007~2010',
    events: [
      '(주)지에스렌트카 법인 설립 (일반대여 / 사고대차)',
      '(주)지에스렌트카 법인 설립 (장기렌트카)',
      '국내 최초 매장형 렌트카',
      '제1호 독립법인 (주)지에스렌트카 평택 법인 설립',
    ],
  },
  {
    period: '2012~2014',
    events: [
      '장기렌트카 오토리스 겸업 회사로 발전',
      '렌트리스 상품 출시 (소유개념의 렌탈)',
      '인수형렌트 상품 출시',
      '지점 개설을 시작으로 경기남부지역과 충청도를 중심으로 중부권 최대의 지점망 설치',
    ],
  },
  {
    period: '2015~2018',
    events: [
      '렌트의 개념이 아닌 차량 판매의 개념으로 "렌트 리스 소유" 상품 출시',
      '(주) 지에스렌트카 & 오토리스로 명칭 변경',
      '한국도로공사 그룹형 카쉐어링 전량 납품',
      '국내 최초 승합차량 콜 운송 서비스 시행',
    ],
  },
  {
    period: '2020~',
    events: [
      '캠핑카 지점 개설 시작',
      '쿠팡 입점',
      'WADIZ 올인원 캠핑카 펀딩',
      '수익형렌트카 맞춤형 렌트카 B/M 특허',
      '자동차 토탈 서비스 플랫폼 차놀자협동조합설립',
      '현대자동차 차박캠핑 이벤트 "휠핑" 진행',
      '마스터캠핑카 판권 계약 체결',
      '다니고밴(전기차) 총 판권 계약 체결',
      '전국에 100개 지점 돌파',
    ],
  },
  {
    period: '2023~2024',
    events: [
      '캠핑카 50개 지점 230여대 캠핑카 서비스 확보',
      '캠핑카 플랫폼 웹/앱 서비스 출시 및 운영',
      '인천관광기업지원센터 입주 (공모전 선정)',
      '전북워케이션/전북 관광 MOU 체결',
      '인천대학교 가족회사 인증',
      '벤처기업 & ISO14001 인증 획득',
      '국내 최초 제주도 캠핑카 서비스 공급',
      '2024. 12월 KBS 광고 시작',
    ],
  },
]

export default function HistorySection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">
            차놀자 <span className="text-primary">연혁</span>
          </h2>
          <p className="section-subtitle">
            2008년부터 함께 걸어온 성장의 발자취
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {historyData.map((item, index) => (
            <div key={index} className="relative pl-8 pb-12 last:pb-0">
              {/* Timeline Line */}
              {index !== historyData.length - 1 && (
                <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Timeline Dot */}
              <div className="absolute left-0 top-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>

              {/* Content */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-primary mb-4">{item.period}</h3>
                <ul className="space-y-2">
                  {item.events.map((event, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-dark rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
