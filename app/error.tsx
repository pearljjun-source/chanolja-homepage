'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 Sentry 등으로 전송)
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 에러 아이콘 */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* 에러 메시지 */}
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          문제가 발생했습니다
        </h1>
        <p className="text-slate-500 mb-8">
          일시적인 오류가 발생했습니다.<br />
          잠시 후 다시 시도해 주세요.
        </p>

        {/* 에러 상세 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-700 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            다시 시도
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
          >
            <Home className="w-5 h-5" />
            홈으로 이동
          </a>
        </div>

        {/* 고객센터 안내 */}
        <p className="mt-8 text-sm text-slate-400">
          문제가 계속되면{' '}
          <a href="tel:1588-0000" className="text-primary hover:underline">
            고객센터
          </a>
          로 연락해 주세요.
        </p>
      </div>
    </div>
  )
}
