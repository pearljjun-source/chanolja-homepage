'use client'

import Script from 'next/script'

declare global {
  interface Window {
    wcs_add: { wa: string }
    wcs: {
      inflow: (domain: string) => void
      trans: (conv: { type: string }) => void
    }
    wcs_do: () => void
    _nasa: Record<string, unknown>
  }
}

export default function NaverAnalytics() {
  return (
    <Script
      id="naver-wcslog"
      src="//wcs.naver.net/wcslog.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined' && window.wcs) {
          if (!window.wcs_add) window.wcs_add = { wa: '' }
          window.wcs_add.wa = 's_4c8ee71f4c72'
          window.wcs.inflow('xn--w80bk23b0hd.net')
          window.wcs_do()
        }
      }}
    />
  )
}
