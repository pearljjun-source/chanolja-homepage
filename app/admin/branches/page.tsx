'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit, Trash2, MapPin, Phone, Upload, FileSpreadsheet, X, User, Globe, ExternalLink, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

interface Branch {
  id: string
  name: string
  region: string
  address: string | null
  phone: string | null
  branch_type: string
  is_active: boolean
  owner_name?: string | null
  business_number?: string | null
  website_url?: string | null
  lat?: number | null
  lng?: number | null
  admin_email?: string | null
}

const typeLabels: Record<string, string> = {
  rental: '렌트카',
  camping: '캠핑카',
  both: '복합',
}

const typeColors: Record<string, string> = {
  rental: 'bg-blue-100 text-blue-600',
  camping: 'bg-green-100 text-green-600',
  both: 'bg-purple-100 text-purple-600',
}

// 주소에서 지역 추출
function extractRegion(address: string): string {
  if (!address) return '기타'

  // 시/도 추출
  const patterns = [
    { regex: /서울/, region: '서울' },
    { regex: /부산/, region: '부산' },
    { regex: /대구/, region: '대구' },
    { regex: /인천/, region: '인천' },
    { regex: /광주광역시/, region: '광주' },
    { regex: /대전/, region: '대전' },
    { regex: /울산/, region: '울산' },
    { regex: /세종/, region: '세종' },
    { regex: /경기/, region: '경기' },
    { regex: /강원/, region: '강원' },
    { regex: /충청북도|충북/, region: '충북' },
    { regex: /충청남도|충남/, region: '충남' },
    { regex: /전라북도|전북|전북특별자치도/, region: '전북' },
    { regex: /전라남도|전남/, region: '전남' },
    { regex: /경상북도|경북/, region: '경북' },
    { regex: /경상남도|경남/, region: '경남' },
    { regex: /제주/, region: '제주' },
  ]

  for (const { regex, region } of patterns) {
    if (regex.test(address)) {
      return region
    }
  }

  return '기타'
}

export default function AdminBranchesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [uploadData, setUploadData] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeProgress, setGeocodeProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)

  // 새 지점 기본값
  const emptyBranch: Branch = {
    id: '',
    name: '',
    region: '',
    address: null,
    phone: null,
    branch_type: 'rental',
    is_active: true,
    owner_name: null,
    business_number: null,
    website_url: null,
    lat: null,
    lng: null,
    admin_email: null,
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching branches:', error)
    } else {
      setBranches(data || [])
    }
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      // 헤더 행 찾기 (번호, 지점 등이 있는 행)
      let headerRowIndex = -1
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i]
        if (row && row.some((cell: any) => cell === '지 점' || cell === '지점')) {
          headerRowIndex = i
          break
        }
      }

      if (headerRowIndex === -1) {
        alert('엑셀 파일 형식이 올바르지 않습니다. "지점" 열을 찾을 수 없습니다.')
        return
      }

      // 데이터 파싱
      const parsedData = []
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || !row[1]) continue // 지점명이 없으면 스킵

        const address = row[4] || ''
        parsedData.push({
          name: String(row[1]).trim(), // 지점명
          business_number: row[2] ? String(row[2]).trim() : null, // 사업자등록번호
          owner_name: row[3] ? String(row[3]).trim() : null, // 대표자
          address: address ? String(address).trim() : null, // 주소
          phone: row[5] ? String(row[5]).trim() : null, // 전화번호
          region: extractRegion(String(address)), // 지역 자동 추출
          branch_type: 'rental',
          is_active: true,
        })
      }

      setUploadData(parsedData)
      setShowUploadModal(true)
    }
    reader.readAsBinaryString(file)

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadConfirm = async () => {
    if (uploadData.length === 0) return

    setUploading(true)
    try {
      const supabase = createClient()

      // 기존 지점 삭제 여부 확인
      const confirmDelete = confirm(
        `${uploadData.length}개의 지점을 등록합니다.\n기존 지점 데이터를 모두 삭제하고 새로 등록할까요?\n\n[확인] - 기존 데이터 삭제 후 새로 등록\n[취소] - 기존 데이터 유지하고 추가만`
      )

      if (confirmDelete) {
        // 기존 데이터 삭제
        await supabase.from('branches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      }

      // 새 데이터 삽입
      const { error } = await supabase.from('branches').insert(uploadData)

      if (error) throw error

      alert(`${uploadData.length}개의 지점이 성공적으로 등록되었습니다.`)
      setShowUploadModal(false)
      setUploadData([])
      fetchBranches()
    } catch (error) {
      console.error('Error uploading branches:', error)
      alert('지점 등록 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const deleteBranch = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id)

    if (!error) {
      setBranches(prev => prev.filter(b => b.id !== id))
    }
  }

  // 지점 추가 모달 열기
  const openAddModal = () => {
    setEditingBranch({ ...emptyBranch })
    setShowEditModal(true)
  }

  // 지점 편집 모달 열기
  const openEditModal = (branch: Branch) => {
    setEditingBranch({ ...branch })
    setShowEditModal(true)
  }

  // 지점 저장 (추가/수정)
  const saveBranch = async () => {
    if (!editingBranch || !editingBranch.name.trim()) {
      alert('지점명을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      // 주소에서 지역 자동 추출
      const region = editingBranch.address ? extractRegion(editingBranch.address) : editingBranch.region || '기타'

      const branchData = {
        name: editingBranch.name.trim(),
        region,
        address: editingBranch.address?.trim() || null,
        phone: editingBranch.phone?.trim() || null,
        branch_type: editingBranch.branch_type,
        is_active: editingBranch.is_active,
        owner_name: editingBranch.owner_name?.trim() || null,
        business_number: editingBranch.business_number?.trim() || null,
        website_url: editingBranch.website_url?.trim() || null,
        lat: editingBranch.lat,
        lng: editingBranch.lng,
        admin_email: editingBranch.admin_email?.trim() || null,
      }

      if (editingBranch.id) {
        // 수정
        const { error } = await supabase
          .from('branches')
          .update(branchData)
          .eq('id', editingBranch.id)

        if (error) {
          console.error('Update error:', error)
          throw new Error(`수정 실패: ${error.message}`)
        }

        setBranches(prev =>
          prev.map(b => b.id === editingBranch.id ? { ...b, ...branchData, id: editingBranch.id } : b)
        )
        alert('지점이 수정되었습니다.')
      } else {
        // 추가
        const { data, error } = await supabase
          .from('branches')
          .insert(branchData)
          .select()
          .single()

        if (error) {
          console.error('Insert error:', error)
          throw new Error(`추가 실패: ${error.message}`)
        }

        setBranches(prev => [...prev, data])
        alert('지점이 추가되었습니다.')
      }

      setShowEditModal(false)
      setEditingBranch(null)
      setAdminPassword('')
    } catch (error) {
      console.error('Error saving branch:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 관리자 계정 생성
  const createAdminAccount = async () => {
    if (!editingBranch?.admin_email) {
      alert('관리자 이메일을 먼저 입력해주세요.')
      return
    }
    if (!adminPassword) {
      alert('비밀번호를 입력해주세요.')
      return
    }
    if (adminPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setCreatingAccount(true)
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingBranch.admin_email,
          password: adminPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.exists) {
          alert('이미 등록된 이메일입니다. 기존 계정으로 로그인 가능합니다.')
        } else {
          alert(result.error || '계정 생성에 실패했습니다.')
        }
        return
      }

      alert('관리자 계정이 생성되었습니다!')
      setAdminPassword('')
    } catch (error) {
      console.error('Error creating admin account:', error)
      alert('계정 생성 중 오류가 발생했습니다.')
    } finally {
      setCreatingAccount(false)
    }
  }

  // 주소로 좌표 변환 (단일)
  const geocodeAddress = async (address: string): Promise<{ lat: number | null; lng: number | null }> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    return { lat: null, lng: null }
  }

  // 좌표 없는 지점들 일괄 업데이트
  const updateMissingCoordinates = async () => {
    const branchesWithoutCoords = branches.filter(
      (b) => b.address && (!b.lat || !b.lng)
    )

    if (branchesWithoutCoords.length === 0) {
      alert('모든 지점에 좌표가 설정되어 있습니다.')
      return
    }

    if (!confirm(`${branchesWithoutCoords.length}개 지점의 좌표를 업데이트하시겠습니까?`)) {
      return
    }

    setGeocoding(true)
    setGeocodeProgress({ current: 0, total: branchesWithoutCoords.length })

    const supabase = createClient()
    let successCount = 0

    for (let i = 0; i < branchesWithoutCoords.length; i++) {
      const branch = branchesWithoutCoords[i]
      setGeocodeProgress({ current: i + 1, total: branchesWithoutCoords.length })

      if (!branch.address) continue

      const coords = await geocodeAddress(branch.address)

      if (coords.lat && coords.lng) {
        const { error } = await supabase
          .from('branches')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', branch.id)

        if (!error) {
          successCount++
          setBranches(prev =>
            prev.map(b =>
              b.id === branch.id ? { ...b, lat: coords.lat, lng: coords.lng } : b
            )
          )
        }
      }

      // API 호출 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    setGeocoding(false)
    alert(`${successCount}개 지점의 좌표가 업데이트되었습니다.`)
  }

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.region.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-dark">지점 관리</h1>
          <p className="text-gray-500">전국 지점 정보를 관리합니다. (총 {branches.length}개)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={updateMissingCoordinates}
            disabled={geocoding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${geocoding ? 'animate-spin' : ''}`} />
            {geocoding
              ? `좌표 변환 중... (${geocodeProgress.current}/${geocodeProgress.total})`
              : '좌표 업데이트'}
          </button>
          <label className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
            엑셀 업로드
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            지점 추가
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="지점명 또는 지역으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-dark">{branch.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[branch.branch_type] || typeColors.rental}`}>
                  {typeLabels[branch.branch_type] || '렌트카'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(branch)}
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteBranch(branch.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {branch.owner_name && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>{branch.owner_name}</span>
                </div>
              )}
              {branch.address && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>{branch.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <a
                  href={`/branch/${encodeURIComponent(branch.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  지점 홈페이지
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{branch.region}</span>
                {branch.lat && branch.lng ? (
                  <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">좌표</span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">좌표없음</span>
                )}
              </div>
              <span className={`text-sm ${branch.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                {branch.is_active ? '운영중' : '운영중지'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredBranches.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          {searchQuery ? '검색 결과가 없습니다.' : '등록된 지점이 없습니다. 엑셀 파일을 업로드하세요.'}
        </div>
      )}

      {/* Edit/Add Modal */}
      {showEditModal && editingBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark">
                {editingBranch.id ? '지점 수정' : '새 지점 추가'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingBranch(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[60vh] space-y-4">
              {/* 지점명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지점명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: 강남서초"
                />
              </div>

              {/* 대표자명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                <input
                  type="text"
                  value={editingBranch.owner_name || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, owner_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: 홍길동"
                />
              </div>

              {/* 사업자등록번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록번호</label>
                <input
                  type="text"
                  value={editingBranch.business_number || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, business_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: 123-45-67890"
                />
              </div>

              {/* 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={editingBranch.address || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: 서울특별시 강남구 논현로 105길 46"
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={editingBranch.phone || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: 010-1234-5678"
                />
              </div>

              {/* 홈페이지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">홈페이지 URL</label>
                <input
                  type="url"
                  value={editingBranch.website_url || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, website_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: https://example.com"
                />
              </div>

              {/* 관리자 계정 설정 */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-blue-800">관리자 계정 설정</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    관리자 이메일
                  </label>
                  <input
                    type="email"
                    value={editingBranch.admin_email || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, admin_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: admin@branch.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호
                    <span className="text-xs text-gray-500 ml-2">(새 계정 생성시에만 입력)</span>
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="최소 6자 이상"
                  />
                </div>

                <button
                  type="button"
                  onClick={createAdminAccount}
                  disabled={creatingAccount || !editingBranch.admin_email || !adminPassword}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {creatingAccount ? '계정 생성 중...' : '관리자 계정 생성'}
                </button>

                <p className="text-xs text-blue-700">
                  이메일과 비밀번호를 입력하고 "관리자 계정 생성" 버튼을 클릭하세요.
                  이미 계정이 있으면 이메일만 저장하면 됩니다.
                </p>
              </div>

              {/* 지점 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">지점 유형</label>
                <select
                  value={editingBranch.branch_type}
                  onChange={(e) => setEditingBranch({ ...editingBranch, branch_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="rental">렌트카</option>
                  <option value="camping">캠핑카</option>
                  <option value="both">복합 (렌트카+캠핑카)</option>
                </select>
              </div>

              {/* 운영 상태 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingBranch.is_active}
                  onChange={(e) => setEditingBranch({ ...editingBranch, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  운영중
                </label>
              </div>

              {/* 좌표 정보 (읽기 전용) */}
              {(editingBranch.lat || editingBranch.lng) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    좌표: {editingBranch.lat}, {editingBranch.lng}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingBranch(null)
                  setAdminPassword('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveBranch}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark">엑셀 데이터 확인</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadData([])
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[50vh]">
              <p className="text-gray-600 mb-4">
                총 <span className="font-bold text-primary">{uploadData.length}개</span>의 지점을 등록합니다.
              </p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">지점명</th>
                    <th className="px-3 py-2 text-left">대표자</th>
                    <th className="px-3 py-2 text-left">지역</th>
                    <th className="px-3 py-2 text-left">주소</th>
                    <th className="px-3 py-2 text-left">전화번호</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {uploadData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2">{item.owner_name || '-'}</td>
                      <td className="px-3 py-2">{item.region}</td>
                      <td className="px-3 py-2 max-w-xs truncate" title={item.address || ''}>{item.address || '-'}</td>
                      <td className="px-3 py-2">{item.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadData([])
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUploadConfirm}
                disabled={uploading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
