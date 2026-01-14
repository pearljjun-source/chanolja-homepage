import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import {
  checkRateLimit,
  getClientIP,
  getRateLimitConfigKey,
  getRateLimitHeaders,
  createRateLimitResponse,
} from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API 요청에 대해 Rate Limiting 적용
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    const configKey = getRateLimitConfigKey(pathname)

    // GET 요청은 더 관대하게
    const finalConfigKey =
      request.method === 'GET' ? 'read' : configKey

    const rateLimitResult = await checkRateLimit(clientIP, finalConfigKey)

    // Rate Limit 초과 시 429 응답
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    // Rate Limit 헤더를 포함한 응답 생성
    const response = await updateSession(request)
    const headers = getRateLimitHeaders(rateLimitResult)

    // 헤더 추가
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // API가 아닌 요청은 세션 업데이트만
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
