/**
 * Sentry 에러 리포팅 헬퍼
 */

import * as Sentry from '@sentry/nextjs'

/**
 * API 에러를 Sentry에 보고
 */
export function captureApiError(
  error: unknown,
  context: {
    api: string
    method?: string
    userId?: string
    branchId?: string
    extra?: Record<string, unknown>
  }
) {
  Sentry.captureException(error, {
    tags: {
      api: context.api,
      method: context.method || 'unknown',
    },
    user: context.userId ? { id: context.userId } : undefined,
    contexts: {
      apiContext: {
        branchId: context.branchId,
        ...context.extra,
      },
    },
  })
}

/**
 * 결제 관련 에러를 Sentry에 보고 (높은 우선순위)
 */
export function capturePaymentError(
  error: unknown,
  context: {
    orderId?: string
    paymentKey?: string
    amount?: number
    branchId?: string
    reservationId?: string
  }
) {
  Sentry.captureException(error, {
    level: 'fatal', // 결제 에러는 심각도 높음
    tags: {
      api: 'payments',
      type: 'payment-error',
    },
    contexts: {
      payment: {
        orderId: context.orderId,
        paymentKey: context.paymentKey,
        amount: context.amount,
        branchId: context.branchId,
        reservationId: context.reservationId,
      },
    },
  })
}

/**
 * 경고 수준의 이벤트 기록
 */
export function captureWarning(
  message: string,
  context?: Record<string, unknown>
) {
  Sentry.captureMessage(message, {
    level: 'warning',
    contexts: context ? { warning: context } : undefined,
  })
}

/**
 * 사용자 컨텍스트 설정
 */
export function setUserContext(user: {
  id: string
  email?: string
  role?: string
  branchId?: string
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  })
  Sentry.setTag('userRole', user.role || 'unknown')
  if (user.branchId) {
    Sentry.setTag('branchId', user.branchId)
  }
}

/**
 * 사용자 컨텍스트 초기화
 */
export function clearUserContext() {
  Sentry.setUser(null)
}
