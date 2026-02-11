'use client'

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'

export default function FloatingKakaoChat() {
  const [isVisible, setIsVisible] = useState(false)
  const channelId = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID

  useEffect(() => {
    // 페이지 로드 후 살짝 딜레이를 주고 표시
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!channelId) return null

  const chatUrl = `https://pf.kakao.com/${channelId}/chat`

  return (
    <a
      href={chatUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed right-4 bottom-24 lg:bottom-8 z-40 flex items-center gap-2 bg-[#FEE500] text-[#3C1E1E] px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      aria-label="카카오톡 상담"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.96 3.4-.99 3.63 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.13.12 1.72.12 5.52 0 10-3.58 10-7.81C22 6.58 17.52 3 12 3z" />
      </svg>
      <span className="text-sm font-bold hidden sm:inline">카톡 상담</span>
    </a>
  )
}
