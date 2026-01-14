import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  createRateLimitResponse,
  RateLimitResult,
} from './rate-limit'

/**
 * API 응답 헬퍼
 */
export function apiResponse<T>(
  data: T,
  status: number = 200,
  rateLimitResult?: RateLimitResult
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (rateLimitResult) {
    Object.assign(headers, getRateLimitHeaders(rateLimitResult))
  }

  return NextResponse.json(data, { status, headers })
}

/**
 * API 에러 응답 헬퍼
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  const body: { error: string; details?: Record<string, unknown> } = {
    error: message,
  }

  if (details) {
    body.details = details
  }

  return NextResponse.json(body, { status })
}

/**
 * API Rate Limit 체크 래퍼
 * API 핸들러 내부에서 추가적인 rate limiting이 필요할 때 사용
 */
export async function withRateLimit(
  request: NextRequest,
  configKey: string = 'default'
): Promise<{ success: true; result: RateLimitResult } | { success: false; response: Response }> {
  const clientIP = getClientIP(request)
  const result = await checkRateLimit(clientIP, configKey)

  if (!result.success) {
    return {
      success: false,
      response: createRateLimitResponse(result),
    }
  }

  return { success: true, result }
}

/**
 * 공통 에러 메시지
 */
export const API_ERRORS = {
  UNAUTHORIZED: '인증이 필요합니다',
  FORBIDDEN: '접근 권한이 없습니다',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다',
  BAD_REQUEST: '잘못된 요청입니다',
  INTERNAL_ERROR: '서버 오류가 발생했습니다',
  RATE_LIMITED: '요청 횟수가 너무 많습니다',
  VALIDATION_ERROR: '입력값이 올바르지 않습니다',
} as const

/**
 * 안전한 JSON 파싱
 */
export async function safeParseJSON<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
