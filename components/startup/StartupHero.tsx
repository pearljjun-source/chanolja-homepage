'use client'

import Link from 'next/link'
import { ArrowDown, MessageCircle } from 'lucide-react'

export default function StartupHero() {
  return (
    <section className="relative pt-32 pb-20 bg-gradient-to-br from-dark via-dark-200 to-dark overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233CBFDC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 rounded-full mb-6">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-300 text-sm font-medium tracking-wide">Rental Car Startup</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            렌트카 <span className="text-primary">창업</span>
          </h1>

          <div className="mb-10 space-y-4">
            <p className="text-xl md:text-2xl text-white font-light tracking-wide drop-shadow-sm">
              렌트카 사업 <span className="text-primary font-medium">27년 Know-how</span> 바탕의
            </p>
            <p className="text-xl md:text-2xl text-white font-light tracking-wide drop-shadow-sm">
              렌트카 창업을 위한 <span className="text-amber-300 font-medium">최적의 교육 시스템</span>
            </p>
            <p className="text-base md:text-lg text-gray-300 font-light leading-relaxed tracking-wide pt-3">
              각 전문가의 효율적인 교육으로 성공적인 창업을 지원합니다.
            </p>
          </div>

          <Link
            href="#inquiry"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary-600 text-white text-lg font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span>창업 문의하기</span>
            <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent" />
    </section>
  )
}
