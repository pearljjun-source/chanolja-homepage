'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { VehicleInsurance, Branch, Vehicle } from '@/types/database'

const insuranceTypeLabels: Record<string, string> = {
  comprehensive: '종합보험',
  liability_only: '책임보험'
}

export default function AdminInsurancesPage() {
  const [insurances, setInsurances] = useState<VehicleInsurance[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [showExpiringOnly, setShowExpiringOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [expiringCount, setExpiringCount] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchBranches()
    fetchExpiringCount()
  }, [])

  useEffect(() => {
    fetchInsurances()
  }, [page, selectedBranch, showExpiringOnly])

  const fetchBranches = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setBranches(data)
  }

  const fetchExpiringCount = async () => {
    try {
      const response = await fetch('/api/insurances?expiring_soon=true&page_size=100')
      const result = await response.json()
      if (result.success) {
        setExpiringCount(result.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch expiring count:', error)
    }
  }

  const fetchInsurances = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      if (selectedBranch) params.append('branch_id', selectedBranch)
      if (showExpiringOnly) params.append('expiring_soon', 'true')

      const response = await fetch(`/api/insurances?${params}`)
      const result = await response.json()

      if (result.success) {
        setInsurances(result.data || [])
        setTotalPages(result.totalPages || 1)
        setTotal(result.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch insurances:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 보험 정보를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/insurances/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        alert('보험 정보가 삭제되었습니다.')
        fetchInsurances()
      } else {
        alert(result.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryStatus = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate)
    if (days < 0) return { label: '만료됨', color: 'bg-red-100 text-red-800' }
    if (days <= 7) return { label: `${days}일 남음`, color: 'bg-red-100 text-red-800' }
    if (days <= 30) return { label: `${days}일 남음`, color: 'bg-yellow-100 text-yellow-800' }
    return { label: `${days}일 남음`, color: 'bg-green-100 text-green-800' }
  }

  const filteredInsurances = insurances.filter(insurance =>
    (insurance.vehicle as Vehicle)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (insurance.vehicle as Vehicle)?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    insurance.insurance_company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">보험 관리</h1>
          <p className="text-gray-500">전체 {total}건의 보험</p>
        </div>
        <Link
          href="/admin/insurances/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          보험 등록
        </Link>
      </div>

      {/* Warning Banner */}
      {expiringCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">
              만료 임박 보험 {expiringCount}건
            </p>
            <p className="text-sm text-yellow-600">
              30일 이내에 만료되는 보험이 있습니다. 갱신을 확인해주세요.
            </p>
          </div>
          <button
            onClick={() => setShowExpiringOnly(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            확인하기
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid sm:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="차량명, 차량번호, 보험사 검색"
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

          {/* Expiring Filter */}
          <label className="flex items-center gap-2 px-4 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showExpiringOnly}
              onChange={(e) => {
                setShowExpiringOnly(e.target.checked)
                setPage(1)
              }}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-gray-700">만료 임박만 보기</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredInsurances.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>등록된 보험이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">차량</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">지점</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">보험사</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">유형</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">보험기간</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInsurances.map((insurance) => {
                    const expiryStatus = getExpiryStatus(insurance.end_date)
                    return (
                      <tr key={insurance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-dark">
                            {(insurance.vehicle as Vehicle)?.name || '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(insurance.vehicle as Vehicle)?.license_plate || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">
                            {(insurance.branch as Branch)?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700">{insurance.insurance_company}</p>
                          {insurance.policy_number && (
                            <p className="text-xs text-gray-400">{insurance.policy_number}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">
                            {insuranceTypeLabels[insurance.insurance_type] || insurance.insurance_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700">
                            {insurance.start_date} ~ {insurance.end_date}
                          </p>
                          {insurance.annual_premium && (
                            <p className="text-xs text-gray-400">
                              연 {insurance.annual_premium.toLocaleString()}원
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                            {expiryStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/insurances/${insurance.id}`}
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/insurances/${insurance.id}/edit`}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="수정"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(insurance.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
