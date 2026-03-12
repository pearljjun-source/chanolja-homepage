'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Newspaper, Calendar, ChevronRight, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { findBranch } from '@/lib/supabase/branch-lookup'
import type { News, Branch } from '@/types/database'
import { getTheme, themeClasses } from '@/lib/themes'
import { NEWS_CATEGORY_LABELS as categoryLabels } from '@/lib/constants/categories'

export default function BranchNewsPage() {
  const params = useParams()
  const subdomain = decodeURIComponent(params.subdomain as string)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [newsList, setNewsList] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [subdomain])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      const found = await findBranch(supabase, subdomain)
      if (!found) return

      setBranch(found)

      const { data: newsData } = await supabase
        .from('news')
        .select('*')
        .eq('branch_id', found.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (newsData) setNewsList(newsData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !branch) return null

  const theme = getTheme(branch.theme)
  const tc = themeClasses[theme]

  const filtered = selectedCategory === 'all'
    ? newsList
    : newsList.filter(n => n.category.toLowerCase() === selectedCategory)

  const categories = ['all', ...new Set(newsList.map(n => n.category.toLowerCase()))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 */}
      <section className={`${tc.bg} py-12 md:py-16`}>
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{branch.name} 소식</h1>
          <p className="text-white/80 text-sm md:text-base">최신 뉴스와 공지사항을 확인하세요</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* 카테고리 필터 */}
        {categories.length > 2 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? `${tc.bg} text-white`
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                {cat === 'all' ? '전체' : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        )}

        {/* 뉴스 목록 */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">아직 등록된 소식이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((news) => (
              <article
                key={news.id}
                className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedId(expandedId === news.id ? null : news.id)}
                  className="w-full text-left p-4 md:p-6 flex items-start gap-4"
                >
                  {news.thumbnail_url && (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={news.thumbnail_url}
                        alt={news.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tc.bgLight} ${tc.text}`}>
                        {categoryLabels[news.category.toLowerCase()] || news.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(news.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-gray-900 mb-1">{news.title}</h2>
                    {expandedId !== news.id && (
                      <p className="text-sm text-gray-500 line-clamp-2">{news.content}</p>
                    )}
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${expandedId === news.id ? 'rotate-90' : ''}`} />
                </button>

                {expandedId === news.id && (
                  <div className="px-4 pb-4 md:px-6 md:pb-6 border-t pt-4">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {news.content}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
