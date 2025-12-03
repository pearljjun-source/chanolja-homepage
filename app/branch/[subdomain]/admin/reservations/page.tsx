'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Car,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle, Reservation, ReservationStatus } from '@/types/database'

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '대기', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  confirmed: { label: '확정', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  completed: { label: '완료', color: 'text-green-800', bgColor: 'bg-green-100' },
  cancelled: { label: '취소', color: 'text-red-800', bgColor: 'bg-red-100' },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '미결제', color: 'text-gray-500' },
  paid: { label: '결제완료', color: 'text-green-600' },
  refunded: { label: '환불완료', color: 'text-red-600' },
}

export default function BranchReservationsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const initialStatus = searchParams.get('status') || 'all'

  const [branch, setBranch] = useState<Branch | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [subdomain])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // 지점 정보 조회
      const { data: branchData } = await supabase
        .from('branches')
        .select('*')
        .or(`subdomain.eq.${subdomain},name.ilike.%${subdomain}%`)
        .eq('is_active', true)
        .single()

      if (!branchData) {
        setLoading(false)
        return
      }

      setBranch(branchData)

      // 예약 목록 조회
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*, vehicle:vehicles(*)')
        .eq('branch_id', branchData.id)
        .order('created_at', { ascending: false })

      if (reservationsData) {
        setReservations(reservationsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    setUpdating(reservationId)

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        setReservations(prev =>
          prev.map(r =>
            r.id === reservationId ? { ...r, status: newStatus as ReservationStatus } : r
          )
        )
      } else {
        alert(result.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setUpdating(null)
    }
  }

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch =
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_phone.includes(searchTerm) ||
      (reservation.vehicle as Vehicle)?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">예약 관리</h1>
          <p className="text-gray-500">총 {reservations.length}건의 예약</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="고객명, 전화번호, 차량명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
            >
              대기중
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              확정
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              완료
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark mb-2">예약이 없습니다</h3>
          <p className="text-gray-500">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const vehicle = reservation.vehicle as Vehicle
            const isExpanded = expandedId === reservation.id

            return (
              <div
                key={reservation.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                {/* Main Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : reservation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-dark">
                            {vehicle?.name || '차량 정보 없음'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[reservation.status]?.bgColor} ${statusConfig[reservation.status]?.color}`}>
                            {getStatusIcon(reservation.status)}
                            {statusConfig[reservation.status]?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {reservation.customer_name} · {reservation.customer_phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-primary">
                          {reservation.total_price.toLocaleString()}원
                        </p>
                        <p className={`text-xs ${paymentStatusConfig[reservation.payment_status]?.color}`}>
                          {paymentStatusConfig[reservation.payment_status]?.label}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">대여 기간</p>
                        <p className="text-sm font-medium text-dark">
                          {new Date(reservation.start_date).toLocaleDateString('ko-KR')} ~{' '}
                          {new Date(reservation.end_date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">예약일</p>
                        <p className="text-sm font-medium text-dark">
                          {new Date(reservation.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">고객 연락처</p>
                        <a
                          href={`tel:${reservation.customer_phone}`}
                          className="text-sm font-medium text-primary flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {reservation.customer_phone}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">결제 금액</p>
                        <p className="text-sm font-bold text-primary">
                          {reservation.total_price.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    {reservation.admin_memo && (
                      <div className="mb-4 p-3 bg-white rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">메모</p>
                        <p className="text-sm text-gray-700">{reservation.admin_memo}</p>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="flex flex-wrap gap-2">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(reservation.id, 'confirmed')
                            }}
                            disabled={updating === reservation.id}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {updating === reservation.id ? '처리중...' : '예약 확정'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('정말 이 예약을 취소하시겠습니까?')) {
                                handleStatusChange(reservation.id, 'cancelled')
                              }
                            }}
                            disabled={updating === reservation.id}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            예약 취소
                          </button>
                        </>
                      )}
                      {reservation.status === 'confirmed' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(reservation.id, 'completed')
                            }}
                            disabled={updating === reservation.id}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {updating === reservation.id ? '처리중...' : '대여 완료'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('정말 이 예약을 취소하시겠습니까?')) {
                                handleStatusChange(reservation.id, 'cancelled')
                              }
                            }}
                            disabled={updating === reservation.id}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            예약 취소
                          </button>
                        </>
                      )}
                      {(reservation.status === 'completed' || reservation.status === 'cancelled') && (
                        <span className="text-sm text-gray-500">
                          {reservation.status === 'completed' ? '대여가 완료되었습니다.' : '취소된 예약입니다.'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
