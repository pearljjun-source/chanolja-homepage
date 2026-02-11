/** @type {import('next').NextConfig} */

const { withSentryConfig } = require('@sentry/nextjs')

// Bundle analyzer for performance analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.tosspayments.com https://*.map.naver.com https://oapi.map.naver.com https://wcs.naver.net https://dapi.kakao.com https://*.pstatic.net https://*.sentry.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://wcs.naver.net https://*.map.naver.com https://oapi.map.naver.com https://*.pstatic.net https://*.map.naver.net",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.tosspayments.com https://wcs.naver.net https://*.map.naver.com https://oapi.map.naver.com https://*.pstatic.net https://*.map.naver.net https://*.sentry.io",
      "frame-src 'self' https://js.tosspayments.com https://*.map.naver.com https://map.naver.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Sentry instrumentation hook
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

// Sentry 설정 옵션
const sentryWebpackPluginOptions = {
  // 소스맵 업로드 설정
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 빌드 시 소스맵 업로드만 (런타임에는 숨김)
  silent: true,
  hideSourceMaps: true,

  // 빌드 오류 시에도 배포 진행
  disableLogger: true,

  // 자동 계측 범위
  automaticVercelMonitors: true,
}

// Sentry가 설정되지 않은 경우 스킵
const finalConfig = withBundleAnalyzer(nextConfig)

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(finalConfig, sentryWebpackPluginOptions)
  : finalConfig
