'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { News } from '@/types/database'

const categories = [
  { value: 'all', label: '전체' },
  { value: 'news', label: '뉴스' },
  { value: 'notice', label: '공지사항' },
  { value: 'media', label: '미디어' },
  { value: 'event', label: '이벤트' },
]

const categoryColors: Record<string, string> = {
  news: 'bg-blue-100 text-blue-600',
  notice: 'bg-red-100 text-red-600',
  media: 'bg-purple-100 text-purple-600',
  event: 'bg-orange-100 text-orange-600',
}

const categoryLabels: Record<string, string> = {
  news: '뉴스',
  notice: '공지사항',
  media: '미디어',
  event: '이벤트',
}

export default function NewsList() {
  const [selectedCategory, setSelectedCategory] = useState('all')
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
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching news:', error)
    } else {
      setNews(data || [])
    }
    setLoading(false)
  }

  const filteredNews = selectedCategory === 'all'
    ? news
    : news.filter((item) => item.category === selectedCategory)

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {item.thumbnail_url ? (
                  <Image
                    src={item.thumbnail_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-8xl text-primary/20 font-bold">N</span>
                )}
                <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/20 transition-colors" />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${categoryColors[item.category] || 'bg-gray-100 text-gray-600'}`}>
                    {categoryLabels[item.category] || item.category}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-dark mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {item.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </p>

                <span className="inline-flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  자세히 보기
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">해당 카테고리의 뉴스가 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  )
}
