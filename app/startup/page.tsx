import { Metadata } from 'next'
import StartupHero from '@/components/startup/StartupHero'
import WhyStartupSection from '@/components/startup/WhyStartupSection'
import StartupTypesSection from '@/components/startup/StartupTypesSection'
import StartupProcessSection from '@/components/startup/StartupProcessSection'
import FAQSection from '@/components/startup/FAQSection'
import InquirySection from '@/components/startup/InquirySection'

export const metadata: Metadata = {
  title: '렌트카창업',
  description: '차놀자와 함께하는 렌트카 창업. 26년 노하우와 전국 120개 지점 네트워크를 바탕으로 성공적인 창업을 지원합니다. 지점 개설, 법인 설립, 캠핑카 사업까지.',
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
