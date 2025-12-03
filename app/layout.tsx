import type { Metadata } from 'next'
import './globals.css'
import LayoutWrapper from '@/components/common/LayoutWrapper'

export const metadata: Metadata = {
  title: {
    default: '차놀자 CHANOLJA | 렌트카 지점 개설 & 법인 설립 전문',
    template: '%s | 차놀자 CHANOLJA',
  },
  description: '27년 자동차 업계 경력, 전국 120개 지점 운영. 렌트카 창업, 법인 설립, 캠핑카 사업까지. GROW TOGETHER - 우리 모두가 함께 성장합니다.',
  keywords: ['차놀자', 'chanolja', '렌트카 창업', '렌트카 지점', '법인 설립', '캠핑카 렌트', '지에스렌트카'],
  authors: [{ name: '차놀자' }],
  creator: '차놀자',
  publisher: '지에스렌트카(주)',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://www.chanolja.com',
    siteName: '차놀자 CHANOLJA',
    title: '차놀자 CHANOLJA | 렌트카 지점 개설 & 법인 설립 전문',
    description: '27년 자동차 업계 경력, 전국 120개 지점 운영. 렌트카 창업의 새로운 기준.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '차놀자 CHANOLJA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '차놀자 CHANOLJA | 렌트카 지점 개설 & 법인 설립 전문',
    description: '27년 자동차 업계 경력, 전국 120개 지점 운영.',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="font-sans">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}
