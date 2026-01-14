// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 샘플링 비율
  tracesSampleRate: 1.0,

  // 개발 환경에서는 Sentry 비활성화
  enabled: process.env.NODE_ENV === 'production',

  // 디버그 모드 (개발 시에만)
  debug: false,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 에러 필터링
  beforeSend(event, hint) {
    const error = hint.originalException

    // 특정 에러 타입 무시
    if (error instanceof Error) {
      // Rate limit 에러는 무시 (이미 처리됨)
      if (error.message.includes('Rate limit')) {
        return null
      }
      // 인증 에러는 무시 (정상적인 플로우)
      if (error.message.includes('인증이 필요합니다')) {
        return null
      }
    }

    return event
  },

  // 추가 컨텍스트 설정
  initialScope: {
    tags: {
      app: 'chanolja-homepage',
    },
  },
})
