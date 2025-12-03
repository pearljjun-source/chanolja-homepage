'use client'

import { useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Menu, X, Settings, Home, Car, MapPin, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database'

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: '홈', href: `/branch/${decodedSubdomain}`, icon: Home },
    { name: '지점소개', href: `/branch/${decodedSubdomain}/about`, icon: Info },
    { name: '보유차량', href: `/branch/${decodedSubdomain}/vehicles`, icon: Car },
    { name: '찾아오는길', href: `/branch/${decodedSubdomain}/location`, icon: MapPin },
  ]

  useEffect(() => {
    fetchBranchData()
  }, [subdomain])

  const fetchBranchData = async () => {
    try {
      const supabase = createClient()
      const { data: allBranches, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)

      if (error || !allBranches) {
        setLoading(false)
        return
      }

      let branchData = allBranches.find(b => b.subdomain === decodedSubdomain)
      if (!branchData) {
        branchData = allBranches.find(b => b.name === decodedSubdomain)
      }
      if (!branchData) {
        branchData = allBranches.find(b => b.name.includes(decodedSubdomain))
      }

      setBranch(branchData || null)
    } catch (error) {
      console.error('Error fetching branch:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (href: string) => {
    if (href === `/branch/${decodedSubdomain}`) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">지점을 찾을 수 없습니다</h1>
        <p className="text-gray-500 mb-6 text-sm">요청하신 지점 정보가 존재하지 않습니다.</p>
        <Link href="/" className="text-primary hover:underline text-sm">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - 모바일 최적화 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo & Branch Name */}
            <Link href={`/branch/${decodedSubdomain}`} className="flex items-center gap-2 md:gap-3">
              <Image
                src="/images/logo.png"
                alt="차놀자 로고"
                width={100}
                height={30}
                className="h-8 md:h-10 w-auto"
              />
              <span className="text-sm md:text-lg font-bold text-gray-800">{branch.name}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navigation.slice(1).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <a
                href={`tel:${branch.phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden lg:inline">{branch.phone}</span>
                <span className="lg:hidden">전화</span>
              </a>
            </nav>

            {/* Mobile: Phone & Menu */}
            <div className="flex items-center gap-2 md:hidden">
              <a
                href={`tel:${branch.phone}`}
                className="p-2 bg-primary text-white rounded-full"
              >
                <Phone className="w-5 h-5" />
              </a>
              <button
                className="p-2 text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-3 border-t animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 active:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
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
          <a
            href={`tel:${branch.phone}`}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-gray-400"
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px] font-medium">전화</span>
          </a>
        </div>
      </nav>

      {/* Footer - 모바일에서는 하단 네비게이션 때문에 여백 추가 */}
      <footer className="bg-gray-900 text-gray-400 py-6 md:py-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-bold text-white text-sm">{branch.name}</p>
              <p className="text-xs mt-1">{branch.address}</p>
              <p className="text-xs mt-1">TEL: {branch.phone}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <p className="text-xs">© 2024 차놀자</p>
              <Link
                href={`/branch/${decodedSubdomain}/admin`}
                className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 text-xs"
              >
                <Settings className="w-3 h-3" />
                관리
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
