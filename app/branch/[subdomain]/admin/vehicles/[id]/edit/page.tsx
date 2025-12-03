'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Car, Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import type { Vehicle } from '@/types/database'

interface VehicleForm {
  name: string
  brand: string
  model: string
  year: number | null
  license_plate: string
  vehicle_type: string
  color: string
  seats: number
  fuel_type: string
  transmission: string
  mileage: number | null
  price_per_day: number
  price_per_hour: number | null
  deposit: number
  description: string
  features: string[]
  thumbnail_url: string
  status: string
}

interface InsuranceForm {
  id?: string
  insurance_company: string
  policy_number: string
  insurance_type: string
  start_date: string
  end_date: string
  liability_per_person: number
  liability_per_accident: number
  property_damage: number
  self_damage: boolean
  self_damage_deductible: number
  annual_premium: number | null
}

const insuranceCompanies = [
  '삼성화재', 'DB손해보험', '현대해상', 'KB손해보험', '메리츠화재',
  '한화손해보험', '롯데손해보험', 'AXA손해보험', '흥국화재', '기타'
]

const vehicleTypes = [
  { value: 'sedan', label: '세단' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: '승합' },
  { value: 'truck', label: '트럭' },
  { value: 'camper', label: '캠핑카' },
  { value: 'luxury', label: '고급' },
]

const fuelTypes = [
  { value: 'gasoline', label: '가솔린' },
  { value: 'diesel', label: '디젤' },
  { value: 'lpg', label: 'LPG' },
  { value: 'electric', label: '전기' },
  { value: 'hybrid', label: '하이브리드' },
]

const transmissionTypes = [
  { value: 'automatic', label: '자동' },
  { value: 'manual', label: '수동' },
]

const statusOptions = [
  { value: 'available', label: '대여가능' },
  { value: 'rented', label: '대여중' },
  { value: 'maintenance', label: '정비중' },
  { value: 'reserved', label: '예약됨' },
]

const featureOptions = [
  '네비게이션', '후방카메라', '블랙박스', '열선시트',
  '통풍시트', '선루프', '스마트키', '크루즈컨트롤',
  'LED헤드라이트', '애플카플레이', '안드로이드오토'
]

export default function EditBranchVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const subdomain = params.subdomain as string
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasInsurance, setHasInsurance] = useState(false)
  const [insuranceForm, setInsuranceForm] = useState<InsuranceForm>({
    insurance_company: '삼성화재',
    policy_number: '',
    insurance_type: 'comprehensive',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    liability_per_person: 100000000,
    liability_per_accident: 200000000,
    property_damage: 20000000,
    self_damage: true,
    self_damage_deductible: 300000,
    annual_premium: null,
  })
  const [branchId, setBranchId] = useState<string | null>(null)
  const [form, setForm] = useState<VehicleForm>({
    name: '',
    brand: '',
    model: '',
    year: null,
    license_plate: '',
    vehicle_type: 'sedan',
    color: '',
    seats: 5,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    mileage: null,
    price_per_day: 50000,
    price_per_hour: null,
    deposit: 0,
    description: '',
    features: [],
    thumbnail_url: '',
    status: 'available',
  })

  useEffect(() => {
    fetchVehicle()
  }, [id])

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${id}`)
      const result = await response.json()

      if (result.success && result.data) {
        const vehicle = result.data
        setBranchId(vehicle.branch_id)
        setForm({
          name: vehicle.name || '',
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year,
          license_plate: vehicle.license_plate || '',
          vehicle_type: vehicle.vehicle_type || 'sedan',
          color: vehicle.color || '',
          seats: vehicle.seats || 5,
          fuel_type: vehicle.fuel_type || 'gasoline',
          transmission: vehicle.transmission || 'automatic',
          mileage: vehicle.mileage,
          price_per_day: vehicle.price_per_day || 50000,
          price_per_hour: vehicle.price_per_hour,
          deposit: vehicle.deposit || 0,
          description: vehicle.description || '',
          features: vehicle.features || [],
          thumbnail_url: vehicle.thumbnail_url || '',
          status: vehicle.status || 'available',
        })

        // 보험 정보가 있으면 설정
        if (vehicle.insurance && vehicle.insurance.length > 0) {
          const activeInsurance = vehicle.insurance.find((ins: any) => ins.is_active) || vehicle.insurance[0]
          setHasInsurance(true)
          setInsuranceForm({
            id: activeInsurance.id,
            insurance_company: activeInsurance.insurance_company || '삼성화재',
            policy_number: activeInsurance.policy_number || '',
            insurance_type: activeInsurance.insurance_type || 'comprehensive',
            start_date: activeInsurance.start_date || new Date().toISOString().split('T')[0],
            end_date: activeInsurance.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            liability_per_person: activeInsurance.coverage?.liability_per_person || 100000000,
            liability_per_accident: activeInsurance.coverage?.liability_per_accident || 200000000,
            property_damage: activeInsurance.coverage?.property_damage || 20000000,
            self_damage: activeInsurance.coverage?.self_damage ?? true,
            self_damage_deductible: activeInsurance.coverage?.self_damage_deductible || 300000,
            annual_premium: activeInsurance.annual_premium,
          })
        }
      } else {
        alert('차량 정보를 찾을 수 없습니다.')
        router.push(`/branch/${subdomain}/admin/vehicles`)
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      alert('차량 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.brand) {
      alert('차량명과 브랜드는 필수입니다.')
      return
    }

    setSaving(true)

    try {
      // 차량 정보 수정
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error || '차량 정보 수정에 실패했습니다.')
        return
      }

      // 보험 정보 처리
      if (hasInsurance && branchId) {
        const insuranceData = {
          vehicle_id: id,
          branch_id: branchId,
          insurance_company: insuranceForm.insurance_company,
          policy_number: insuranceForm.policy_number || null,
          insurance_type: insuranceForm.insurance_type,
          start_date: insuranceForm.start_date,
          end_date: insuranceForm.end_date,
          coverage: {
            liability_per_person: insuranceForm.liability_per_person,
            liability_per_accident: insuranceForm.liability_per_accident,
            property_damage: insuranceForm.property_damage,
            uninsured_motorist: 20000000,
            self_damage: insuranceForm.self_damage,
            self_damage_deductible: insuranceForm.self_damage_deductible,
          },
          annual_premium: insuranceForm.annual_premium,
          is_active: true,
        }

        if (insuranceForm.id) {
          // 기존 보험 수정
          const insuranceResponse = await fetch(`/api/insurances/${insuranceForm.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(insuranceData),
          })
          const insuranceResult = await insuranceResponse.json()
          if (!insuranceResult.success) {
            console.error('Insurance update failed:', insuranceResult.error)
            alert('차량 정보는 수정되었으나 보험 정보 수정에 실패했습니다.')
          }
        } else {
          // 새 보험 등록
          const insuranceResponse = await fetch('/api/insurances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(insuranceData),
          })
          const insuranceResult = await insuranceResponse.json()
          if (!insuranceResult.success) {
            console.error('Insurance creation failed:', insuranceResult.error)
            alert('차량 정보는 수정되었으나 보험 정보 등록에 실패했습니다.')
          }
        }
      }

      alert('차량 정보가 수정되었습니다.')
      router.push(`/branch/${subdomain}/admin/vehicles`)
    } catch (error) {
      alert('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleFeatureToggle = (feature: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

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
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/branch/${subdomain}/admin/vehicles`}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark">차량 수정</h1>
          <p className="text-gray-500">{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-6">기본 정보</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    차량명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 아반떼 CN7"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    브랜드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="예: 현대"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">모델</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="예: 아반떼"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연식</label>
                  <input
                    type="number"
                    value={form.year || ''}
                    onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })}
                    placeholder="2024"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">차량번호</label>
                  <input
                    type="text"
                    value={form.license_plate}
                    onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                    placeholder="예: 12가 3456"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="예: 흰색"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-6">차량 사양</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">차량 유형</label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {vehicleTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">좌석수</label>
                  <input
                    type="number"
                    value={form.seats}
                    onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연료</label>
                  <select
                    value={form.fuel_type}
                    onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {fuelTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">변속기</label>
                  <select
                    value={form.transmission}
                    onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {transmissionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">주행거리 (km)</label>
                  <input
                    type="number"
                    value={form.mileage || ''}
                    onChange={(e) => setForm({ ...form, mileage: e.target.value ? Number(e.target.value) : null })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-6">옵션/특징</h2>
              <div className="flex flex-wrap gap-2">
                {featureOptions.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => handleFeatureToggle(feature)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      form.features.includes(feature)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-6">상세 설명</h2>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                placeholder="차량에 대한 상세 설명을 입력하세요..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Insurance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  보험 정보
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={(e) => setHasInsurance(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">보험 {insuranceForm.id ? '수정' : '등록'}</span>
                </label>
              </div>

              {hasInsurance ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        보험사 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={insuranceForm.insurance_company}
                        onChange={(e) => setInsuranceForm({ ...insuranceForm, insurance_company: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {insuranceCompanies.map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">증권번호</label>
                      <input
                        type="text"
                        value={insuranceForm.policy_number}
                        onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_number: e.target.value })}
                        placeholder="선택사항"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">보험 유형</label>
                    <select
                      value={insuranceForm.insurance_type}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, insurance_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="comprehensive">종합보험</option>
                      <option value="liability_only">책임보험</option>
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        보험 시작일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={insuranceForm.start_date}
                        onChange={(e) => setInsuranceForm({ ...insuranceForm, start_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        보험 종료일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={insuranceForm.end_date}
                        onChange={(e) => setInsuranceForm({ ...insuranceForm, end_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">보장 내용</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">대인 1인당 (원)</label>
                        <input
                          type="number"
                          value={insuranceForm.liability_per_person}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, liability_per_person: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">대인 1사고당 (원)</label>
                        <input
                          type="number"
                          value={insuranceForm.liability_per_accident}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, liability_per_accident: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">대물 한도 (원)</label>
                        <input
                          type="number"
                          value={insuranceForm.property_damage}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, property_damage: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">자차 자기부담금 (원)</label>
                        <input
                          type="number"
                          value={insuranceForm.self_damage_deductible}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, self_damage_deductible: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={insuranceForm.self_damage}
                        onChange={(e) => setInsuranceForm({ ...insuranceForm, self_damage: e.target.checked })}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">자차 손해 가입</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">연간 보험료 (원)</label>
                    <input
                      type="number"
                      value={insuranceForm.annual_premium || ''}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, annual_premium: e.target.value ? Number(e.target.value) : null })}
                      placeholder="선택사항"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  체크박스를 선택하면 보험 정보를 {insuranceForm.id ? '수정' : '등록'}할 수 있습니다.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">차량 이미지</h2>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                {form.thumbnail_url ? (
                  <img
                    src={form.thumbnail_url}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Car className="w-16 h-16 text-gray-300" />
                )}
              </div>
              <input
                type="text"
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="이미지 URL을 입력하세요"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">차량 상태</h2>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-dark mb-4">요금 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일 요금 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.price_per_day}
                      onChange={(e) => setForm({ ...form, price_per_day: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시간 요금</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.price_per_hour || ''}
                      onChange={(e) => setForm({ ...form, price_per_hour: e.target.value ? Number(e.target.value) : null })}
                      min="0"
                      placeholder="선택사항"
                      className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">보증금</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.deposit}
                      onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  변경사항 저장
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
