'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { value: 'news', label: '뉴스' },
  { value: 'notice', label: '공지사항' },
  { value: 'media', label: '미디어' },
  { value: 'event', label: '이벤트' },
]

export default function EditNewsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'news',
    is_published: true,
  })

  useEffect(() => {
    if (id) {
      fetchNews()
    }
  }, [id])

  const fetchNews = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching news:', error)
      router.push('/admin/news')
    } else if (data) {
      setFormData({
        title: data.title,
        content: data.content,
        category: data.category,
        is_published: data.is_published,
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('news')
        .update({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          is_published: formData.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      router.push('/admin/news')
    } catch (error) {
      console.error('Error updating news:', error)
      alert('뉴스 수정 중 오류가 발생했습니다.')
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          뉴스 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-dark">뉴스 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="뉴스 제목을 입력하세요"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 *
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                공개 상태
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={() => setFormData({ ...formData, is_published: true })}
                    className="w-4 h-4 text-primary"
                  />
                  <span>공개</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_published"
                    checked={!formData.is_published}
                    onChange={() => setFormData({ ...formData, is_published: false })}
                    className="w-4 h-4 text-primary"
                  />
                  <span>비공개</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용 *
            </label>
            <textarea
              id="content"
              required
              rows={15}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input-field resize-none"
              placeholder="뉴스 내용을 입력하세요"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              href="/admin/news"
              className="btn-outline"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
