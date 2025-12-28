'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
}

export default function Logo({
  className = '',
  width = 140,
  height = 40,
  showText = true
}: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative group">
        {/* 항상 보이는 글로우 효과 */}
        <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full scale-150 animate-pulse-glow" />

        {/* 로고 이미지 - 호버 시 확대 */}
        <Image
          src="/images/logo.png"
          alt="차놀자 로고"
          width={width}
          height={height}
          priority
          className="h-auto w-auto relative z-10 group-hover:scale-110 transition-transform duration-300"
        />
      </div>
    </Link>
  )
}
