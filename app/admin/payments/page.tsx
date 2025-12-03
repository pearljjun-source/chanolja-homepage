'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  Search,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Payment, Branch } from '@/types/database'

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '완료', color: 'bg-green-100 text-green-800' },
  failed: { label: '실패', color: 'bg-red-100 text-red-800' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-800' },
  refunded: { label: '환불', color: 'bg-purple-100 text-purple-800' },
  partial_refund: { label: '부분환불', color: 'bg-orange-100 text-orange-800' }
}

const settlementLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '미정산', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '정산중', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '정산완료', color: 'bg-green-100 text-green-800' }
}

const paymentMethodLabels: Record<string, string> = {
  card: '카드',
  bank_transfer: '계좌이체',
  kakao_pay: '카카오페이',
  naver_pay: '네이버페이',
  cash: '현금'
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0
  })
  const pageSize = 10

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchPayments()
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

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      if (selectedBranch) params.append('branch_id', selectedBranch)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/payments?${params}`)
      const result = await response.json()

      if (result.success) {
        setPayments(result.data || [])
        setTotalPages(result.totalPages || 1)
        setTotal(result.total || 0)

        // Calculate stats
        const allPayments = result.data || []
        const completed = allPayments.filter((p: Payment) => p.status === 'completed')
        const pending = allPayments.filter((p: Payment) => p.status === 'pending')

        setStats({
          totalAmount: allPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0),
          completedAmount: completed.reduce((sum: number, p: Payment) => sum + p.amount, 0),
          pendingAmount: pending.reduce((sum: number, p: Payment) => sum + p.amount, 0)
        })
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (paymentId: string) => {
    const reason = prompt('환불 사유를 입력하세요:')
    if (reason === null) return

    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, refund_reason: reason })
      })
      const result = await response.json()

      if (result.success) {
        alert(result.message)
        fetchPayments()
      } else {
        alert(result.error || '환불 처리에 실패했습니다.')
      }
    } catch (error) {
      alert('환불 중 오류가 발생했습니다.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">결제 관리</h1>
        <p className="text-gray-500">전체 {total}건의 결제</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-dark">{stats.totalAmount.toLocaleString()}원</p>
          <p className="text-gray-500 text-sm">전체 결제금액</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-dark">{stats.completedAmount.toLocaleString()}원</p>
          <p className="text-gray-500 text-sm">완료된 결제</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-dark">{stats.pendingAmount.toLocaleString()}원</p>
          <p className="text-gray-500 text-sm">대기중 결제</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="거래번호 검색"
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
            <option value="pending">대기</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
            <option value="refunded">환불</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>결제 내역이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">결제일시</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">예약번호</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">지점</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">결제수단</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">금액</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">정산</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString('ko-KR')
                            : new Date(payment.created_at).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-primary">
                          {(payment as any).reservation?.reservation_number || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">
                          {(payment.branch as Branch)?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                        </p>
                        {payment.card_company && (
                          <p className="text-xs text-gray-400">
                            {payment.card_company} {payment.card_number}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-dark">
                          {payment.amount.toLocaleString()}원
                        </p>
                        {payment.refund_amount > 0 && (
                          <p className="text-xs text-red-500">
                            환불: -{payment.refund_amount.toLocaleString()}원
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[payment.status]?.color}`}>
                          {statusLabels[payment.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${settlementLabels[payment.settlement_status]?.color}`}>
                          {settlementLabels[payment.settlement_status]?.label}
                        </span>
                        {payment.settlement_amount && (
                          <p className="text-xs text-gray-400 mt-1">
                            {payment.settlement_amount.toLocaleString()}원
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/payments/${payment.id}`}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {payment.status === 'completed' && (
                            <button
                              onClick={() => handleRefund(payment.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="환불"
                            >
                              <RefreshCw className="w-4 h-4" />
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
