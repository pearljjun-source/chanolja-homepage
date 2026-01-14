/** @type {import('next').NextConfig} */

const { withSentryConfig } = require('@sentry/nextjs')

// Bundle analyzer for performance analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
