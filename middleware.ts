import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// 세션 업데이트가 필요 없는 public API 경로
const PUBLIC_API_ROUTES = ['/api/franchise-survey', '/api/inquiries', '/api/geocode']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public API는 세션 업데이트 불필요 — Supabase auth.getUser() 호출 생략
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
