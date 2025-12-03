'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import {
  Save,
  Building2,
  Phone,
  MapPin,
  Clock,
  FileText,
  X,
  Check,
  Upload,
  ImageIcon,
  Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database'

export default function BranchSettingsPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    region: '',
    business_hours: '09:00 - 21:00',
    description: '',
    introduction: '',
  })

  // 지점 이미지 목록
  const [branchImages, setBranchImages] = useState<string[]>([])

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

      if (branchData) {
        setBranch(branchData)
        setFormData({
          name: branchData.name || '',
          phone: branchData.phone || '',
          address: branchData.address || '',
          region: branchData.region || '',
          business_hours: branchData.business_hours || '09:00 - 21:00',
          description: branchData.description || '',
          introduction: branchData.introduction || '',
        })

        // 지점 이미지 로드
        await fetchBranchImages(branchData.id)
      }
    } catch (error) {
      console.error('Error fetching branch:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBranchImages = async (branchId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('branch-images')
        .list(branchId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Error fetching images:', error)
        return
      }

      if (data && data.length > 0) {
        const imageUrls = data
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => {
            const { data: urlData } = supabase.storage
              .from('branch-images')
              .getPublicUrl(`${branchId}/${file.name}`)
            return urlData.publicUrl
          })
        setBranchImages(imageUrls)
      }
    } catch (error) {
      console.error('Error fetching branch images:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setMessage({ type: 'error', text: '파일을 선택해주세요.' })
      return
    }

    if (!branch) {
      setMessage({ type: 'error', text: '지점 정보를 찾을 수 없습니다.' })
      return
    }

    const files = Array.from(e.target.files)
    setUploading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []
      const errors: string[] = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${branch.id}/${fileName}`

        console.log('Uploading:', filePath)

        const { error: uploadError } = await supabase.storage
          .from('branch-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          errors.push(`${file.name}: ${uploadError.message}`)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('branch-images')
          .getPublicUrl(filePath)

        console.log('Upload success:', urlData.publicUrl)
        uploadedUrls.push(urlData.publicUrl)
      }

      if (uploadedUrls.length > 0) {
        setBranchImages(prev => [...uploadedUrls, ...prev])
        setMessage({ type: 'success', text: `${uploadedUrls.length}개의 이미지가 업로드되었습니다.` })
      }

      if (errors.length > 0) {
        setMessage({ type: 'error', text: `업로드 실패: ${errors.join(', ')}` })
      }

      setTimeout(() => setMessage(null), 5000)
    } catch (error: any) {
      console.error('Error uploading images:', error)
      setMessage({ type: 'error', text: `이미지 업로드 오류: ${error?.message || error}` })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    if (!branch) return

    try {
      const supabase = createClient()
      // URL에서 파일 경로 추출
      const urlParts = imageUrl.split('/branch-images/')
      if (urlParts.length < 2) return

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('branch-images')
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        setMessage({ type: 'error', text: '이미지 삭제 중 오류가 발생했습니다.' })
        return
      }

      setBranchImages(prev => prev.filter(url => url !== imageUrl))
      setMessage({ type: 'success', text: '이미지가 삭제되었습니다.' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting image:', error)
      setMessage({ type: 'error', text: '이미지 삭제 중 오류가 발생했습니다.' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branch) return

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('branches')
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          region: formData.region,
          business_hours: formData.business_hours,
          description: formData.description,
          introduction: formData.introduction,
        })
        .eq('id', branch.id)

      if (error) throw error

      // 저장 후 데이터 다시 불러오기
      await fetchBranchData()

      setMessage({ type: 'success', text: '설정이 저장되었습니다.' })

      // 3초 후 메시지 제거
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving settings:', error)
      const errorMessage = error?.message || '저장 중 오류가 발생했습니다.'
      setMessage({ type: 'error', text: `저장 실패: ${errorMessage}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">지점 정보를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">설정</h1>
        <p className="text-gray-500">지점 정보를 관리합니다</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-dark">기본 정보</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지점명 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="예: 강남서초"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                전화번호 *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="예: 010-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                주소 *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="예: 서울특별시 강남구 논현로 105길 46"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="예: 서울"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                영업시간
              </label>
              <input
                type="text"
                name="business_hours"
                value={formData.business_hours}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="예: 09:00 - 21:00"
              />
            </div>
          </div>
        </div>

        {/* 지점 소개 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-dark">지점 소개</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                간단 소개 (메인 페이지에 표시)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="메인 페이지에 표시될 간단한 소개글을 입력하세요."
              />
              <p className="text-xs text-gray-400 mt-1">최대 200자 권장</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 소개 (지점소개 페이지에 표시)
              </label>
              <textarea
                name="introduction"
                value={formData.introduction}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="지점소개 페이지에 표시될 상세한 소개글을 입력하세요. 지점의 특징, 장점, 서비스 등을 자세히 설명해주세요."
              />
              <p className="text-xs text-gray-400 mt-1">지점의 특징과 강점을 자세히 소개해주세요</p>
            </div>
          </div>
        </div>

        {/* 지점 이미지 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-dark">지점 이미지</h2>
          </div>

          <div className="space-y-6">
            {/* 업로드 영역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 업로드
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-500">업로드 중...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">클릭하여 이미지를 업로드하세요</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP (여러 장 선택 가능)</p>
                  </>
                )}
              </div>
            </div>

            {/* 업로드된 이미지 목록 */}
            {branchImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  업로드된 이미지 ({branchImages.length}장)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {branchImages.map((imageUrl, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={`지점 이미지 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(imageUrl)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400">
              지점 홈페이지의 &apos;지점 이미지&apos; 섹션에 표시됩니다. 매장, 시설, 서비스 등의 사진을 업로드하세요.
            </p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center justify-end gap-4">
          {/* 알림 메시지 */}
          {message && (
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}
          <button
            type="button"
            onClick={() => fetchBranchData()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                저장하기
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
