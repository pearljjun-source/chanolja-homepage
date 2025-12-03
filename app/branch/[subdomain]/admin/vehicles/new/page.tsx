'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Car, Upload, X, Plus, Shield, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database'

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
  images: string[]
}

interface InsuranceForm {
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

export default function NewBranchVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const subdomain = params.subdomain as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newFeature, setNewFeature] = useState('')
  const [includeInsurance, setIncludeInsurance] = useState(false)
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
  const [form, setForm] = useState<VehicleForm>({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
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
    images: [],
  })

  useEffect(() => {
    fetchBranch()
  }, [subdomain])

  const fetchBranch = async () => {
    try {
      const supabase = createClient()
      const decodedSubdomain = decodeURIComponent(subdomain)

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

      if (branchData) {
        setBranch(branchData)
      }
    } catch (error) {
      console.error('Error fetching branch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!branch) {
      alert('지점 정보를 찾을 수 없습니다.')
      return
    }

    if (!form.name || !form.brand) {
      alert('차량명과 브랜드는 필수입니다.')
      return
    }

    if (includeInsurance && !insuranceForm.insurance_company) {
      alert('보험사를 선택해주세요.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          model: form.model,
          year: form.year,
          license_plate: form.license_plate,
          vehicle_type: form.vehicle_type,
          color: form.color,
          seats: form.seats,
          fuel_type: form.fuel_type,
          transmission: form.transmission,
          mileage: form.mileage,
          price_per_day: form.price_per_day,
          price_per_hour: form.price_per_hour,
          deposit: form.deposit,
          description: form.description,
          features: form.features,
          thumbnail_url: form.thumbnail_url,
          images: form.images,
          branch_id: branch.id,
          status: 'available',
          is_active: true,
        }),
      })

      const result = await response.json()

      // 차량 등록 성공 후 보험 정보도 등록
      if (result.success && result.data && includeInsurance) {
        const vehicleId = result.data.id

        const insuranceResponse = await fetch('/api/insurances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_id: vehicleId,
            branch_id: branch.id,
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
          }),
        })

        const insuranceResult = await insuranceResponse.json()
        if (!insuranceResult.success) {
          console.error('Insurance registration failed:', insuranceResult.error)
          alert('차량은 등록되었으나 보험 정보 등록에 실패했습니다.')
        }
      }

      if (result.success) {
        alert('차량이 등록되었습니다.')
        router.push(`/branch/${subdomain}/admin/vehicles`)
      } else {
        alert(result.error || '차량 등록에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('Vehicle registration error:', error)
      alert(`차량 등록 중 오류가 발생했습니다: ${error?.message || error}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddFeature = () => {
    if (newFeature.trim() && !form.features.includes(newFeature.trim())) {
      setForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (feature: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddFeature()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      alert('파일을 선택해주세요.')
      return
    }

    if (!branch) {
      alert('지점 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    const files = Array.from(e.target.files)
    const remainingSlots = 10 - form.images.length

    if (files.length > remainingSlots) {
      alert(`최대 10장까지 업로드 가능합니다. 현재 ${form.images.length}장이 등록되어 있어 ${remainingSlots}장만 추가할 수 있습니다.`)
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${branch.id}/vehicles/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('branch-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert(`이미지 업로드 실패: ${uploadError.message}`)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('branch-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(urlData.publicUrl)
      }

      if (uploadedUrls.length > 0) {
        setForm(prev => {
          const newImages = [...prev.images, ...uploadedUrls]
          // 첫 번째 이미지를 대표 이미지로 자동 설정 (대표 이미지가 없는 경우)
          const newThumbnail = prev.thumbnail_url || newImages[0]
          return { ...prev, images: newImages, thumbnail_url: newThumbnail }
        })
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(`이미지 업로드 중 오류: ${error?.message || error}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (imageUrl: string) => {
    setForm(prev => {
      const newImages = prev.images.filter(img => img !== imageUrl)
      // 삭제한 이미지가 대표 이미지였다면 첫 번째 이미지로 변경
      let newThumbnail = prev.thumbnail_url
      if (prev.thumbnail_url === imageUrl) {
        newThumbnail = newImages.length > 0 ? newImages[0] : ''
      }
      return { ...prev, images: newImages, thumbnail_url: newThumbnail }
    })
  }

  const handleSetThumbnail = (imageUrl: string) => {
    setForm(prev => ({ ...prev, thumbnail_url: imageUrl }))
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
          <h1 className="text-2xl font-bold text-dark">새 차량 등록</h1>
          <p className="text-gray-500">새로운 차량을 등록합니다</p>
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
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="옵션을 입력하세요 (예: 네비게이션)"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
              {form.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.features.map(feature => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feature)}
                        className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">추가된 옵션이 없습니다</p>
              )}
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
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">보험 등록</span>
                </label>
              </div>

              {includeInsurance && (
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
              )}

              {!includeInsurance && (
                <p className="text-sm text-gray-400 text-center py-4">
                  체크박스를 선택하면 보험 정보를 함께 등록할 수 있습니다.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-dark">차량 이미지</h2>
                <span className="text-sm text-gray-500">{form.images.length}/10</span>
              </div>

              {/* 대표 이미지 미리보기 */}
              <div className="relative aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                {form.thumbnail_url ? (
                  <>
                    <Image
                      src={form.thumbnail_url}
                      alt="대표 이미지"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-xs rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      대표
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Car className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">이미지를 업로드해주세요</p>
                  </div>
                )}
              </div>

              {/* 이미지 갤러리 */}
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {form.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${
                        form.thumbnail_url === imageUrl ? 'ring-2 ring-primary' : 'ring-1 ring-gray-200'
                      }`}
                      onClick={() => handleSetThumbnail(imageUrl)}
                    >
                      <Image
                        src={imageUrl}
                        alt={`이미지 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {form.thumbnail_url === imageUrl && (
                        <div className="absolute top-1 left-1 p-1 bg-primary text-white rounded-full">
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage(imageUrl)
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              )}

              {form.images.length > 0 && (
                <p className="text-xs text-gray-400 mb-3 text-center">
                  클릭하여 대표 이미지 설정
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || form.images.length >= 10}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    업로드 중...
                  </>
                ) : form.images.length >= 10 ? (
                  <>
                    <Upload className="w-5 h-5" />
                    최대 10장 업로드 완료
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    이미지 업로드 (여러 장 선택 가능)
                  </>
                )}
              </button>
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
                  차량 등록
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
