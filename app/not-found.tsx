'use client'

import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 이미지/아이콘 */}
        <div className="relative mb-8">
          <div className="text-[150px] font-bold text-slate-200 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>

        {/* 메시지 */}
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-slate-500 mb-8">
          요청하신 페이지가 존재하지 않거나<br />
          이동되었을 수 있습니다.
        </p>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            홈으로 이동
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 페이지
          </button>
        </div>

        {/* 추천 링크 */}
        <div className="mt-10 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">이런 페이지는 어떠세요?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/branches"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              지점 찾기
            </Link>
            <Link
              href="/reservation"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              차량 예약
            </Link>
            <Link
              href="/startup"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              창업 안내
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
