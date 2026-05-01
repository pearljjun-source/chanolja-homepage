'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { useActiveBranches, useVehicles } from '@/lib/hooks/use-admin-queries'
import { useQueryClient } from '@tanstack/react-query'
import { revalidateBranches } from '@/app/actions/revalidate'
import type { Branch } from '@/types/database'

const vehicleTypeLabels: Record<string, string> = {
  sedan: '세단',
  suv: 'SUV',
  van: '승합',
  truck: '트럭',
  camper: '캠핑카',
  luxury: '고급'
}

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: '대여가능', color: 'bg-green-100 text-green-800' },
  rented: { label: '대여중', color: 'bg-blue-100 text-blue-800' },
  maintenance: { label: '정비중', color: 'bg-yellow-100 text-yellow-800' },
  reserved: { label: '예약됨', color: 'bg-purple-100 text-purple-800' }
}

export default function AdminVehiclesPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: branches = [] } = useActiveBranches()
  const { data: vehicleData, isLoading: loading } = useVehicles({
    page,
    pageSize,
    branchId: selectedBranch,
    status: selectedStatus,
  })

  const vehicles = vehicleData?.data || []
  const totalPages = vehicleData?.totalPages || 1
  const total = vehicleData?.total || 0

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: '정말 이 차량을 삭제하시겠습니까?', variant: 'danger' })) return

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        toast.success('차량이 삭제되었습니다.')
        queryClient.invalidateQueries({ queryKey: ['vehicles'] })
        revalidateBranches()
      } else {
        toast.error(result.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다.')
    }
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">차량 관리</h1>
          <p className="text-gray-500">전체 {total}대의 차량</p>
        </div>
        <Link
          href="/admin/vehicles/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          차량 등록
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid sm:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="차량명, 브랜드, 차량번호 검색"
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
            <option value="available">대여가능</option>
            <option value="rented">대여중</option>
            <option value="maintenance">정비중</option>
            <option value="reserved">예약됨</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>등록된 차량이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">차량</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">지점</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">유형</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">일 요금</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {vehicle.thumbnail_url ? (
                              <Image
                                src={vehicle.thumbnail_url}
                                alt={vehicle.name}
                                width={64}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-dark">{vehicle.name}</p>
                            <p className="text-sm text-gray-500">
                              {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                            </p>
                            {vehicle.license_plate && (
                              <p className="text-xs text-gray-400">{vehicle.license_plate}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">
                          {(vehicle.branch as Branch)?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">
                          {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-dark">
                          {vehicle.price_per_day.toLocaleString()}원
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[vehicle.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[vehicle.status]?.label || vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/vehicles/${vehicle.id}`}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="상세보기"
                            aria-label="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/vehicles/${vehicle.id}/edit`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                            aria-label="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                            aria-label="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                  총 {total}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="이전 페이지"
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
                    aria-label="다음 페이지"
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
