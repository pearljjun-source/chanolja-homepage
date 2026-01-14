'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      tags: {
        errorType: 'global-error',
        digest: error.digest,
      },
    })
    console.error('Global Error:', error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* 에러 아이콘 */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>

            {/* 에러 메시지 */}
            <h1 className="text-2xl font-bold text-white mb-3">
              심각한 오류가 발생했습니다
            </h1>
            <p className="text-slate-400 mb-8">
              페이지를 불러오는 중 문제가 발생했습니다.<br />
              새로고침을 시도해 주세요.
            </p>

            {/* 액션 버튼 */}
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              새로고침
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
