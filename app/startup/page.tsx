import { Metadata } from 'next'
import StartupHero from '@/components/startup/StartupHero'
import WhyStartupSection from '@/components/startup/WhyStartupSection'
import StartupTypesSection from '@/components/startup/StartupTypesSection'
import StartupProcessSection from '@/components/startup/StartupProcessSection'
import FAQSection from '@/components/startup/FAQSection'
import InquirySection from '@/components/startup/InquirySection'

export const metadata: Metadata = {
  title: '렌트카창업',
  description: '차놀자와 함께하는 렌트카 창업. 27년 노하우와 전국 120개 지점 네트워크를 바탕으로 성공적인 창업을 지원합니다. 지점 개설, 법인 설립, 캠핑카 사업까지.',
  keywords: ['렌트카 창업', '렌트카 프랜차이즈', '렌트카 사업', '렌트카 창업 비용', '법인 설립', '캠핑카 사업', '렌트카 가맹', '자동차 대여 창업'],
  openGraph: {
    title: '렌트카창업 | 차놀자 CHANOLJA',
    description: '27년 노하우와 전국 120개 지점 네트워크로 성공적인 렌트카 창업 지원.',
    url: '/startup',
  },
  alternates: {
    canonical: '/startup',
  },
}

export default function StartupPage() {
  return (
    <>
      <StartupHero />
      <WhyStartupSection />
      <StartupTypesSection />
      <StartupProcessSection />
      <FAQSection />
      <InquirySection />
    </>
  )
}
