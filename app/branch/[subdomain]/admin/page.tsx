'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Car,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle, Reservation } from '@/types/database'

interface DashboardStats {
  totalVehicles: number
  availableVehicles: number
  rentedVehicles: number
  totalReservations: number
  pendingReservations: number
  confirmedReservations: number
  todayRevenue: number
  monthlyRevenue: number
}

export default function BranchAdminDashboard() {
  const params = useParams()
  const subdomain = params.subdomain as string

  const [branch, setBranch] = useState<Branch | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  })
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [subdomain])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()
      const decodedSubdomain = decodeURIComponent(subdomain)

      // 지점 정보 조회 - 모든 지점 가져와서 클라이언트에서 필터링
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

      if (!branchData) {
        setLoading(false)
        return
      }

      setBranch(branchData)

      // 차량 통계
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('branch_id', branchData.id)
        .eq('is_active', true)

      const vehicleStats = {
        totalVehicles: vehicles?.length || 0,
        availableVehicles: vehicles?.filter(v => v.status === 'available').length || 0,
        rentedVehicles: vehicles?.filter(v => v.status === 'rented').length || 0,
      }

      // 예약 통계
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*, vehicle:vehicles(*)')
        .eq('branch_id', branchData.id)
        .order('created_at', { ascending: false })

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const reservationStats = {
        totalReservations: reservations?.length || 0,
        pendingReservations: reservations?.filter(r => r.status === 'pending').length || 0,
        confirmedReservations: reservations?.filter(r => r.status === 'confirmed').length || 0,
        todayRevenue: reservations
          ?.filter(r => new Date(r.created_at) >= todayStart && r.payment_status === 'paid')
          .reduce((sum, r) => sum + r.total_price, 0) || 0,
        monthlyRevenue: reservations
          ?.filter(r => new Date(r.created_at) >= monthStart && r.payment_status === 'paid')
          .reduce((sum, r) => sum + r.total_price, 0) || 0,
      }

      setStats({
        ...vehicleStats,
        ...reservationStats,
      })

      // 최근 예약 5건
      setRecentReservations(reservations?.slice(0, 5) || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: { label: '대기', className: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      confirmed: { label: '확정', className: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3" /> },
      completed: { label: '완료', className: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { label: '취소', className: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
    }
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: null }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">대시보드</h1>
        <p className="text-gray-500">지점 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">전체 차량</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.totalVehicles}</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-600">대여가능 {stats.availableVehicles}</span>
            <span className="text-blue-600">대여중 {stats.rentedVehicles}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">전체 예약</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.totalReservations}</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-yellow-600">대기 {stats.pendingReservations}</span>
            <span className="text-blue-600">확정 {stats.confirmedReservations}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">오늘 매출</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.todayRevenue.toLocaleString()}원</p>
          <p className="mt-2 text-sm text-gray-500">결제 완료 기준</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">이번 달 매출</span>
          </div>
          <p className="text-3xl font-bold text-dark">{stats.monthlyRevenue.toLocaleString()}원</p>
          <p className="mt-2 text-sm text-gray-500">결제 완료 기준</p>
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-dark">최근 예약</h2>
          <Link
            href={`/branch/${subdomain}/admin/reservations`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            전체보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentReservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>아직 예약이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentReservations.map((reservation) => (
              <div key={reservation.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-dark">
                        {(reservation.vehicle as Vehicle)?.name || '차량 정보 없음'}
                      </span>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {reservation.customer_name} · {reservation.customer_phone}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(reservation.start_date).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(reservation.end_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {reservation.total_price.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(reservation.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <Link
          href={`/branch/${subdomain}/admin/vehicles/new`}
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-primary/10 rounded-lg">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-dark">새 차량 등록</h3>
            <p className="text-sm text-gray-500">차량을 추가합니다</p>
          </div>
        </Link>

        <Link
          href={`/branch/${subdomain}/admin/reservations?status=pending`}
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-yellow-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-medium text-dark">대기 중인 예약</h3>
            <p className="text-sm text-gray-500">{stats.pendingReservations}건 확인 필요</p>
          </div>
        </Link>

        <Link
          href={`/branch/${subdomain}`}
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-dark">지점 홈페이지</h3>
            <p className="text-sm text-gray-500">고객 화면 확인</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
