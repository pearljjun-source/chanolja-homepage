'use client'

import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark via-dark-200 to-dark pb-16 lg:pb-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233CBFDC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/70 to-transparent" />

      {/* Content */}
      <div className="container-custom relative z-10 pt-24 lg:pt-20 px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-white text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-full mb-4 lg:mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-slate-200 text-xs lg:text-sm font-medium tracking-wide">Since 1998 - 27년의 신뢰</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 lg:mb-6">
              <span className="text-primary">GROW</span>
              <br />
              <span className="text-white">TOGETHER</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-white font-medium tracking-widest mb-3 lg:mb-4">
              우리 모두가 <span className="text-primary font-semibold">함께</span> 성장합니다
            </p>

            <p className="text-slate-400 text-base lg:text-lg mb-6 lg:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
              27년 노하우와 전국 120개 지점 네트워크를 바탕으로 성공적인 창업을 함께합니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center lg:justify-start">
              <Link
                href="/startup"
                className="btn-primary inline-flex items-center justify-center gap-2 text-base lg:text-lg px-6 py-3 lg:px-8 lg:py-4"
              >
                창업 시작하기
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/about"
                className="btn-outline inline-flex items-center justify-center gap-2 text-base lg:text-lg px-6 py-3 lg:px-8 lg:py-4"
              >
                회사 소개
              </Link>
            </div>
          </div>

          {/* Right Content - Stats Cards - 모바일에서 간소화된 버전 표시 */}
          <div className="lg:hidden mt-6">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-2xl font-bold text-primary">27</p>
                <p className="text-gray-300 text-xs">년 업력</p>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-2xl font-bold text-primary">120+</p>
                <p className="text-gray-300 text-xs">전국 지점</p>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-2xl font-bold text-primary">1200+</p>
                <p className="text-gray-300 text-xs">보유차량</p>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-2xl font-bold text-primary">230+</p>
                <p className="text-gray-300 text-xs">캠핑카</p>
              </div>
            </div>
          </div>

          {/* Desktop Stats Cards */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-white/5 rounded-2xl">
                    <p className="text-5xl font-bold text-primary mb-2">27</p>
                    <p className="text-gray-300">년 업력</p>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-2xl">
                    <p className="text-5xl font-bold text-primary mb-2">120+</p>
                    <p className="text-gray-300">전국 지점</p>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-2xl">
                    <p className="text-5xl font-bold text-primary mb-2">1200+</p>
                    <p className="text-gray-300">자동차보유대수</p>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-2xl">
                    <p className="text-5xl font-bold text-primary mb-2">230+</p>
                    <p className="text-gray-300">캠핑카 보유</p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-primary/20 rounded-xl">
                  <p className="text-center text-white">
                    <span className="text-xl font-medium tracking-wide">27년, <span className="text-primary font-semibold">120개 지점</span>이 증명합니다.</span>
                  </p>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white text-3xl font-bold">#1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - 모바일에서 숨김 (하단 네비 때문에) */}
      <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
