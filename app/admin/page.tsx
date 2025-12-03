'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, MapPin, MessageSquare, TrendingUp, Car, Calendar, CreditCard, Shield, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const typeLabels: Record<string, string> = {
  branch: '지점 개설',
  corporation: '법인 설립',
  camping: '캠핑카 사업',
  other: '기타 문의',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    newsCount: 0,
    branchCount: 0,
    unreadInquiries: 0,
    vehicleCount: 0,
    pendingReservations: 0,
    monthlyRevenue: 0,
    expiringInsurances: 0,
  })
  const [recentInquiries, setRecentInquiries] = useState<any[]>([])
  const [recentNews, setRecentNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()

    // Fetch news count
    const { count: newsCount } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true })

    // Fetch branches count
    const { count: branchCount } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })

    // Fetch unread inquiries count
    const { count: unreadCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    // Fetch vehicle count
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Fetch pending reservations count
    const { count: pendingReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Fetch monthly revenue
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('paid_at', startOfMonth.toISOString())
    const monthlyRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

    // Fetch expiring insurances count
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const { count: expiringInsurances } = await supabase
      .from('vehicle_insurances')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('end_date', thirtyDaysLater.toISOString().split('T')[0])

    // Fetch recent inquiries
    const { data: inquiries } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4)

    // Fetch recent news
    const { data: news } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    setStats({
      newsCount: newsCount || 0,
      branchCount: branchCount || 0,
      unreadInquiries: unreadCount || 0,
      vehicleCount: vehicleCount || 0,
      pendingReservations: pendingReservations || 0,
      monthlyRevenue: monthlyRevenue,
      expiringInsurances: expiringInsurances || 0,
    })
    setRecentInquiries(inquiries || [])
    setRecentNews(news || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statsData = [
    {
      name: '전체 차량',
      value: stats.vehicleCount.toString(),
      icon: Car,
      color: 'bg-blue-500',
      href: '/admin/vehicles',
    },
    {
      name: '대기중 예약',
      value: stats.pendingReservations.toString(),
      icon: Calendar,
      color: 'bg-orange-500',
      href: '/admin/reservations?status=pending',
    },
    {
      name: '이번달 매출',
      value: stats.monthlyRevenue > 0 ? `${(stats.monthlyRevenue / 10000).toFixed(0)}만` : '0',
      icon: CreditCard,
      color: 'bg-green-500',
      href: '/admin/payments',
    },
    {
      name: '전체 지점',
      value: stats.branchCount.toString(),
      icon: MapPin,
      color: 'bg-purple-500',
      href: '/admin/branches',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">대시보드</h1>
        <p className="text-gray-500">차놀자 관리자 패널에 오신 것을 환영합니다.</p>
      </div>

      {/* Warning Banner */}
      {stats.expiringInsurances > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">
              만료 임박 보험 {stats.expiringInsurances}건
            </p>
            <p className="text-sm text-yellow-600">
              30일 이내에 만료되는 보험이 있습니다.
            </p>
          </div>
          <Link
            href="/admin/insurances?expiring=true"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            확인하기
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat) => (
          <Link key={stat.name} href={stat.href} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-dark">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.name}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-dark">최근 문의</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentInquiries.length > 0 ? (
              recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {!inquiry.is_read && (
                      <span className="w-2 h-2 bg-primary rounded-full" />
                    )}
                    <div>
                      <p className="font-medium text-dark">{inquiry.name}</p>
                      <p className="text-sm text-gray-500">{typeLabels[inquiry.inquiry_type] || inquiry.inquiry_type}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                문의가 없습니다.
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/admin/inquiries" className="text-primary text-sm font-medium hover:underline">
              전체 보기 →
            </Link>
          </div>
        </div>

        {/* Recent News */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-dark">최근 뉴스</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentNews.length > 0 ? (
              recentNews.map((news) => (
                <div key={news.id} className="p-4 hover:bg-gray-50">
                  <p className="font-medium text-dark mb-1 line-clamp-1">{news.title}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(news.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                등록된 뉴스가 없습니다.
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/admin/news" className="text-primary text-sm font-medium hover:underline">
              전체 보기 →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-dark mb-4">빠른 작업</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/vehicles/new"
            className="p-4 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors text-center"
          >
            <Car className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">차량 등록</p>
          </Link>
          <Link
            href="/admin/reservations"
            className="p-4 bg-orange-50 rounded-lg text-orange-600 hover:bg-orange-100 transition-colors text-center"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">예약 관리</p>
          </Link>
          <Link
            href="/admin/insurances/new"
            className="p-4 bg-green-50 rounded-lg text-green-600 hover:bg-green-100 transition-colors text-center"
          >
            <Shield className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">보험 등록</p>
          </Link>
          <Link
            href="/admin/inquiries"
            className="p-4 bg-purple-50 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors text-center"
          >
            <MessageSquare className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">문의 확인</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
