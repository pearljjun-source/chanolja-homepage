'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  Plus,
  AlertTriangle,
  Calendar,
  Car,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  Edit,
  Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle, VehicleInsurance } from '@/types/database'

export default function BranchAdminInsurancesPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [insurances, setInsurances] = useState<VehicleInsurance[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState<VehicleInsurance | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [saving, setSaving] = useState(false)

  // 보험 등록 폼
  const [insuranceForm, setInsuranceForm] = useState({
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
    annual_premium: null as number | null,
  })

  const insuranceCompanies = [
    '삼성화재', 'DB손해보험', '현대해상', 'KB손해보험', '메리츠화재',
    '한화손해보험', '롯데손해보험', 'AXA손해보험', '흥국화재', '기타'
  ]

  useEffect(() => {
    fetchData()
  }, [subdomain])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // 지점 조회
      const { data: allBranches } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)

      if (!allBranches) {
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

      // 보험 목록 조회
      const { data: insurancesData } = await supabase
        .from('vehicle_insurances')
        .select(`
          *,
          vehicle:vehicles(id, name, brand, model, license_plate)
        `)
        .eq('branch_id', branchData.id)
        .eq('is_active', true)
        .order('end_date', { ascending: true })

      if (insurancesData) {
        setInsurances(insurancesData)
      }

      // 차량 목록 조회 (보험 등록용)
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('branch_id', branchData.id)
        .eq('is_active', true)
        .order('name')

      if (vehiclesData) {
        setVehicles(vehiclesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInsurance = async () => {
    if (!branch || !selectedVehicle) {
      alert('차량을 선택해주세요.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/insurances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
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

      const result = await response.json()

      if (result.success) {
        alert('보험이 등록되었습니다.')
        setShowAddModal(false)
        setSelectedVehicle('')
        fetchData()
      } else {
        alert(result.error || '보험 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error adding insurance:', error)
      alert('보험 등록 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditInsurance = (insurance: VehicleInsurance) => {
    const coverage = insurance.coverage as any
    setEditingInsurance(insurance)
    setSelectedVehicle(insurance.vehicle_id)
    setInsuranceForm({
      insurance_company: insurance.insurance_company,
      policy_number: insurance.policy_number || '',
      insurance_type: insurance.insurance_type,
      start_date: insurance.start_date,
      end_date: insurance.end_date,
      liability_per_person: coverage?.liability_per_person || 100000000,
      liability_per_accident: coverage?.liability_per_accident || 200000000,
      property_damage: coverage?.property_damage || 20000000,
      self_damage: coverage?.self_damage ?? true,
      self_damage_deductible: coverage?.self_damage_deductible || 300000,
      annual_premium: insurance.annual_premium,
    })
    setShowEditModal(true)
  }

  const handleUpdateInsurance = async () => {
    if (!editingInsurance) return

    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicle_insurances')
        .update({
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
        })
        .eq('id', editingInsurance.id)

      if (error) throw error

      alert('보험 정보가 수정되었습니다.')
      setShowEditModal(false)
      setEditingInsurance(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error updating insurance:', error)
      alert('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedVehicle('')
    setInsuranceForm({
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
  }

  const handleDeleteInsurance = async (insuranceId: string) => {
    if (!confirm('이 보험 정보를 삭제하시겠습니까?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicle_insurances')
        .update({ is_active: false })
        .eq('id', insuranceId)

      if (error) throw error

      setInsurances(prev => prev.filter(i => i.id !== insuranceId))
      alert('보험 정보가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting insurance:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      return `${amount / 100000000}억원`
    } else if (amount >= 10000) {
      return `${amount / 10000}만원`
    }
    return `${amount.toLocaleString()}원`
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getExpiryStatus = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate)
    if (days < 0) return { label: '만료됨', color: 'bg-red-100 text-red-700' }
    if (days <= 7) return { label: `${days}일 후 만료`, color: 'bg-red-100 text-red-700' }
    if (days <= 30) return { label: `${days}일 후 만료`, color: 'bg-yellow-100 text-yellow-700' }
    return { label: '유효', color: 'bg-green-100 text-green-700' }
  }

  // 보험 없는 차량 필터링
  const vehiclesWithoutInsurance = vehicles.filter(
    v => !insurances.some(i => i.vehicle_id === v.id)
  )

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">보험 관리</h1>
          <p className="text-gray-500">차량 보험 정보를 관리합니다</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          보험 등록
        </button>
      </div>

      {/* 만료 임박 경고 */}
      {insurances.some(i => getDaysUntilExpiry(i.end_date) <= 30) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">만료 임박 보험이 있습니다</p>
            <p className="text-sm text-yellow-600">
              30일 이내에 만료되는 보험을 확인하고 갱신해주세요.
            </p>
          </div>
        </div>
      )}

      {/* 보험 없는 차량 경고 */}
      {vehiclesWithoutInsurance.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">보험 미등록 차량: {vehiclesWithoutInsurance.length}대</p>
            <p className="text-sm text-red-600">
              {vehiclesWithoutInsurance.map(v => v.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* 보험 목록 */}
      {insurances.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">등록된 보험이 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            보험 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {insurances.map((insurance) => {
            const expiryStatus = getExpiryStatus(insurance.end_date)
            const vehicle = insurance.vehicle as any

            return (
              <div
                key={insurance.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* 차량 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {vehicle?.name || '차량 정보 없음'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {vehicle?.brand} {vehicle?.model} · {vehicle?.license_plate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 보험 정보 */}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{insurance.insurance_company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {insurance.insurance_type === 'comprehensive' ? '종합보험' : '책임보험'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(insurance.start_date)} ~ {formatDate(insurance.end_date)}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                        {getDaysUntilExpiry(insurance.end_date) <= 30 ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {expiryStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* 보장 내용 */}
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>대인: {formatCurrency((insurance.coverage as any)?.liability_per_person || 0)}</p>
                      <p>대물: {formatCurrency((insurance.coverage as any)?.property_damage || 0)}</p>
                      <p>자차: {(insurance.coverage as any)?.self_damage ? '가입' : '미가입'}</p>
                    </div>
                  </div>

                  {/* 액션 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditInsurance(insurance)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteInsurance(insurance.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 보험 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">보험 등록</h2>
              <p className="text-sm text-gray-500">차량 보험 정보를 등록합니다</p>
            </div>

            <div className="p-6 space-y-6">
              {/* 차량 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  차량 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">차량을 선택하세요</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.brand} {vehicle.model}) - {vehicle.license_plate}
                    </option>
                  ))}
                </select>
              </div>

              {/* 보험사 & 증권번호 */}
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

              {/* 보험 유형 */}
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

              {/* 보험 기간 */}
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

              {/* 보장 내용 */}
              <div className="pt-4 border-t">
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

              {/* 보험료 */}
              <div>
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

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddInsurance}
                disabled={saving || !selectedVehicle}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    보험 등록
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 보험 수정 모달 */}
      {showEditModal && editingInsurance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">보험 수정</h2>
              <p className="text-sm text-gray-500">보험 정보를 수정합니다</p>
            </div>

            <div className="p-6 space-y-6">
              {/* 차량 정보 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">차량</label>
                <div className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                  {vehicles.find(v => v.id === editingInsurance.vehicle_id)?.name || '차량 정보 없음'}
                </div>
              </div>

              {/* 보험사 & 증권번호 */}
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

              {/* 보험 유형 */}
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

              {/* 보험 기간 */}
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

              {/* 보장 내용 */}
              <div className="pt-4 border-t">
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

              {/* 보험료 */}
              <div>
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

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingInsurance(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateInsurance}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    수정 중...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    수정 완료
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
