'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Menu, X, Home, Car, Info, Star, MapPin, CalendarCheck, Newspaper } from 'lucide-react'
import type { ThemeType } from '@/lib/themes'
import { themeClasses } from '@/lib/themes'

interface BranchHeaderProps {
  subdomain: string
  branchName: string
  branchPhone?: string
  theme?: ThemeType
}

export default function BranchHeader({ subdomain, branchName, branchPhone, theme = 'sky' }: BranchHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const tc = themeClasses[theme]

  const basePath = `/branch/${subdomain}`

  const navigation = [
    { name: '홈', href: basePath, icon: Home },
    { name: '차량보기', href: `${basePath}/vehicles`, icon: Car },
    { name: '지점소개', href: `${basePath}/about`, icon: Info },
    { name: '고객후기', href: `${basePath}/reviews`, icon: Star },
    { name: '소식', href: `${basePath}/news`, icon: Newspaper },
    { name: '오시는길', href: `${basePath}/location`, icon: MapPin },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 모바일 메뉴 열림 시 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-md py-2'
            : 'bg-white/95 backdrop-blur-sm py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-between">
            {/* 로고 + 지점명 */}
            <Link href={basePath} className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="차놀자"
                width={100}
                height={30}
                className="h-7 md:h-8 w-auto"
              />
              <span className={`text-sm md:text-base font-bold ${tc.text} hidden sm:inline`}>
                {branchName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-[15px] font-semibold text-gray-700 hover:text-gray-900 transition-colors relative group"
                >
                  {item.name}
                  <span className={`absolute -bottom-1 left-0 h-0.5 ${tc.bg} w-0 group-hover:w-full transition-all duration-300`} />
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              {branchPhone && (
                <a
                  href={`tel:${branchPhone}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full ${tc.bgLight} flex items-center justify-center`}>
                    <Phone className={`w-4 h-4 ${tc.text}`} />
                  </div>
                  <span className="font-semibold text-sm">{branchPhone}</span>
                </a>
              )}
              <Link
                href="/reservation"
                className={`px-5 py-2.5 ${tc.bg} ${tc.bgHover} text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-1.5`}
              >
                <CalendarCheck className="w-4 h-4" />
                예약하기
              </Link>
            </div>

            {/* Mobile: Phone + Menu */}
            <div className="flex items-center gap-2 lg:hidden">
              {branchPhone && (
                <a
                  href={`tel:${branchPhone}`}
                  className={`p-2 ${tc.bg} text-white rounded-full`}
                  aria-label={`전화 ${branchPhone}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-gray-900"
                aria-label="메뉴"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 text-gray-700 hover:text-gray-900 border-b border-gray-100 last:border-0"
                >
                  <item.icon className={`w-5 h-5 ${tc.text}`} />
                  <span className="font-semibold text-[15px]">{item.name}</span>
                </Link>
              ))}
              <Link
                href="/reservation"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-center gap-2 mt-3 py-3 ${tc.bg} text-white rounded-lg font-semibold text-sm`}
              >
                <CalendarCheck className="w-4 h-4" />
                예약하기
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-gray-400 active:text-gray-900 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
