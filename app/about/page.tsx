import { Metadata } from 'next'
import AboutHero from '@/components/about/AboutHero'
import CEOSection from '@/components/about/CEOSection'
import VisionSection from '@/components/about/VisionSection'
import HistorySection from '@/components/about/HistorySection'
import CompanyInfoSection from '@/components/about/CompanyInfoSection'
import PartnersSection from '@/components/about/PartnersSection'

export const metadata: Metadata = {
  title: '회사소개',
  description: '차놀자는 26년 자동차 업계 경력과 전국 120개 지점 운영 노하우로 렌트카 지점 개설 및 법인 설립을 지원합니다. GROW TOGETHER - 우리 모두가 함께 성장합니다.',
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
