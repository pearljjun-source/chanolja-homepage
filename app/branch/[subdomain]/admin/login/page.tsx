'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database'

export default function BranchAdminLoginPage() {
  const router = useRouter()
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    fetchBranch()
    checkAuth()
  }, [subdomain])

  const fetchBranch = async () => {
    try {
      const supabase = createClient()
      const { data: allBranches } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)

      if (!allBranches) {
        setPageLoading(false)
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
    } catch (error) {
      console.error('Error fetching branch:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user && branch?.admin_email === user.email) {
      router.push(`/branch/${subdomain}/admin`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!branch) {
      setError('지점 정보를 찾을 수 없습니다.')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }

      // 로그인한 사용자가 해당 지점의 관리자인지 확인
      if (data.user && branch.admin_email) {
        if (data.user.email?.toLowerCase() === branch.admin_email.toLowerCase()) {
          router.push(`/branch/${subdomain}/admin`)
          router.refresh()
        } else {
          // 다른 계정으로 로그인 시 로그아웃
          await supabase.auth.signOut()
          setError('이 지점의 관리자 계정이 아닙니다.')
        }
      } else {
        await supabase.auth.signOut()
        setError('이 지점에 등록된 관리자가 없습니다. 본사에 문의하세요.')
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">지점을 찾을 수 없습니다</h1>
        <Link href="/" className="text-primary hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back Link */}
          <Link
            href={`/branch/${subdomain}`}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-primary text-sm mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            지점 홈페이지로
          </Link>

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <Link href={`/branch/${subdomain}`}>
              <Image
                src="/images/logo.png"
                alt="차놀자 로고"
                width={120}
                height={35}
                className="mx-auto"
              />
            </Link>
            <h1 className="text-2xl font-bold text-dark mt-6">{branch.name} 지점</h1>
            <p className="text-gray-500 mt-2">관리자 로그인</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Help */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>계정 문의: 본사 041-522-7000</p>
          </div>
        </div>
      </div>
    </div>
  )
}
