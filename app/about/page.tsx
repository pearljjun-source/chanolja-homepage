import { Metadata } from 'next'
import AboutHero from '@/components/about/AboutHero'
import CEOSection from '@/components/about/CEOSection'
import VisionSection from '@/components/about/VisionSection'
import HistorySection from '@/components/about/HistorySection'
import CompanyInfoSection from '@/components/about/CompanyInfoSection'
import PartnersSection from '@/components/about/PartnersSection'

export const metadata: Metadata = {
  title: '회사소개',
  description: '차놀자는 27년 자동차 업계 경력과 전국 120개 지점 운영 노하우로 렌트카 지점 개설 및 법인 설립을 지원합니다. GROW TOGETHER - 우리 모두가 함께 성장합니다.',
  keywords: ['차놀자 회사소개', '지에스렌트카', '렌트카 본사', '자동차 업계', '렌트카 네트워크', '차놀자 연혁'],
  openGraph: {
    title: '회사소개 | 차놀자 CHANOLJA',
    description: '27년 자동차 업계 경력과 전국 120개 지점 운영 노하우.',
    url: '/about',
  },
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <VisionSection />
      <CEOSection />
      <HistorySection />
      <CompanyInfoSection />
      <PartnersSection />
    </>
  )
}
