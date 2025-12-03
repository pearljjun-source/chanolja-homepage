'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Car, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Vehicle, Branch } from '@/types/database'

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

const fuelTypeLabels: Record<string, string> = {
  gasoline: '가솔린',
  diesel: '디젤',
  lpg: 'LPG',
  electric: '전기',
  hybrid: '하이브리드'
}

const transmissionLabels: Record<string, string> = {
  automatic: '자동',
  manual: '수동'
}

export default function VehicleDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVehicle()
  }, [id])

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${id}`)
      const result = await response.json()

      if (result.success) {
        setVehicle(result.data)
      } else {
        alert('차량을 찾을 수 없습니다.')
        router.push('/admin/vehicles')
      }
    } catch (error) {
      console.error('Failed to fetch vehicle:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 차량을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        alert('차량이 삭제되었습니다.')
        router.push('/admin/vehicles')
      } else {
        alert(result.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!vehicle) {
    return null
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/vehicles"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark">{vehicle.name}</h1>
            <p className="text-gray-500">{vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/vehicles/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {vehicle.thumbnail_url ? (
                <Image
                  src={vehicle.thumbnail_url}
                  alt={vehicle.name}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Car className="w-24 h-24 text-gray-300" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-6">차량 정보</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">차량번호</p>
                <p className="font-medium text-dark">{vehicle.license_plate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">차량 유형</p>
                <p className="font-medium text-dark">{vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">색상</p>
                <p className="font-medium text-dark">{vehicle.color || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">좌석수</p>
                <p className="font-medium text-dark">{vehicle.seats}인승</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">연료</p>
                <p className="font-medium text-dark">{vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">변속기</p>
                <p className="font-medium text-dark">{vehicle.transmission ? transmissionLabels[vehicle.transmission] : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">주행거리</p>
                <p className="font-medium text-dark">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()}km` : '-'}</p>
              </div>
            </div>
          </div>

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">옵션/특징</h2>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {vehicle.description && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">상세 설명</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Price */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-dark">상태</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[vehicle.status]?.color}`}>
                {statusLabels[vehicle.status]?.label}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">일 요금</p>
                <p className="text-2xl font-bold text-primary">{vehicle.price_per_day.toLocaleString()}원</p>
              </div>
              {vehicle.price_per_hour && (
                <div>
                  <p className="text-sm text-gray-500">시간 요금</p>
                  <p className="text-lg font-medium text-dark">{vehicle.price_per_hour.toLocaleString()}원</p>
                </div>
              )}
              {vehicle.deposit > 0 && (
                <div>
                  <p className="text-sm text-gray-500">보증금</p>
                  <p className="text-lg font-medium text-dark">{vehicle.deposit.toLocaleString()}원</p>
                </div>
              )}
            </div>
          </div>

          {/* Branch Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">소속 지점</h2>
            <p className="font-medium text-dark">{(vehicle.branch as Branch)?.name || '-'}</p>
            <p className="text-sm text-gray-500">{(vehicle.branch as Branch)?.region}</p>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-dark mb-4">등록 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">등록일</span>
                <span className="text-dark">{new Date(vehicle.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">수정일</span>
                <span className="text-dark">{new Date(vehicle.updated_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
