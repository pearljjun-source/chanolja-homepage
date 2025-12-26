import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '차량 예약',
  description: '차놀자 통합 예약 시스템. 전국 120개 지점에서 다양한 렌트카를 간편하게 예약하세요.',
  alternates: {
    canonical: '/reservation',
  },
}

export default function ReservationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
