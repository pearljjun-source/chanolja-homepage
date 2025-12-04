'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Phone, MapPin, Clock, Youtube, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      {/* Main Footer */}
      <div className="container-custom py-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4 lg:mb-6">
              <Image
                src="/images/logo.png"
                alt="차놀자 로고"
                width={120}
                height={36}
                className="brightness-0 invert h-8 lg:h-10 w-auto"
              />
            </Link>
            <p className="text-gray-300 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base">
              27년 자동차 업계 경력과 전국 120개 지점 운영 노하우로
              성공적인 렌트카 창업을 함께합니다.
            </p>
            <p className="text-xl lg:text-2xl font-bold text-primary mb-1">
              GROW TOGETHER
            </p>
            <p className="text-gray-400 text-sm lg:text-base">
              우리 모두가 함께 성장합니다
            </p>
          </div>

          {/* Quick Links - 모바일에서 숨김 (하단 네비에 있음) */}
          <div className="hidden lg:block">
            <h4 className="text-lg font-semibold mb-4">바로가기</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-primary transition-colors">
                  회사소개
                </Link>
              </li>
              <li>
                <Link href="/startup" className="text-gray-400 hover:text-primary transition-colors">
                  렌트카창업
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-gray-400 hover:text-primary transition-colors">
                  뉴스룸
                </Link>
              </li>
              <li>
                <Link href="/branches" className="text-gray-400 hover:text-primary transition-colors">
                  지점현황
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">연락처</h4>
            <ul className="space-y-3 lg:space-y-4">
              <li className="flex items-start gap-2 lg:gap-3">
                <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm lg:text-base">대표전화</p>
                  <a href="tel:041-522-7000" className="text-gray-400 hover:text-primary transition-colors text-sm lg:text-base">
                    041-522-7000
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2 lg:gap-3">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm lg:text-base">운영시간</p>
                  <p className="text-gray-400 text-sm lg:text-base">월~금 09:00 - 18:00</p>
                </div>
              </li>
              <li className="flex items-start gap-2 lg:gap-3">
                <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm lg:text-base">본사 위치</p>
                  <p className="text-gray-400 text-sm lg:text-base">
                    충남 천안시 동남구 충절로 224
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links - 모바일 최적화 */}
        <div className="mt-6 lg:mt-10 pt-6 lg:pt-8 border-t border-gray-800">
          <div className="flex flex-col gap-4">
            <span className="text-gray-400 text-sm">공식 채널</span>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://cafe.naver.com/chanolja"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#03C75A] rounded-lg hover:opacity-90 transition-opacity"
              >
                <span className="font-bold text-xs lg:text-sm">N</span>
                <span className="text-xs lg:text-sm font-medium">카페</span>
              </a>
              <a
                href="https://www.youtube.com/channel/UCjBtbct7aCsJ4fo0S4g5bRQ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FF0000] rounded-lg hover:opacity-90 transition-opacity"
              >
                <Youtube className="w-4 h-4" />
                <span className="text-xs lg:text-sm font-medium">유튜브</span>
              </a>
              <a
                href="https://www.instagram.com/chanolja.official/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-lg hover:opacity-90 transition-opacity"
              >
                <Instagram className="w-4 h-4" />
                <span className="text-xs lg:text-sm font-medium">인스타</span>
              </a>
              <a
                href="https://blog.naver.com/chanolja_official_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#03C75A] rounded-lg hover:opacity-90 transition-opacity"
              >
                <span className="font-bold text-xs lg:text-sm">B</span>
                <span className="text-xs lg:text-sm font-medium">블로그</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 text-xs lg:text-sm text-gray-500">
            <div className="space-y-0.5 lg:space-y-1">
              <p>
                <span className="font-semibold text-gray-400">지에스렌트카(주)</span>
                <span className="mx-2">|</span>
                <span>대표 전은태</span>
              </p>
              <p>사업자등록번호: 312-81-96863</p>
            </div>
            <div className="flex items-center gap-3 lg:gap-4 text-gray-500">
              <p>&copy; {new Date().getFullYear()} CHANOLJA</p>
              <Link href="/login" className="text-gray-500 hover:text-primary transition-colors">
                관리자
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
