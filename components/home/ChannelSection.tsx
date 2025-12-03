'use client'

import { ExternalLink } from 'lucide-react'

// 네이버 카페 아이콘 (커피컵 모양)
const NaverCafeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <path d="M12 6c-2.21 0-4 1.79-4 4v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-2.21-1.79-4-4-4zm2 8h-4v-4c0-1.1.9-2 2-2s2 .9 2 2v4z"/>
  </svg>
)

// 유튜브 아이콘
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

// 인스타그램 아이콘
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

// 네이버 블로그 아이콘 (B 모양)
const NaverBlogIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 14H9V8h6c1.66 0 3 1.34 3 3 0 1.31-.84 2.42-2 2.83V14c1.16.41 2 1.52 2 2.83 0 1.75-1.42 3.17-3.17 3.17H9v-2h5.83c.64 0 1.17-.53 1.17-1.17 0-.64-.53-1.17-1.17-1.17H9v-2h6c.55 0 1-.45 1-1s-.45-1-1-1H9V8h6c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
  </svg>
)

export default function ChannelSection() {
  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className="container-custom px-4">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-dark mb-2 lg:mb-4">
            차놀자 <span className="text-primary">공식 채널</span>
          </h2>
          <p className="text-sm lg:text-base text-gray-600">
            차놀자의 다양한 콘텐츠를 만나보세요
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 max-w-6xl mx-auto">
          {/* 네이버 카페 */}
          <a
            href="https://cafe.naver.com/chanolja"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl bg-white border-2 border-gray-100 p-4 lg:p-6 hover:shadow-2xl hover:border-[#03C75A] transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-[#03C75A] rounded-lg lg:rounded-xl flex items-center justify-center text-white">
                  <span className="text-lg lg:text-2xl font-bold">N</span>
                </div>
                <div>
                  <p className="font-bold text-dark text-sm lg:text-base">네이버 카페</p>
                  <p className="text-gray-500 text-xs hidden lg:block">커뮤니티</p>
                </div>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2 hidden sm:block">
                차놀자 렌트카 창업 정보와 회원 커뮤니티
              </p>
              <div className="flex items-center gap-1 lg:gap-2 text-[#03C75A] text-xs lg:text-sm font-semibold">
                바로가기
                <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* 유튜브 */}
          <a
            href="https://www.youtube.com/channel/UCjBtbct7aCsJ4fo0S4g5bRQ"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl bg-white border-2 border-gray-100 p-4 lg:p-6 hover:shadow-2xl hover:border-[#FF0000] transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-[#FF0000] rounded-lg lg:rounded-xl flex items-center justify-center text-white">
                  <YoutubeIcon />
                </div>
                <div>
                  <p className="font-bold text-dark text-sm lg:text-base">유튜브</p>
                  <p className="text-gray-500 text-xs hidden lg:block">차놀자 TV</p>
                </div>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2 hidden sm:block">
                렌트카 창업 노하우와 캠핑카 리뷰 영상
              </p>
              <div className="flex items-center gap-1 lg:gap-2 text-[#FF0000] text-xs lg:text-sm font-semibold">
                바로가기
                <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* 인스타그램 */}
          <a
            href="https://www.instagram.com/chanolja.official/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl bg-white border-2 border-gray-100 p-4 lg:p-6 hover:shadow-2xl hover:border-[#E4405F] transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-lg lg:rounded-xl flex items-center justify-center text-white">
                  <InstagramIcon />
                </div>
                <div>
                  <p className="font-bold text-dark text-sm lg:text-base">인스타그램</p>
                  <p className="text-gray-500 text-xs hidden lg:block">@chanolja.official</p>
                </div>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2 hidden sm:block">
                차놀자 일상과 캠핑 라이프 스타일
              </p>
              <div className="flex items-center gap-1 lg:gap-2 text-[#E4405F] text-xs lg:text-sm font-semibold">
                바로가기
                <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* 네이버 블로그 */}
          <a
            href="https://blog.naver.com/chanolja_official_"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl bg-white border-2 border-gray-100 p-4 lg:p-6 hover:shadow-2xl hover:border-[#03C75A] transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-[#03C75A] rounded-lg lg:rounded-xl flex items-center justify-center text-white">
                  <span className="text-lg lg:text-2xl font-bold">B</span>
                </div>
                <div>
                  <p className="font-bold text-dark text-sm lg:text-base">네이버 블로그</p>
                  <p className="text-gray-500 text-xs hidden lg:block">공식 블로그</p>
                </div>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2 hidden sm:block">
                창업 정보와 캠핑카 여행 이야기
              </p>
              <div className="flex items-center gap-1 lg:gap-2 text-[#03C75A] text-xs lg:text-sm font-semibold">
                바로가기
                <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
