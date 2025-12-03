'use client'

import { useState, useEffect } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Car,
  Calendar,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  MessageSquare,
  Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database'
import type { User } from '@supabase/supabase-js'

const navigation = [
  { name: '대시보드', href: '', icon: LayoutDashboard },
  { name: '차량 관리', href: '/vehicles', icon: Car },
  { name: '보험 관리', href: '/insurances', icon: Shield },
  { name: '예약 관리', href: '/reservations', icon: Calendar },
  { name: '후기 관리', href: '/reviews', icon: MessageSquare },
  { name: '설정', href: '/settings', icon: Settings },
]

export default function BranchAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const [branch, setBranch] = useState<Branch | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // 로그인 페이지인지 확인
  const isLoginPage = pathname.endsWith('/login')

  useEffect(() => {
    fetchBranchAndCheckAuth()
  }, [subdomain, pathname])

  const fetchBranchAndCheckAuth = async () => {
    try {
      const supabase = createClient()
      const decodedSubdomain = decodeURIComponent(subdomain)

      // 지점 정보 조회
      const { data: allBranches, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)

      if (error || !allBranches) {
        setLoading(false)
        setAuthChecked(true)
        return
      }

      let branchData = allBranches.find(b => b.subdomain === decodedSubdomain)
      if (!branchData) {
        branchData = allBranches.find(b => b.name === decodedSubdomain)
      }
      if (!branchData) {
        branchData = allBranches.find(b => b.name.includes(decodedSubdomain))
      }

      if (branchData) {
        setBranch(branchData)
      }

      // 로그인 상태 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // 로그인 페이지가 아닌데 로그인 안 되어 있으면 로그인 페이지로 이동
      if (!isLoginPage && branchData) {
        if (!currentUser) {
          router.push(`/branch/${subdomain}/admin/login`)
        } else if (branchData.admin_email && currentUser.email?.toLowerCase() !== branchData.admin_email.toLowerCase()) {
          // 로그인은 했지만 해당 지점 관리자가 아닌 경우
          await supabase.auth.signOut()
          router.push(`/branch/${subdomain}/admin/login`)
        }
      }
    } catch (error) {
      console.error('Error fetching branch:', error)
    } finally {
      setLoading(false)
      setAuthChecked(true)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/branch/${subdomain}/admin/login`)
  }

  const basePath = `/branch/${subdomain}/admin`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">지점을 찾을 수 없습니다</h1>
        <Link href="/" className="text-primary hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  // 로그인 페이지는 레이아웃 없이 children만 렌더링
  if (isLoginPage) {
    return <>{children}</>
  }

  // 인증 체크 완료 전이거나 로그인 안 된 상태면 로딩 표시
  if (!authChecked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-dark text-sm">{branch.name}</span>
                <p className="text-xs text-gray-500">관리자</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const href = `${basePath}${item.href}`
              const isActive = pathname === href || (item.href !== '' && pathname.startsWith(href))
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom links */}
          <div className="p-3 border-t space-y-1">
            <Link
              href={`/branch/${subdomain}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              지점 홈페이지로
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-bold text-dark lg:hidden">{branch.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                {branch.region}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
