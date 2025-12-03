'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Car,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle } from '@/types/database'

interface VehicleInsurance {
  id: string
  insurance_company: string
  insurance_type: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface VehicleWithInsurance extends Omit<Vehicle, 'insurance'> {
  insurance?: VehicleInsurance[]
}

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

// 보험 상태 확인 함수
const getInsuranceStatus = (insurance?: VehicleInsurance[]) => {
  if (!insurance || insurance.length === 0) {
    return { status: 'none', label: '미가입', color: 'bg-gray-100 text-gray-600' }
  }

  const activeInsurance = insurance.find(ins => ins.is_active)
  if (!activeInsurance) {
    return { status: 'expired', label: '만료', color: 'bg-red-100 text-red-700' }
  }

  const endDate = new Date(activeInsurance.end_date)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) {
    return { status: 'expired', label: '만료', color: 'bg-red-100 text-red-700' }
  }
  if (daysUntilExpiry <= 30) {
    return { status: 'expiring', label: `${daysUntilExpiry}일 후 만료`, color: 'bg-yellow-100 text-yellow-700' }
  }
  return { status: 'active', label: '가입', color: 'bg-green-100 text-green-700' }
}

export default function BranchVehiclesPage() {
  const params = useParams()
  const subdomain = params.subdomain as string

  const [branch, setBranch] = useState<Branch | null>(null)
  const [vehicles, setVehicles] = useState<VehicleWithInsurance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [subdomain])

  const fetchData = async () => {
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

      // 차량 목록 조회 (보험 정보 포함)
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select(`
          *,
          insurance:vehicle_insurances(*)
        `)
        .eq('branch_id', branchData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (vehiclesData) {
        setVehicles(vehiclesData as VehicleWithInsurance[])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 차량을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        setVehicles(vehicles.filter(v => v.id !== id))
        alert('차량이 삭제되었습니다.')
      } else {
        alert(result.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
    setActiveMenu(null)
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter
    const matchesType = typeFilter === 'all' || vehicle.vehicle_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

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
          <h1 className="text-2xl font-bold text-dark">차량 관리</h1>
          <p className="text-gray-500">총 {vehicles.length}대의 차량</p>
        </div>
        <Link
          href={`/branch/${subdomain}/admin/vehicles/new`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          차량 등록
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="차량명, 차량번호, 브랜드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">전체 상태</option>
            <option value="available">대여가능</option>
            <option value="rented">대여중</option>
            <option value="maintenance">정비중</option>
            <option value="reserved">예약됨</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">전체 유형</option>
            <option value="sedan">세단</option>
            <option value="suv">SUV</option>
            <option value="van">승합</option>
            <option value="truck">트럭</option>
            <option value="camper">캠핑카</option>
            <option value="luxury">고급</option>
          </select>
        </div>
      </div>

      {/* Vehicles List */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark mb-2">등록된 차량이 없습니다</h3>
          <p className="text-gray-500 mb-6">새 차량을 등록해보세요</p>
          <Link
            href={`/branch/${subdomain}/admin/vehicles/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            차량 등록하기
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">차량</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden md:table-cell">차량번호</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden lg:table-cell">유형</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden md:table-cell">보험</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">일 요금</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {vehicle.thumbnail_url ? (
                            <Image
                              src={vehicle.thumbnail_url}
                              alt={vehicle.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-dark">{vehicle.name}</p>
                          <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-700">{vehicle.license_plate || '-'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-700">
                        {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[vehicle.status]?.color}`}>
                        {statusLabels[vehicle.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {(() => {
                        const insuranceStatus = getInsuranceStatus(vehicle.insurance)
                        return (
                          <div className="flex items-center gap-1">
                            {insuranceStatus.status === 'active' && <ShieldCheck className="w-4 h-4 text-green-600" />}
                            {insuranceStatus.status === 'expiring' && <ShieldAlert className="w-4 h-4 text-yellow-600" />}
                            {insuranceStatus.status === 'expired' && <ShieldAlert className="w-4 h-4 text-red-600" />}
                            {insuranceStatus.status === 'none' && <Shield className="w-4 h-4 text-gray-400" />}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${insuranceStatus.color}`}>
                              {insuranceStatus.label}
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-dark">
                        {vehicle.price_per_day.toLocaleString()}원
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === vehicle.id ? null : vehicle.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>

                        {activeMenu === vehicle.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border z-20">
                              <Link
                                href={`/branch/${subdomain}/admin/vehicles/${vehicle.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                수정
                              </Link>
                              <button
                                onClick={() => handleDelete(vehicle.id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                              >
                                <Trash2 className="w-4 h-4" />
                                삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
