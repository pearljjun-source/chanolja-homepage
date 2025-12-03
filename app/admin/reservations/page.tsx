'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Search,
  Eye,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Phone
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Reservation, Branch, Vehicle } from '@/types/database'

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: '결제완료', color: 'bg-green-100 text-green-800' },
  in_use: { label: '이용중', color: 'bg-purple-100 text-purple-800' },
  completed: { label: '완료', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-800' }
}

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  unpaid: { label: '미결제', color: 'bg-red-100 text-red-800' },
  partial: { label: '부분결제', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '결제완료', color: 'bg-green-100 text-green-800' },
  refunded: { label: '환불', color: 'bg-gray-100 text-gray-800' }
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [page, selectedBranch, selectedStatus])

  const fetchBranches = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setBranches(data)
  }

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      if (selectedBranch) params.append('branch_id', selectedBranch)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/reservations?${params}`)
      const result = await response.json()

      if (result.success) {
        setReservations(result.data || [])
        setTotalPages(result.totalPages || 1)
        setTotal(result.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, action: string, cancelReason?: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, cancel_reason: cancelReason })
      })
      const result = await response.json()

      if (result.success) {
        alert(result.message)
        fetchReservations()
      } else {
        alert(result.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleApprove = (id: string) => {
    if (confirm('이 예약을 승인하시겠습니까?')) {
      handleStatusChange(id, 'approve')
    }
  }

  const handleCancel = (id: string) => {
    const reason = prompt('취소 사유를 입력하세요:')
    if (reason !== null) {
      handleStatusChange(id, 'cancel', reason)
    }
  }

  const handleComplete = (id: string) => {
    if (confirm('이 예약을 완료 처리하시겠습니까?')) {
      handleStatusChange(id, 'complete')
    }
  }

  const filteredReservations = reservations.filter(reservation =>
    reservation.customer_name.includes(searchTerm) ||
    reservation.customer_phone.includes(searchTerm) ||
    reservation.reservation_number?.includes(searchTerm)
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">예약 관리</h1>
          <p className="text-gray-500">전체 {total}건의 예약</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid sm:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="고객명, 연락처, 예약번호 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">전체 지점</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="approved">승인됨</option>
            <option value="confirmed">결제완료</option>
            <option value="in_use">이용중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>예약이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">예약번호</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">고객정보</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">차량/지점</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">대여기간</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">금액</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-primary">
                          {reservation.reservation_number}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(reservation.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-dark">{reservation.customer_name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {reservation.customer_phone}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {(reservation.vehicle as Vehicle)?.name || '-'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(reservation.branch as Branch)?.name || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {reservation.start_date} ~ {reservation.end_date}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reservation.start_time} - {reservation.end_time}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-dark">
                          {reservation.total_price.toLocaleString()}원
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${paymentStatusLabels[reservation.payment_status]?.color}`}>
                          {paymentStatusLabels[reservation.payment_status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[reservation.status]?.color}`}>
                          {statusLabels[reservation.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/reservations/${reservation.id}`}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {reservation.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(reservation.id)}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="승인"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(reservation.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="취소"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {reservation.status === 'approved' && reservation.payment_status === 'unpaid' && (
                            <Link
                              href={`/admin/reservations/${reservation.id}/payment`}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="결제요청"
                            >
                              <CreditCard className="w-4 h-4" />
                            </Link>
                          )}

                          {(reservation.status === 'confirmed' || reservation.status === 'in_use') && (
                            <button
                              onClick={() => handleComplete(reservation.id)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="완료처리"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  총 {total}건 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
