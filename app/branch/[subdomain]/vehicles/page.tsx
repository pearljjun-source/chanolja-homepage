'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  Users,
  Fuel,
  Settings2,
  ChevronRight,
  Phone,
  ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle } from '@/types/database'

interface VehicleWithInsurance extends Omit<Vehicle, 'insurance'> {
  insurance?: {
    id: string
    is_active: boolean
    end_date: string
  }[]
}

const vehicleTypeLabels: Record<string, string> = {
  sedan: '세단',
  suv: 'SUV',
  van: '승합',
  truck: '트럭',
  camper: '캠핑카',
  luxury: '고급'
}

const fuelTypeLabels: Record<string, string> = {
  gasoline: '가솔린',
  diesel: '디젤',
  lpg: 'LPG',
  electric: '전기',
  hybrid: '하이브리드'
}

// 보험 가입 여부 확인
const hasActiveInsurance = (insurance?: VehicleWithInsurance['insurance']) => {
  if (!insurance || insurance.length === 0) return false
  const activeInsurance = insurance.find(ins => ins.is_active)
  if (!activeInsurance) return false
  return new Date(activeInsurance.end_date) >= new Date()
}

export default function BranchVehiclesPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [vehicles, setVehicles] = useState<VehicleWithInsurance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchBranchData()
  }, [subdomain])

  const fetchBranchData = async () => {
    try {
      const supabase = createClient()
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

      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select(`
          *,
          insurance:vehicle_insurances(id, is_active, end_date)
        `)
        .eq('branch_id', branchData.id)
        .eq('is_active', true)
        .order('price_per_day', { ascending: true })

      if (vehiclesData) {
        setVehicles(vehiclesData as VehicleWithInsurance[])
      }
    } catch (error) {
      console.error('Error fetching branch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVehicles = selectedType === 'all'
    ? vehicles
    : vehicles.filter(v => v.vehicle_type === selectedType)

  const vehicleTypes = ['all', ...new Set(vehicles.map(v => v.vehicle_type))]

  if (loading || !branch) {
    return null
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">보유차량</h1>
          <p className="text-white/80">
            {branch.name}에서 보유한 다양한 차량을 확인하세요
          </p>
        </div>
      </section>

      {/* Filter & Vehicle List */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {vehicleTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === 'all' ? '전체' : vehicleTypeLabels[type] || type}
              </button>
            ))}
          </div>

          {/* Vehicle Count */}
          <div className="mb-6">
            <p className="text-gray-500">
              총 <span className="font-bold text-primary">{filteredVehicles.length}</span>대의 차량
            </p>
          </div>

          {/* Vehicle Grid */}
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">현재 대여 가능한 차량이 없습니다.</p>
              <p className="text-gray-400 text-sm mt-2">다른 차종을 선택하거나 전화로 문의해주세요.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/branch/${decodedSubdomain}/vehicle/${vehicle.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all group hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {vehicle.thumbnail_url ? (
                      <Image
                        src={vehicle.thumbnail_url}
                        alt={vehicle.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={85}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 bg-primary text-white text-xs font-medium rounded">
                        {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                      </span>
                      {hasActiveInsurance(vehicle.insurance) && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          보험
                        </span>
                      )}
                    </div>
                    {vehicle.status !== 'available' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">대여중</span>
                      </div>
                    )}
                    {/* 상세보기 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <span className="px-4 py-2 bg-white/90 text-primary font-semibold rounded-full text-sm">
                        상세보기
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="font-bold text-dark mb-1 group-hover:text-primary transition-colors">{vehicle.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </p>

                    {/* Specs */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{vehicle.seats}인승</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        <span>{vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings2 className="w-4 h-4" />
                        <span>{vehicle.transmission === 'automatic' ? '자동' : '수동'}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          {vehicle.price_per_day.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-sm">원/일</span>
                      </div>
                      <span className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium group-hover:bg-primary/90 transition-colors flex items-center gap-1">
                        상세보기
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">원하는 차량이 없으신가요?</h3>
            <p className="text-gray-400 mb-6">
              전화로 문의해주시면 더 많은 차량을 안내해 드립니다
            </p>
            <a
              href={`tel:${branch.phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {branch.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
