'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 관리자 페이지, 로그인 페이지, 지점 홈페이지에서는 헤더/푸터 숨김
  const isAdminPage = pathname?.startsWith('/admin')
  const isLoginPage = pathname === '/login'
  // /branch/[subdomain] 형태만 매칭 (본사의 /branches 페이지는 제외)
  const isBranchSitePage = pathname?.startsWith('/branch/')
  const hideHeaderFooter = isAdminPage || isLoginPage || isBranchSitePage

  // 지점 홈페이지는 완전히 독립적으로 렌더링
  if (isBranchSitePage) {
    return <>{children}</>
  }

  return (
    <div className="pb-20 lg:pb-0">
      {!hideHeaderFooter && <Header />}
      <main className="min-h-screen">
        {children}
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  )
}
