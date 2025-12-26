import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import LayoutWrapper from '@/components/common/LayoutWrapper'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/common/JsonLd'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'https://차놀자.net'),
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
    url: 'https://차놀자.net',
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
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'CIkkSH6UzgTwJUAj8tqfU-sb07r_cgUUgZaNR0yQh0I',
    other: {
      'naver-site-verification': '25291b360a2087369a507461f66719b10ecd9fea',
    },
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
        {/* 외부 리소스 프리커넥트 - 초기 연결 시간 단축 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* Supabase 프리커넥트 */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />

        {/* 네이버 지도 프리커넥트 */}
        <link rel="preconnect" href="https://openapi.map.naver.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://openapi.map.naver.com" />

        {/* Pretendard 폰트 - preload로 우선순위 높임 */}
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans">
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <LayoutWrapper>{children}</LayoutWrapper>

        {/* 네이버 로그분석 공통스크립트 */}
        <Script
          src="//wcs.naver.net/wcslog.js"
          strategy="afterInteractive"
        />
        <Script id="naver-analytics" strategy="afterInteractive">
          {`
            if (!wcs_add) var wcs_add={};
            wcs_add["wa"] = "s_4c8ee71f4c72";
            if (!_nasa) var _nasa={};
            if(window.wcs){
              wcs.inflow("xn--w80bk23b0hd.net");
              wcs_do();
            }
          `}
        </Script>
      </body>
    </html>
  )
}
