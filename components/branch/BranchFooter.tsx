'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Phone, MapPin, Clock } from 'lucide-react'
import type { ThemeType } from '@/lib/themes'
import { themeClasses } from '@/lib/themes'

interface BranchFooterProps {
  subdomain: string
  branchName: string
  branchPhone?: string
  branchAddress?: string
  theme?: ThemeType
}

export default function BranchFooter({ subdomain, branchName, branchPhone, branchAddress, theme = 'sky' }: BranchFooterProps) {
  const tc = themeClasses[theme]
  const basePath = `/branch/${subdomain}`

  return (
    <footer className="bg-gray-900 text-white pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* 지점 정보 */}
          <div>
            <Link href={basePath} className="inline-flex items-center gap-2 mb-4">
              <Image
                src="/images/logo.png"
                alt="차놀자"
                width={100}
                height={30}
                className="brightness-0 invert h-7 w-auto"
              />
              <span className={`font-bold ${tc.text}`}>{branchName}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              깨끗하고 안전한 차량, 합리적인 가격으로<br />
              고객님의 특별한 여정을 함께합니다.
            </p>
          </div>

          {/* 연락처 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-gray-300">연락처</h4>
            <ul className="space-y-2.5">
              {branchPhone && (
                <li className="flex items-center gap-2">
                  <Phone className={`w-4 h-4 ${tc.text} flex-shrink-0`} />
                  <a href={`tel:${branchPhone}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {branchPhone}
                  </a>
                </li>
              )}
              {branchAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className={`w-4 h-4 ${tc.text} flex-shrink-0 mt-0.5`} />
                  <span className="text-gray-400 text-sm">{branchAddress}</span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${tc.text} flex-shrink-0`} />
                <span className="text-gray-400 text-sm">09:00 - 21:00 (연중무휴)</span>
              </li>
            </ul>
          </div>

          {/* 바로가기 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-gray-300">바로가기</h4>
            <ul className="space-y-2">
              {[
                { name: '차량보기', href: `${basePath}/vehicles` },
                { name: '지점소개', href: `${basePath}/about` },
                { name: '고객후기', href: `${basePath}/reviews` },
                { name: '소식', href: `${basePath}/news` },
                { name: '오시는길', href: `${basePath}/location` },
                { name: '예약하기', href: '/reservation' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} 차놀자 {branchName}. Powered by CHANOLJA</p>
          <Link href="/" className="hover:text-gray-300 transition-colors">
            차놀자 본사 홈페이지
          </Link>
        </div>
      </div>
    </footer>
  )
}
