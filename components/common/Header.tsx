'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PhoneCall, Home, Building, Rocket, Newspaper, MapPin } from 'lucide-react'
import Logo from './Logo'

const navigation = [
  { name: '홈', href: '/', icon: Home, mobileOnly: true },
  { name: '회사소개', href: '/about', icon: Building },
  { name: '렌트카창업', href: '/startup', icon: Rocket },
  { name: '뉴스룸', href: '/news', icon: Newspaper },
  { name: '지점현황', href: '/branches', icon: MapPin },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-md py-2 md:py-3'
            : 'bg-white/95 backdrop-blur-sm py-3 md:py-4'
        }`}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-10">
              {navigation.filter(item => !item.mobileOnly).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-[17px] font-semibold tracking-tight transition-colors duration-200 relative group ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-gray-800 hover:text-primary'
                  }`}
                >
                  {item.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* CTA Button & Phone */}
            <div className="hidden lg:flex items-center gap-5">
              <a
                href="tel:041-522-7000"
                className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <PhoneCall className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-[15px] tracking-tight">041-522-7000</span>
              </a>
              <Link
                href="/startup#inquiry"
                className="btn-primary text-sm px-5 py-2.5"
              >
                창업 문의
              </Link>
            </div>

            {/* Mobile: Phone Button Only */}
            <div className="flex items-center lg:hidden">
              <a
                href="tel:041-522-7000"
                className="p-2 bg-primary text-white rounded-full"
              >
                <PhoneCall className="w-5 h-5" />
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
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
