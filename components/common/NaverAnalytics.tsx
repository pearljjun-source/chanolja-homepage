'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    wcs_add: { wa: string }
    wcs: {
      inflow: (domain: string) => void
      trans: (conv: { type: string }) => void
    }
    wcs_do: () => void
  }
}

export default function NaverAnalytics() {
  useEffect(() => {
    // wcslog.js 스크립트 동적 로드
    const script = document.createElement('script')
    script.src = 'https://wcs.naver.net/wcslog.js'
    script.async = true
    script.onload = () => {
      if (window.wcs) {
        if (!window.wcs_add) window.wcs_add = { wa: '' }
        window.wcs_add.wa = 's_4c8ee71f4c72'
        window.wcs.inflow('xn--w80bk23b0hd.net')
        window.wcs_do()
      }
    }
    document.head.appendChild(script)

    return () => {
      // cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}
