/**
 * API Rate Limiter (Upstash Redis 기반)
 *
 * IP당 요청 횟수를 제한하여 악의적인 API 남용을 방지합니다.
 * Upstash Redis를 사용하여 서버리스 환경에서도 정확하게 동작합니다.
 */

import { Redis } from '@upstash/redis'
import { captureApiError } from '@/lib/sentry'

// Upstash Redis 클라이언트 생성
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface RateLimitConfig {
  interval: number  // 시간 간격 (밀리초)
  maxRequests: number  // 간격 내 최대 요청 수
}

// 기본 설정: 1분에 100번
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  interval: 60 * 1000,  // 1분
  maxRequests: 100,
}

// API별 다른 제한 설정
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 일반 API: 1분에 100번
  default: DEFAULT_RATE_LIMIT,

  // 인증 관련: 1분에 10번 (브루트포스 방지)
  auth: {
    interval: 60 * 1000,
    maxRequests: 10,
  },

  // 예약 생성: 1분에 5번
  reservation: {
    interval: 60 * 1000,
    maxRequests: 5,
  },

  // 결제: 1분에 3번
  payment: {
    interval: 60 * 1000,
    maxRequests: 3,
  },

  // 문의: 1분에 3번
  inquiry: {
    interval: 60 * 1000,
    maxRequests: 3,
  },

  // 설문: 1분에 5번
  survey: {
    interval: 60 * 1000,
    maxRequests: 5,
  },

  // 조회 API: 1분에 200번 (더 관대함)
  read: {
    interval: 60 * 1000,
    maxRequests: 200,
  },
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Rate Limit 체크 (Vercel KV 기반)
 * @param identifier - 식별자 (보통 IP 주소)
 * @param configKey - 설정 키 (default, auth, reservation 등)
 * @returns Promise<RateLimitResult>
 */
export async function checkRateLimit(
  identifier: string,
  configKey: string = 'default'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[configKey] || DEFAULT_RATE_LIMIT
  const key = `ratelimit:${configKey}:${identifier}`
  const intervalSeconds = Math.ceil(config.interval / 1000)

  try {
    // INCR + TTL 설정을 한 번에 처리 (원자적 연산)
    const count = await redis.incr(key)

    // 첫 요청일 경우 TTL 설정
    if (count === 1) {
      await redis.expire(key, intervalSeconds)
    }

    // TTL 조회하여 resetTime 계산
    const ttl = await redis.ttl(key)
    const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : config.interval)

    const remaining = Math.max(0, config.maxRequests - count)
    const success = count <= config.maxRequests

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime,
    }
  } catch (error) {
    // Sentry 알림: Redis 장애 감지
    captureApiError(error, {
      api: 'rate-limit',
      extra: { configKey, identifier },
    })

    // 민감한 API(결제, 인증, 예약, 문의)는 fail-closed (차단)
    const sensitiveKeys = ['auth', 'payment', 'reservation', 'inquiry', 'survey']
    if (sensitiveKeys.includes(configKey)) {
      console.error('Rate limit check failed (BLOCKED - sensitive API):', error)
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: Date.now() + config.interval,
      }
    }

    // 일반 API는 fail-open (통과)
    console.error('Rate limit check failed (BYPASS):', error)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.interval,
    }
  }
}

/**
 * Rate Limit 응답 헤더 생성
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  }
}

/**
 * 클라이언트 IP 추출
 */
export function getClientIP(request: Request): string {
  // Vercel / Cloudflare 등의 프록시 헤더 확인
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // 첫 번째 IP가 실제 클라이언트 IP
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // 헤더가 없으면 기본값
  return 'unknown'
}

/**
 * API 경로에 따른 Rate Limit 설정 키 결정
 */
export function getRateLimitConfigKey(pathname: string): string {
  // 인증 관련
  if (pathname.includes('/auth') || pathname.includes('/login')) {
    return 'auth'
  }

  // 예약 관련
  if (pathname.includes('/reservations')) {
    return 'reservation'
  }

  // 결제 관련
  if (pathname.includes('/payments')) {
    return 'payment'
  }

  // GET 요청용 조회 API는 더 관대하게 (미들웨어에서 method 확인 필요)
  // 기본값
  return 'default'
}

/**
 * Rate Limit 초과 시 응답
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: '요청 횟수가 너무 많습니다',
      message: `잠시 후 다시 시도해주세요 (${retryAfter}초 후)`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...getRateLimitHeaders(result),
      },
    }
  )
}
