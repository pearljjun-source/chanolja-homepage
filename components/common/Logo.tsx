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
      <Image
        src="/images/logo.png"
        alt="차놀자 로고"
        width={width}
        height={height}
        priority
        className="h-auto w-auto"
      />
    </Link>
  )
}
