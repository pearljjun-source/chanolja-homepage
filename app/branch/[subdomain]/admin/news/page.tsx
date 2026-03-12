'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Newspaper,
  X,
  Upload
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { findBranch } from '@/lib/supabase/branch-lookup'
import type { News, Branch } from '@/types/database'
import { NEWS_CATEGORY_LABELS as categoryLabels } from '@/lib/constants/categories'

export default function BranchNewsAdminPage() {
  const params = useParams()
  const subdomain = decodeURIComponent(params.subdomain as string)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [newsList, setNewsList] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'news',
    is_published: true,
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [subdomain])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // 지점 조회
      const found = await findBranch(supabase, subdomain)
      if (!found) return

      setBranch(found)

      // 뉴스 조회
      const { data: newsData } = await supabase
        .from('news')
        .select('*')
        .eq('branch_id', found.id)
        .order('created_at', { ascending: false })

      if (newsData) setNewsList(newsData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingNews(null)
    setFormData({ title: '', content: '', category: 'news', is_published: true })
    setThumbnailFile(null)
    setShowModal(true)
  }

  const openEditModal = (news: News) => {
    setEditingNews(news)
    setFormData({
      title: news.title,
      content: news.content,
      category: news.category.toLowerCase(),
      is_published: news.is_published,
    })
    setThumbnailFile(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!branch || !formData.title.trim() || !formData.content.trim()) return
    setSaving(true)

    try {
      const supabase = createClient()
      let thumbnailUrl = editingNews?.thumbnail_url || null

      // 이미지 업로드
      if (thumbnailFile) {
        const ext = thumbnailFile.name.split('.').pop()
        const fileName = `news/${branch.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, thumbnailFile)

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
          thumbnailUrl = urlData.publicUrl
        }
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        is_published: formData.is_published,
        thumbnail_url: thumbnailUrl,
        branch_id: branch.id,
        updated_at: new Date().toISOString(),
      }

      if (editingNews) {
        await supabase.from('news').update(payload).eq('id', editingNews.id)
      } else {
        await supabase.from('news').insert(payload)
      }

      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (news: News) => {
    const supabase = createClient()
    await supabase
      .from('news')
      .update({ is_published: !news.is_published, updated_at: new Date().toISOString() })
      .eq('id', news.id)
    fetchData()
  }

  const deleteNews = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('news').delete().eq('id', id)
    fetchData()
  }

  const filtered = newsList.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">뉴스 관리</h1>
          <p className="text-sm text-gray-500 mt-1">지점 소식 및 공지사항을 관리합니다</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 글 작성
        </button>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="제목으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">등록된 뉴스가 없습니다</p>
          <button onClick={openCreateModal} className="mt-3 text-primary font-semibold text-sm">
            첫 번째 글 작성하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((news) => (
            <div key={news.id} className="bg-white rounded-xl border p-4 flex items-start gap-4">
              {/* 썸네일 */}
              {news.thumbnail_url && (
                <img
                  src={news.thumbnail_url}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0 hidden sm:block"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    news.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {news.is_published ? '게시중' : '비공개'}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                    {categoryLabels[news.category.toLowerCase()] || news.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{news.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{news.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(news.created_at).toLocaleDateString('ko-KR')}
                  {news.view_count !== undefined && ` · 조회 ${news.view_count}`}
                </p>
              </div>

              {/* 액션 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePublish(news)}
                  className={`p-2 rounded-lg transition-colors ${
                    news.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={news.is_published ? '비공개로 전환' : '게시하기'}
                >
                  {news.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEditModal(news)}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  title="수정"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteNews(news.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 작성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editingNews ? '뉴스 수정' : '새 글 작성'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="내용을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">썸네일 이미지</label>
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {thumbnailFile ? thumbnailFile.name : '이미지 선택 (선택사항)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700">바로 게시</label>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title.trim() || !formData.content.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : editingNews ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
