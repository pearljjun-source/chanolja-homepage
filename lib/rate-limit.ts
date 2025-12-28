/**
 * API Rate Limiter
 *
 * IP당 요청 횟수를 제한하여 악의적인 API 남용을 방지합니다.
 * 메모리 기반 저장소를 사용합니다. (프로덕션에서는 Redis 권장)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  interval: number  // 시간 간격 (밀리초)
  maxRequests: number  // 간격 내 최대 요청 수
}

// 메모리 저장소 (서버리스 환경에서는 각 인스턴스별로 분리됨)
const rateLimitStore = new Map<string, RateLimitEntry>()

// 오래된 엔트리 정리 간격 (5분)
const CLEANUP_INTERVAL = 5 * 60 * 1000

// 주기적으로 만료된 엔트리 정리
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanupTimer() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)

  // 타이머가 프로세스 종료를 막지 않도록 설정
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
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
 * Rate Limit 체크
 * @param identifier - 식별자 (보통 IP 주소)
 * @param configKey - 설정 키 (default, auth, reservation 등)
 * @returns RateLimitResult
 */
export function checkRateLimit(
  identifier: string,
  configKey: string = 'default'
): RateLimitResult {
  startCleanupTimer()

  const config = RATE_LIMIT_CONFIGS[configKey] || DEFAULT_RATE_LIMIT
  const now = Date.now()
  const key = `${configKey}:${identifier}`

  let entry = rateLimitStore.get(key)

  // 엔트리가 없거나 만료되었으면 새로 생성
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.interval,
    }
  }

  // 요청 수 증가
  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const success = entry.count <= config.maxRequests

  return {
    success,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
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
