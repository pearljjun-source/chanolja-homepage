// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 샘플링 비율
  tracesSampleRate: 1.0,

  // 개발 환경에서는 Sentry 비활성화
  enabled: process.env.NODE_ENV === 'production',

  // 디버그 모드
  debug: false,

  // 환경 설정
  environment: process.env.NODE_ENV,
})
