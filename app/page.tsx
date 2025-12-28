import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'
import ReservationSection from '@/components/home/ReservationSection'

export const metadata: Metadata = {
  title: '차놀자 CHANOLJA | 렌트카 지점 개설 & 법인 설립 전문',
  description: '27년 자동차 업계 경력, 전국 120개 지점 운영. 렌트카 창업, 법인 설립, 캠핑카 사업까지. GROW TOGETHER - 우리 모두가 함께 성장합니다.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '차놀자 CHANOLJA | 렌트카 지점 개설 & 법인 설립 전문',
    description: '27년 자동차 업계 경력, 전국 120개 지점 운영. 렌트카 창업의 새로운 기준.',
    url: '/',
  },
}

// Below-the-fold 컴포넌트들은 Lazy Loading으로 로드
// 사용자가 스크롤하기 전까지 다운로드하지 않음
const StatsSection = dynamic(() => import('@/components/home/StatsSection'), {
  loading: () => <div className="h-48 bg-slate-50 animate-pulse" />,
})

const NewsSection = dynamic(() => import('@/components/home/NewsSection'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
})

const ServicesSection = dynamic(() => import('@/components/home/ServicesSection'), {
  loading: () => <div className="h-96 bg-white animate-pulse" />,
})

const WhyChooseSection = dynamic(() => import('@/components/home/WhyChooseSection'), {
  loading: () => <div className="h-96 bg-slate-50 animate-pulse" />,
})

const ChannelSection = dynamic(() => import('@/components/home/ChannelSection'), {
  loading: () => <div className="h-48 bg-white animate-pulse" />,
})

const CTASection = dynamic(() => import('@/components/home/CTASection'), {
  loading: () => <div className="h-64 bg-primary/10 animate-pulse" />,
})

export default function HomePage() {
  return (
    <>
      {/* Above-the-fold: 즉시 로드 */}
      <HeroSection />
      {/* TODO: 지점 차량 등록 완료 후 주석 해제 */}
      {/* <ReservationSection /> */}

      {/* Below-the-fold: Lazy Loading */}
      <StatsSection />
      <NewsSection />
      <ServicesSection />
      <WhyChooseSection />
      <ChannelSection />
      <CTASection />
    </>
  )
}
