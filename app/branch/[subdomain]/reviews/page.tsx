'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Star,
  ChevronLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Car,
  Quote
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle, Review } from '@/types/database'

export default function ReviewsPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // 폼 상태
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [subdomain])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // 지점 정보 조회
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

      // 차량 목록 조회
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('branch_id', branchData.id)
        .eq('is_active', true)
        .order('name')

      if (vehiclesData) {
        setVehicles(vehiclesData)
      }

      // 승인된 리뷰 조회
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('branch_id', branchData.id)
        .eq('is_approved', true)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (reviewsData) {
        setReviews(reviewsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!branch) return
    if (!customerName.trim()) {
      setSubmitResult({ success: false, message: '이름을 입력해주세요.' })
      return
    }
    if (!content.trim()) {
      setSubmitResult({ success: false, message: '후기 내용을 입력해주세요.' })
      return
    }
    if (content.trim().length < 10) {
      setSubmitResult({ success: false, message: '후기는 10자 이상 작성해주세요.' })
      return
    }

    setSubmitting(true)
    setSubmitResult(null)

    try {
      const supabase = createClient()

      const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)

      const { error } = await supabase.from('reviews').insert({
        branch_id: branch.id,
        vehicle_id: selectedVehicle || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        rating,
        content: content.trim(),
        vehicle_name: selectedVehicleData?.name || null,
        is_approved: false, // 관리자 승인 필요
        is_visible: true
      })

      if (error) throw error

      setSubmitResult({
        success: true,
        message: '후기가 등록되었습니다. 관리자 승인 후 게시됩니다.'
      })

      // 메시지가 보이도록 스크롤
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)

      // 폼 초기화
      setCustomerName('')
      setCustomerPhone('')
      setSelectedVehicle('')
      setRating(5)
      setContent('')
    } catch (error) {
      console.error('Error submitting review:', error)
      setSubmitResult({
        success: false,
        message: '후기 등록 중 오류가 발생했습니다. 다시 시도해주세요.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const maskName = (name: string) => {
    if (name.length <= 1) return name
    return name[0] + '*'.repeat(name.length - 1)
  }

  if (loading || !branch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href={`/branch/${decodedSubdomain}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{branch.name} 지점</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 페이지 타이틀 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">고객 후기</h1>
          <p className="text-gray-500">
            {branch.name} 지점을 이용해주신 고객님들의 생생한 후기입니다
          </p>
        </div>

        {/* 후기 작성 폼 */}
        <div ref={formRef} className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            후기 작성하기
          </h2>

          {submitResult && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                submitResult.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {submitResult.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p>{submitResult.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 (선택)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <p className="mt-1 text-xs text-gray-400">비공개로 처리됩니다</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이용 차량 (선택)
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">차량을 선택해주세요</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.brand} {vehicle.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평점 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-lg font-semibold text-gray-700">
                  {rating}점
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                후기 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="서비스 이용 경험을 자유롭게 작성해주세요. (최소 10자 이상)"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                {content.length}자 / 최소 10자
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  등록 중...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  후기 등록하기
                </>
              )}
            </button>
          </form>
        </div>

        {/* 리뷰 목록 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            고객님들의 후기 {reviews.length > 0 && `(${reviews.length}개)`}
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Quote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 등록된 후기가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-1">
                첫 번째 후기를 작성해보세요!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-4">
                    "{review.content}"
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        {maskName(review.customer_name)}
                      </span>
                      {review.vehicle_name && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Car className="w-4 h-4" />
                          {review.vehicle_name} 이용
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
