'use client'

import Link from 'next/link'
import { PhoneCall, ArrowRight, MessageCircle } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-12 lg:py-20 bg-gradient-to-r from-primary to-primary-600">
      <div className="container-custom px-4">
        <div className="text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4">
            렌트카 창업, 지금 시작하세요
          </h2>
          <p className="text-sm sm:text-base lg:text-xl mb-6 lg:mb-8 max-w-3xl mx-auto font-medium tracking-wide">
            <span className="text-yellow-400 font-semibold">27년 노하우</span>와{' '}
            <span className="text-emerald-300 font-semibold">전국 120개 지점 네트워크</span>를 바탕으로 성공적인 창업을 함께합니다
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 lg:gap-5">
            <Link
              href="/startup#inquiry"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 lg:gap-3 px-6 py-3 lg:px-8 lg:py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
              </div>
              <span className="text-base lg:text-lg tracking-tight">무료 상담 신청</span>
              <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="tel:041-522-7000"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 lg:gap-3 px-6 py-3 lg:px-8 lg:py-4 bg-white/15 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/25 hover:border-white/50 transition-all duration-300"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <PhoneCall className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <span className="text-base lg:text-lg tracking-tight">041-522-7000</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
