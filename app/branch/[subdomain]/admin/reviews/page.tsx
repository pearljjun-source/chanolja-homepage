'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Star,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare,
  Clock,
  Car
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Review } from '@/types/database'

export default function BranchAdminReviewsPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

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

      // 모든 리뷰 조회 (승인/미승인 모두)
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('branch_id', branchData.id)
        .order('created_at', { ascending: false })

      if (reviewsData) {
        setReviews(reviewsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', reviewId)

      if (error) throw error

      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, is_approved: true } : r))
      )
    } catch (error) {
      console.error('Error approving review:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async (reviewId: string) => {
    if (!confirm('이 후기를 거절(삭제)하시겠습니까?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleVisibility = async (reviewId: string, currentVisibility: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reviews')
        .update({ is_visible: !currentVisibility })
        .eq('id', reviewId)

      if (error) throw error

      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, is_visible: !currentVisibility } : r))
      )
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('처리 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  const filteredReviews = reviews.filter(review => {
    if (filter === 'pending') return !review.is_approved
    if (filter === 'approved') return review.is_approved
    return true
  })

  const pendingCount = reviews.filter(r => !r.is_approved).length

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
          <h1 className="text-2xl font-bold text-dark">후기 관리</h1>
          <p className="text-gray-500">고객 후기를 관리합니다</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg">
            <Clock className="w-5 h-5" />
            <span className="font-medium">승인 대기: {pendingCount}건</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          전체 ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          승인 대기 ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          승인됨 ({reviews.length - pendingCount})
        </button>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'pending'
              ? '승인 대기 중인 후기가 없습니다.'
              : filter === 'approved'
              ? '승인된 후기가 없습니다.'
              : '등록된 후기가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl shadow-sm p-6 ${
                !review.is_approved ? 'border-l-4 border-yellow-400' : ''
              } ${!review.is_visible ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {!review.is_approved && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        승인 대기
                      </span>
                    )}
                    {!review.is_visible && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        숨김
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">
                    "{review.content}"
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">
                      {review.customer_name}
                    </span>
                    {review.customer_phone && (
                      <span>{review.customer_phone}</span>
                    )}
                    {review.vehicle_name && (
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {review.vehicle_name}
                      </span>
                    )}
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      <Check className="w-4 h-4" />
                      승인
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleVisibility(review.id, review.is_visible)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      review.is_visible
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    {review.is_visible ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        숨김
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        표시
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
