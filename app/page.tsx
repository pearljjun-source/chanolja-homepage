import HeroSection from '@/components/home/HeroSection'
import ReservationSection from '@/components/home/ReservationSection'
import StatsSection from '@/components/home/StatsSection'
import ServicesSection from '@/components/home/ServicesSection'
import WhyChooseSection from '@/components/home/WhyChooseSection'
import NewsSection from '@/components/home/NewsSection'
import CTASection from '@/components/home/CTASection'
import ChannelSection from '@/components/home/ChannelSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ReservationSection />
      <StatsSection />
      <NewsSection />
      <ServicesSection />
      <WhyChooseSection />
      <ChannelSection />
      <CTASection />
    </>
  )
}
