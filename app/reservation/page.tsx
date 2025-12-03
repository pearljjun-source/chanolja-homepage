'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  Fuel,
  Settings2,
  Phone,
  Mail,
  User,
  ChevronDown,
  Check,
  ArrowLeft,
  AlertCircle,
  Shield,
  Star,
  ChevronRight
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

function ReservationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialBranchId = searchParams.get('branch_id') || ''
  const initialVehicleId = searchParams.get('vehicle_id') || ''

  const [branches, setBranches] = useState<Branch[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    start_date: '',
    end_date: '',
    start_time: '10:00',
    end_time: '10:00',
    notes: ''
  })

  const [totalDays, setTotalDays] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (formData.start_date && formData.end_date && selectedVehicle) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (days > 0) {
        setTotalDays(days)
        setTotalPrice(days * selectedVehicle.price_per_day)
      } else {
        setTotalDays(0)
        setTotalPrice(0)
      }
    }
  }, [formData.start_date, formData.end_date, selectedVehicle])

  const fetchInitialData = async () => {
    try {
      const supabase = createClient()
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (branchesData) {
        setBranches(branchesData)
        if (initialBranchId) {
          const branch = branchesData.find(b => b.id === initialBranchId)
          if (branch) {
            setSelectedBranch(branch)
            await fetchVehicles(branch.id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async (branchId: string) => {
    try {
      const supabase = createClient()
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .eq('status', 'available')
        .order('price_per_day')

      if (vehiclesData) {
        setVehicles(vehiclesData)
        if (initialVehicleId) {
          const vehicle = vehiclesData.find(v => v.id === initialVehicleId)
          if (vehicle) {
            setSelectedVehicle(vehicle)
            setStep(2)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch)
    setSelectedVehicle(null)
    setVehicles([])
    await fetchVehicles(branch.id)
  }

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!selectedBranch || !selectedVehicle) return
    if (!formData.customer_name || !formData.customer_phone) {
      alert('이름과 연락처를 입력해주세요.')
      return
    }
    if (!formData.start_date || !formData.end_date) {
      alert('대여 기간을 선택해주세요.')
      return
    }
    if (totalDays <= 0) {
      alert('올바른 대여 기간을 선택해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: selectedBranch.id,
          vehicle_id: selectedVehicle.id,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email,
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          base_price: totalPrice,
          total_price: totalPrice,
          notes: formData.notes
        })
      })

      const result = await response.json()
      if (result.success) {
        setStep(3)
      } else {
        alert(result.error || '예약 접수에 실패했습니다.')
      }
    } catch (error) {
      alert('예약 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white/60">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 예약 완료 화면
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
            예약이 접수되었습니다!
          </h1>
          <p className="text-slate-500 mb-8">
            <span className="text-primary font-semibold">{selectedBranch?.name}</span>에서 확인 후 연락드리겠습니다.
          </p>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 mb-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">차량</span>
                <span className="font-semibold text-slate-800">{selectedVehicle?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">대여 기간</span>
                <span className="font-medium text-slate-700 text-sm">
                  {formData.start_date} ~ {formData.end_date}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-slate-600 font-medium">예상 금액</span>
                <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-4 bg-gradient-to-r from-primary to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              홈으로 돌아가기
            </Link>
            <a
              href={`tel:${selectedBranch?.phone}`}
              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Phone className="w-5 h-5" />
              지점 전화하기
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/20 to-blue-600/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">차량 예약</h1>
                <p className="text-white/60 text-sm">차놀자 통합 예약 시스템</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden sm:flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-white/40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-white/20'}`}>
                  {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className="text-sm font-medium hidden md:inline">차량 선택</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-white/40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-white/20'}`}>
                  2
                </div>
                <span className="text-sm font-medium hidden md:inline">예약 정보</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 1 ? (
          // Step 1: 지점 및 차량 선택
          <div className="space-y-10">
            {/* 지점 선택 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">지점 선택</h2>
                  <p className="text-white/50 text-sm">차량을 대여할 지점을 선택하세요</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchSelect(branch)}
                    className={`group p-5 rounded-2xl text-left transition-all duration-300 ${
                      selectedBranch?.id === branch.id
                        ? 'bg-gradient-to-br from-primary to-blue-500 shadow-xl shadow-primary/30 scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`font-bold text-lg ${selectedBranch?.id === branch.id ? 'text-white' : 'text-white'}`}>
                        {branch.name}
                      </span>
                      {selectedBranch?.id === branch.id && (
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                    <p className={`text-sm flex items-center gap-2 ${selectedBranch?.id === branch.id ? 'text-white/80' : 'text-white/50'}`}>
                      <MapPin className="w-4 h-4" />
                      {branch.region}
                    </p>
                    {branch.phone && (
                      <p className={`text-sm flex items-center gap-2 mt-1 ${selectedBranch?.id === branch.id ? 'text-white/80' : 'text-white/50'}`}>
                        <Phone className="w-4 h-4" />
                        {branch.phone}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 차량 선택 */}
            {selectedBranch && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">차량 선택</h2>
                    <p className="text-white/50 text-sm">{selectedBranch.name}의 대여 가능 차량</p>
                  </div>
                </div>

                {vehicles.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                    <Car className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">현재 대여 가능한 차량이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleVehicleSelect(vehicle)}
                        className={`group rounded-2xl text-left transition-all duration-300 overflow-hidden ${
                          selectedVehicle?.id === vehicle.id
                            ? 'ring-2 ring-primary shadow-xl shadow-primary/20 scale-[1.02]'
                            : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                          <div className="flex">
                            {/* 차량 이미지 */}
                            <div className="w-32 sm:w-40 h-28 bg-gradient-to-br from-slate-700 to-slate-800 flex-shrink-0 relative overflow-hidden">
                              {vehicle.thumbnail_url ? (
                                <Image
                                  src={vehicle.thumbnail_url}
                                  alt={vehicle.name}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-12 h-12 text-white/30" />
                                </div>
                              )}
                              <div className="absolute top-2 left-2">
                                <span className="px-2 py-1 bg-primary/90 backdrop-blur text-white text-xs font-semibold rounded-lg">
                                  {vehicleTypeLabels[vehicle.vehicle_type]}
                                </span>
                              </div>
                            </div>

                            {/* 차량 정보 */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-bold text-white text-lg leading-tight">{vehicle.name}</h3>
                                  <p className="text-white/50 text-sm">{vehicle.brand}</p>
                                </div>
                                {selectedVehicle?.id === vehicle.id && (
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-white/50 mb-3">
                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                  <Users className="w-3.5 h-3.5" />
                                  {vehicle.seats}인승
                                </span>
                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                  <Fuel className="w-3.5 h-3.5" />
                                  {fuelTypeLabels[vehicle.fuel_type || ''] || '-'}
                                </span>
                              </div>

                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-primary">
                                  {vehicle.price_per_day.toLocaleString()}
                                </span>
                                <span className="text-white/40 text-sm">원/일</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Step 2: 날짜 및 고객 정보 입력
          <div className="grid lg:grid-cols-5 gap-8">
            {/* 메인 폼 영역 */}
            <div className="lg:col-span-3 space-y-6">
              {/* 대여 기간 */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">대여 기간</h2>
                    <p className="text-white/50 text-sm">차량 이용 기간을 선택하세요</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      대여 시작일
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        min={today}
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent placeholder-white/30"
                        required
                      />
                      <select
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
                          <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`} className="bg-slate-800">
                            {hour}:00
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      반납일
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        min={formData.start_date || today}
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                      <select
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
                          <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`} className="bg-slate-800">
                            {hour}:00
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 고객 정보 */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">예약자 정보</h2>
                    <p className="text-white/50 text-sm">예약에 필요한 정보를 입력하세요</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      이름 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="홍길동"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent placeholder-white/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      연락처 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent placeholder-white/30"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent placeholder-white/30"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      요청사항
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="픽업 장소, 기타 요청사항을 입력하세요"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent placeholder-white/30 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 사이드바 - 예약 요약 */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 sticky top-24">
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  예약 요약
                </h2>

                {/* 선택된 차량 */}
                <div className="bg-white/5 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-14 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                      {selectedVehicle?.thumbnail_url ? (
                        <Image
                          src={selectedVehicle.thumbnail_url}
                          alt={selectedVehicle.name}
                          width={80}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{selectedVehicle?.name}</p>
                      <p className="text-white/50 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedBranch?.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 가격 정보 */}
                {totalDays > 0 ? (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">일일 요금</span>
                      <span className="text-white">{selectedVehicle?.price_per_day.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">대여 기간</span>
                      <span className="text-white">{totalDays}일</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                      <span className="text-white font-medium">총 예상 금액</span>
                      <span className="text-3xl font-bold text-primary">{totalPrice.toLocaleString()}<span className="text-lg">원</span></span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 mb-6 text-center">
                    <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">대여 기간을 선택하세요</p>
                  </div>
                )}

                {/* 버튼 */}
                <div className="space-y-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || totalDays <= 0 || !formData.customer_name || !formData.customer_phone}
                    className="w-full py-4 bg-gradient-to-r from-primary to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        예약 접수 중...
                      </span>
                    ) : '예약 신청하기'}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors"
                  >
                    차량 다시 선택
                  </button>
                </div>

                {/* 안내 */}
                <div className="mt-5 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="text-sm text-primary flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    예약 신청 후 지점에서 확인 연락을 드립니다. 운전면허증을 지참해 주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReservationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white/60">로딩 중...</p>
        </div>
      </div>
    }>
      <ReservationContent />
    </Suspense>
  )
}
