// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 샘플링 비율 설정 (프로덕션에서는 조절 필요)
  tracesSampleRate: 1.0,

  // 리플레이 설정 (세션 리플레이)
  replaysSessionSampleRate: 0.1, // 10% 세션 녹화
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 녹화

  // 개발 환경에서는 Sentry 비활성화
  enabled: process.env.NODE_ENV === 'production',

  // 디버그 모드 (개발 시에만)
  debug: false,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 통합 설정
  integrations: [
    Sentry.replayIntegration({
      // 마스킹 설정 - 민감한 정보 숨기기
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // 에러 필터링
  beforeSend(event) {
    // 특정 에러 무시
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null // 청크 로드 에러 무시
    }
    return event
  },

  // 민감한 정보 제거
  beforeSendTransaction(event) {
    // URL에서 민감한 파라미터 제거
    if (event.request?.url) {
      const url = new URL(event.request.url)
      url.searchParams.delete('token')
      url.searchParams.delete('api_key')
      event.request.url = url.toString()
    }
    return event
  },
})
