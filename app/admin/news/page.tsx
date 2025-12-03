'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { News } from '@/types/database'

const categoryLabels: Record<string, string> = {
  news: '뉴스',
  notice: '공지사항',
  media: '미디어',
  event: '이벤트',
}

export default function AdminNewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching news:', error)
    } else {
      setNews(data || [])
    }
    setLoading(false)
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('news')
      .update({ is_published: !currentStatus })
      .eq('id', id)

    if (!error) {
      setNews(prev =>
        prev.map(n => n.id === id ? { ...n, is_published: !currentStatus } : n)
      )
    }
  }

  const deleteNews = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (!error) {
      setNews(prev => prev.filter(n => n.id !== id))
    }
  }

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-dark">뉴스 관리</h1>
          <p className="text-gray-500">뉴스룸에 게시될 뉴스를 관리합니다.</p>
        </div>
        <Link
          href="/admin/news/new"
          className="bg-primary text-white px-5 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          새 글 작성
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="뉴스 제목으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">제목</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 hidden md:table-cell">카테고리</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 hidden md:table-cell">작성일</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 hidden md:table-cell">조회수</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredNews.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-dark line-clamp-1">{item.title}</p>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {categoryLabels[item.category] || item.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm hidden md:table-cell">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm hidden md:table-cell">
                  {item.view_count || 0}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => togglePublish(item.id, item.is_published)}
                    className="inline-flex items-center gap-1"
                  >
                    {item.is_published ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm hover:text-green-700">
                        <Eye className="w-4 h-4" />
                        공개
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 text-sm hover:text-gray-500">
                        <EyeOff className="w-4 h-4" />
                        비공개
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/news/${item.id}`}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteNews(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredNews.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 뉴스가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  )
}
