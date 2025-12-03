'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle } from '@/types/database'

export default function NewInsurancePage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    branch_id: '',
    vehicle_id: '',
    insurance_company: '',
    policy_number: '',
    insurance_type: 'comprehensive',
    start_date: '',
    end_date: '',
    annual_premium: 0,
    monthly_premium: 0,
    coverage: {
      liability_per_person: 100000000,
      liability_per_accident: 200000000,
      property_damage: 20000000,
      uninsured_motorist: 20000000,
      self_damage: true,
      self_damage_deductible: 300000
    }
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (formData.branch_id) {
      fetchVehicles(formData.branch_id)
    } else {
      setVehicles([])
    }
  }, [formData.branch_id])

  const fetchBranches = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setBranches(data)
  }

  const fetchVehicles = async (branchId: string) => {
    try {
      const response = await fetch(`/api/vehicles?branch_id=${branchId}&page_size=100`)
      const result = await response.json()
      if (result.success) {
        setVehicles(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.branch_id || !formData.vehicle_id) {
      alert('지점과 차량을 선택해주세요.')
      return
    }

    if (!formData.insurance_company) {
      alert('보험사를 입력해주세요.')
      return
    }

    if (!formData.start_date || !formData.end_date) {
      alert('보험 기간을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/insurances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        alert('보험이 등록되었습니다.')
        router.push('/admin/insurances')
      } else {
        alert(result.error || '등록에 실패했습니다.')
      }
    } catch (error) {
      alert('등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateCoverage = (field: string, value: number | boolean) => {
    setFormData({
      ...formData,
      coverage: {
        ...formData.coverage,
        [field]: value
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/insurances"
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark">보험 등록</h1>
          <p className="text-gray-500">차량 보험 정보를 등록합니다.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-6">차량 선택</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지점 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value, vehicle_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">지점을 선택하세요</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.region})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                차량 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={!formData.branch_id}
              >
                <option value="">차량을 선택하세요</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} {vehicle.license_plate && `(${vehicle.license_plate})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Insurance Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-6">보험 정보</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보험사 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.insurance_company}
                onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                placeholder="예: 삼성화재, DB손해보험"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">증권번호</label>
              <input
                type="text"
                value={formData.policy_number}
                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                placeholder="보험 증권번호"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">보험 유형</label>
              <select
                value={formData.insurance_type}
                onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="comprehensive">종합보험</option>
                <option value="liability_only">책임보험</option>
              </select>
            </div>

            <div></div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보험 시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보험 만료일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연간 보험료 (원)</label>
              <input
                type="number"
                value={formData.annual_premium}
                onChange={(e) => setFormData({ ...formData, annual_premium: parseInt(e.target.value) || 0 })}
                min="0"
                step="10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">월 보험료 (원)</label>
              <input
                type="number"
                value={formData.monthly_premium}
                onChange={(e) => setFormData({ ...formData, monthly_premium: parseInt(e.target.value) || 0 })}
                min="0"
                step="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Coverage Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark mb-6">보장 내용</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">대인 1인당 한도 (원)</label>
              <input
                type="number"
                value={formData.coverage.liability_per_person}
                onChange={(e) => updateCoverage('liability_per_person', parseInt(e.target.value) || 0)}
                min="0"
                step="10000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">대인 1사고당 한도 (원)</label>
              <input
                type="number"
                value={formData.coverage.liability_per_accident}
                onChange={(e) => updateCoverage('liability_per_accident', parseInt(e.target.value) || 0)}
                min="0"
                step="10000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">대물 한도 (원)</label>
              <input
                type="number"
                value={formData.coverage.property_damage}
                onChange={(e) => updateCoverage('property_damage', parseInt(e.target.value) || 0)}
                min="0"
                step="1000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">무보험차 상해 (원)</label>
              <input
                type="number"
                value={formData.coverage.uninsured_motorist}
                onChange={(e) => updateCoverage('uninsured_motorist', parseInt(e.target.value) || 0)}
                min="0"
                step="1000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="self_damage"
                checked={formData.coverage.self_damage}
                onChange={(e) => updateCoverage('self_damage', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="self_damage" className="text-sm font-medium text-gray-700">
                자차 손해 가입
              </label>
            </div>

            {formData.coverage.self_damage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">자차 자기부담금 (원)</label>
                <input
                  type="number"
                  value={formData.coverage.self_damage_deductible}
                  onChange={(e) => updateCoverage('self_damage_deductible', parseInt(e.target.value) || 0)}
                  min="0"
                  step="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/insurances"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? '등록 중...' : '보험 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
