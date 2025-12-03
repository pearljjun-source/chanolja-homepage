'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Car,
  Phone,
  Users,
  Fuel,
  Settings2,
  Check,
  ExternalLink,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle } from '@/types/database'

const fuelTypeLabels: Record<string, string> = {
  gasoline: '가솔린',
  diesel: '디젤',
  lpg: 'LPG',
  electric: '전기',
  hybrid: '하이브리드'
}

const vehicleTypeLabels: Record<string, string> = {
  sedan: '세단',
  suv: 'SUV',
  van: '승합',
  truck: '트럭',
  camper: '캠핑카',
  luxury: '고급'
}

export default function VehicleDetailPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)
  const vehicleId = params.id as string

  const [branch, setBranch] = useState<Branch | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [decodedSubdomain, vehicleId])

  const fetchData = async () => {
    try {
      // API를 통해 차량 정보 조회 (보험 정보 포함)
      const response = await fetch(`/api/vehicles/${vehicleId}`)
      const result = await response.json()

      if (result.success && result.data) {
        setVehicle(result.data)

        // 지점 정보가 API 응답에 포함되어 있으면 사용
        if (result.data.branch) {
          setBranch(result.data.branch)
        } else {
          // 없으면 별도로 조회
          const supabase = createClient()
          const { data: allBranches } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true)

          if (allBranches) {
            let branchData = allBranches.find(b => b.subdomain === decodedSubdomain)
            if (!branchData) {
              branchData = allBranches.find(b => b.name === decodedSubdomain)
            }
            if (!branchData) {
              branchData = allBranches.find(b => b.name.includes(decodedSubdomain))
            }
            if (branchData) {
              setBranch(branchData)
            }
          }
        }
      } else {
        console.error('Error fetching vehicle:', result.error)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 본사 예약 페이지 URL 생성 (차량 및 지점 정보 포함)
  const getReservationUrl = () => {
    const params = new URLSearchParams()
    if (branch) params.set('branch_id', branch.id)
    if (vehicle) params.set('vehicle_id', vehicle.id)
    return `/reservation?${params.toString()}`
  }

  // 모든 이미지 (thumbnail + images 배열)
  const allImages = vehicle ? [
    ...(vehicle.thumbnail_url ? [vehicle.thumbnail_url] : []),
    ...(vehicle.images || []).filter(img => img !== vehicle.thumbnail_url)
  ] : []

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)
  }

  const openGallery = (index: number) => {
    setCurrentImageIndex(index)
    setIsGalleryOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!vehicle || !branch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Car className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">차량을 찾을 수 없습니다</h1>
        <p className="text-gray-500 mb-4">요청하신 차량 정보를 찾을 수 없습니다.</p>
        <Link href={`/branch/${decodedSubdomain}`} className="text-primary hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 전체화면 갤러리 모달 */}
      {isGalleryOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 text-white rounded-full">
            {currentImageIndex + 1} / {allImages.length}
          </div>

          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4">
            <Image
              src={allImages[currentImageIndex]}
              alt={`${vehicle?.name} ${currentImageIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {/* 하단 썸네일 */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden ${
                    currentImageIndex === index ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`썸네일 ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href={`/branch/${subdomain}`}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-dark">{branch.name}</h1>
                <p className="text-xs text-gray-500">차량 상세</p>
              </div>
            </div>
            <a
              href={`tel:${branch.phone}`}
              className="flex items-center gap-2 text-gray-600 hover:text-primary"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">{branch.phone}</span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Vehicle Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 메인 이미지 */}
              <div className="aspect-video bg-gray-100 relative cursor-pointer" onClick={() => allImages.length > 0 && openGallery(currentImageIndex)}>
                {allImages.length > 0 ? (
                  <>
                    <Image
                      src={allImages[currentImageIndex]}
                      alt={vehicle.name}
                      fill
                      className="object-cover"
                    />
                    {/* 이미지 네비게이션 */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                          {currentImageIndex + 1} / {allImages.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-24 h-24 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
                    {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                  </span>
                </div>
              </div>

              {/* 썸네일 그리드 */}
              {allImages.length > 1 && (
                <div className="p-4 border-t">
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {allImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden ${
                          currentImageIndex === index ? 'ring-2 ring-primary' : 'ring-1 ring-gray-200'
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${vehicle.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-dark mb-2">{vehicle.name}</h2>
              <p className="text-gray-500 mb-6">
                {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-500">좌석</p>
                  <p className="font-bold text-dark">{vehicle.seats}인승</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Fuel className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-500">연료</p>
                  <p className="font-bold text-dark">{vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Settings2 className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-500">변속기</p>
                  <p className="font-bold text-dark">{vehicle.transmission === 'automatic' ? '자동' : '수동'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Car className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-500">색상</p>
                  <p className="font-bold text-dark">{vehicle.color || '-'}</p>
                </div>
              </div>

              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div>
                  <h3 className="font-bold text-dark mb-3">차량 옵션</h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                      >
                        <Check className="w-4 h-4" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {vehicle.description && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-dark mb-3">상세 설명</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{vehicle.description}</p>
                </div>
              )}
            </div>

            {/* Branch Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-dark mb-4">지점 정보</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-dark">{branch.name}</p>
                    <p className="text-gray-500 text-sm">{branch.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${branch.phone}`} className="text-primary hover:underline">
                    {branch.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-600">연중무휴 09:00 - 21:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              {/* Price */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">일일 대여료</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-primary">
                    {vehicle.price_per_day.toLocaleString()}
                  </span>
                  <span className="text-gray-500">원</span>
                </div>
                {vehicle.deposit > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    보증금: {vehicle.deposit.toLocaleString()}원
                  </p>
                )}
              </div>

              {/* Reservation Button - Link to HQ */}
              <Link
                href={getReservationUrl()}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                예약하기
                <ExternalLink className="w-5 h-5" />
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                차놀자 통합 예약 시스템으로 이동합니다
              </p>

              {/* Quick Contact */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-3">빠른 상담</p>
                <a
                  href={`tel:${branch.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  전화 문의
                </a>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>안내:</strong> 예약 완료 후 지점에서 확인 연락을 드립니다.
                  운전면허증을 지참해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-bold text-white">{branch.name}</p>
              <p className="text-sm">{branch.address}</p>
            </div>
            <div className="text-sm">
              <p>© 2024 차놀자. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
