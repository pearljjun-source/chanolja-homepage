'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  MapPin,
  Search,
  Users,
  Fuel,
  ChevronRight,
  SlidersHorizontal,
  X,
  Locate,
  ChevronDown,
  Sparkles,
  Shield,
  Clock,
  Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle } from '@/types/database'

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

const vehicleTypeOptions = [
  { value: 'all', label: '전체' },
  { value: 'sedan', label: '세단' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: '승합' },
  { value: 'truck', label: '트럭' },
  { value: 'camper', label: '캠핑카' },
  { value: 'luxury', label: '고급' },
]

const priceRangeOptions = [
  { value: 'all', label: '전체 가격' },
  { value: '0-50000', label: '5만원 이하' },
  { value: '50000-100000', label: '5~10만원' },
  { value: '100000-150000', label: '10~15만원' },
  { value: '150000-999999', label: '15만원 이상' },
]

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function ReservationSection() {
  const [location, setLocation] = useState('')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [nearbyBranches, setNearbyBranches] = useState<(Branch & { distance?: number })[]>([])
  const [vehicles, setVehicles] = useState<(Vehicle & { branch?: Branch })[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<(Vehicle & { branch?: Branch })[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  const [vehicleType, setVehicleType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vehicles, vehicleType, priceRange])

  const fetchBranches = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)

      if (data) {
        setBranches(data)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('브라우저가 위치 서비스를 지원하지 않습니다.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setUserCoords({ lat: latitude, lng: longitude })
        setLocation('현재 위치')
        findNearbyBranches(latitude, longitude)
        setIsLocating(false)
      },
      (error) => {
        console.error('위치 오류:', error)
        alert('위치를 가져올 수 없습니다. 위치를 직접 입력해주세요.')
        setIsLocating(false)
      }
    )
  }

  const findNearbyBranches = (lat: number, lng: number) => {
    const branchesWithDistance = branches
      .filter(b => b.latitude && b.longitude)
      .map(branch => ({
        ...branch,
        distance: calculateDistance(lat, lng, branch.latitude!, branch.longitude!)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)

    setNearbyBranches(branchesWithDistance)

    if (branchesWithDistance.length > 0) {
      fetchVehiclesFromBranches(branchesWithDistance.map(b => b.id))
    }
  }

  const handleLocationSearch = async () => {
    if (!location.trim()) {
      alert('위치를 입력해주세요.')
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const matchingBranches = branches.filter(b =>
        b.name.includes(location) ||
        b.region?.includes(location) ||
        b.address?.includes(location)
      )

      if (matchingBranches.length > 0) {
        setNearbyBranches(matchingBranches.slice(0, 3))
        await fetchVehiclesFromBranches(matchingBranches.map(b => b.id))
      } else {
        await fetchVehiclesFromBranches(branches.map(b => b.id))
        setNearbyBranches([])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehiclesFromBranches = async (branchIds: string[]) => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('vehicles')
        .select('*, branch:branches(*)')
        .in('branch_id', branchIds)
        .eq('is_active', true)
        .eq('status', 'available')
        .order('price_per_day', { ascending: true })
        .limit(12)

      if (data) {
        setVehicles(data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...vehicles]

    if (vehicleType !== 'all') {
      filtered = filtered.filter(v => v.vehicle_type === vehicleType)
    }

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      filtered = filtered.filter(v => v.price_per_day >= min && v.price_per_day <= max)
    }

    setFilteredVehicles(filtered)
  }

  const clearFilters = () => {
    setVehicleType('all')
    setPriceRange('all')
  }

  const hasActiveFilters = vehicleType !== 'all' || priceRange !== 'all'

  return (
    <section className="relative py-4 lg:py-6 overflow-hidden bg-white">

      <div className="container-custom relative z-10 px-4">
        {/* 통합 예약 박스 */}
        <div className="relative">
          {/* 메인 카드 */}
          <div className="bg-slate-100 rounded-xl shadow-lg p-3 lg:p-5 border border-slate-200">
            {/* 한 줄 레이아웃 */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              {/* 타이틀 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full w-fit">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">전국 120개 지점</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
                  가까운 지점에서 <span className="text-primary">차량 예약</span>
                </h2>
              </div>

              {/* 검색 바 */}
              <div className="flex flex-1 flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                    placeholder="지역명, 주소 입력"
                    className="w-full pl-9 pr-3 py-2.5 lg:py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary text-sm text-slate-800 placeholder-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2.5 lg:py-2 bg-white border border-slate-300 rounded-lg hover:border-primary transition-all text-slate-600 text-sm whitespace-nowrap"
                  >
                    <Locate className={`w-4 h-4 ${isLocating ? 'animate-pulse text-primary' : ''}`} />
                    <span className="hidden sm:inline">{isLocating ? '확인 중' : '현재 위치'}</span>
                    <span className="sm:hidden">{isLocating ? '확인중' : '위치'}</span>
                  </button>
                  <button
                    onClick={handleLocationSearch}
                    disabled={loading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-5 py-2.5 lg:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-sm font-semibold whitespace-nowrap"
                  >
                    <Search className="w-4 h-4" />
                    <span>검색</span>
                  </button>
                </div>
              </div>

              {/* 필터 버튼 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors text-sm shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>필터</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 필터 옵션 (펼치면 표시) */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex-1">
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary text-sm text-slate-700"
                  >
                    {vehicleTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary text-sm text-slate-700"
                  >
                    {priceRangeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 px-3"
                  >
                    <X className="w-3 h-3" />
                    초기화
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 검색 결과 */}
        {searched && (
          <div className="mt-6 lg:mt-10">
            {/* 가까운 지점 표시 */}
            {nearbyBranches.length > 0 && (
              <div className="mb-4 lg:mb-6 flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 text-xs lg:text-sm">가까운 지점:</span>
                {nearbyBranches.map((b, i) => (
                  <Link
                    key={b.id}
                    href={`/branch/${b.subdomain || b.name}`}
                    className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-100 hover:bg-primary/10 rounded-full text-slate-700 text-xs lg:text-sm transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    {b.name}
                    {b.distance && <span className="text-slate-400">({b.distance.toFixed(1)}km)</span>}
                  </Link>
                ))}
              </div>
            )}

            {/* 로딩 */}
            {loading && (
              <div className="flex justify-center py-10 lg:py-16">
                <div className="flex flex-col items-center gap-3 lg:gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-slate-500 text-sm lg:text-base">차량을 검색하고 있습니다...</p>
                </div>
              </div>
            )}

            {/* 차량 목록 */}
            {!loading && filteredVehicles.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <p className="text-slate-700">
                    <span className="text-xl lg:text-2xl font-bold text-primary">{filteredVehicles.length}</span>
                    <span className="text-slate-500 ml-1 lg:ml-2 text-sm lg:text-base">대의 차량을 찾았습니다</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
                  {filteredVehicles.map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      href={`/reservation?vehicle_id=${vehicle.id}&branch_id=${vehicle.branch_id}`}
                      className="group bg-white border border-slate-200 rounded-xl lg:rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                        {vehicle.thumbnail_url ? (
                          <Image
                            src={vehicle.thumbnail_url}
                            alt={vehicle.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-8 h-8 lg:w-12 lg:h-12 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 lg:top-3 lg:left-3">
                          <span className="px-1.5 lg:px-2.5 py-0.5 lg:py-1 bg-primary text-white text-[10px] lg:text-xs font-semibold rounded-md lg:rounded-lg">
                            {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-3 lg:p-4">
                        <p className="font-bold text-slate-800 text-sm lg:text-lg mb-0.5 lg:mb-1 truncate">{vehicle.name}</p>
                        <p className="text-xs lg:text-sm text-slate-500 mb-2 lg:mb-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                          {(vehicle.branch as Branch)?.name}
                        </p>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 mb-3 lg:mb-4">
                          <span className="flex items-center gap-1 px-1.5 lg:px-2 py-0.5 lg:py-1 bg-slate-100 rounded-md lg:rounded-lg">
                            <Users className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            {vehicle.seats}인승
                          </span>
                          <span className="flex items-center gap-1 px-1.5 lg:px-2 py-0.5 lg:py-1 bg-slate-100 rounded-md lg:rounded-lg">
                            <Fuel className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                            {fuelTypeLabels[vehicle.fuel_type || ''] || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg lg:text-2xl font-bold text-primary">{vehicle.price_per_day.toLocaleString()}</span>
                            <span className="text-slate-400 text-[10px] lg:text-sm ml-0.5 lg:ml-1">원/일</span>
                          </div>
                          <span className="hidden sm:flex items-center gap-1 text-primary text-xs lg:text-sm font-medium group-hover:translate-x-1 transition-transform">
                            예약
                            <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 더보기 */}
                <div className="text-center mt-6 lg:mt-10">
                  <Link
                    href="/reservation"
                    className="inline-flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-semibold text-sm lg:text-base group shadow-lg shadow-primary/20"
                  >
                    전체 차량 보기
                    <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            )}

            {/* 결과 없음 */}
            {!loading && searched && filteredVehicles.length === 0 && (
              <div className="text-center py-10 lg:py-16 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl">
                <Car className="w-14 h-14 lg:w-20 lg:h-20 text-slate-300 mx-auto mb-3 lg:mb-4" />
                <p className="text-slate-500 text-sm lg:text-lg mb-3 lg:mb-4 px-4">
                  {hasActiveFilters
                    ? '조건에 맞는 차량이 없습니다. 필터를 조정해보세요.'
                    : '해당 지역에 이용 가능한 차량이 없습니다.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-primary hover:underline font-medium text-sm lg:text-base"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 검색 전 안내 */}
        {!searched && (
          <div className="mt-3 lg:mt-4 text-center py-3 lg:py-4">
            <p className="text-slate-400 text-xs lg:text-sm">
              위치를 입력하거나 현재 위치를 사용하여 가까운 차량을 찾아보세요
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
