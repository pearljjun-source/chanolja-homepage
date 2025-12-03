'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { News } from '@/types/database'

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

export default function NewsSection() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const itemsPerPage = 3

  useEffect(() => {
    fetchNews()
  }, [])

  // Auto slide
  useEffect(() => {
    if (!isAutoPlaying || news.length <= itemsPerPage) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, news.length - itemsPerPage)
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, news.length])

  const fetchNews = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(9)

    if (error) {
      console.error('Error fetching news:', error)
    } else {
      setNews(data || [])
    }
    setLoading(false)
  }

  const goToPrev = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    const maxIndex = Math.max(0, news.length - itemsPerPage)
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  const totalPages = Math.ceil(Math.max(0, news.length - itemsPerPage + 1))

  return (
    <section className="py-12 lg:py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="container-custom px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 lg:mb-12 gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-dark mb-2 lg:mb-4">
              <span className="text-primary">차놀자</span> 뉴스룸
            </h2>
            <p className="text-sm lg:text-base text-gray-600">
              차놀자의 최신 소식을 확인하세요
            </p>
          </div>
          <Link
            href="/news"
            className="hidden sm:inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all text-sm lg:text-base"
          >
            전체 보기
            <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12 lg:py-20">
            <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 lg:py-16">
            <p className="text-gray-500 text-base lg:text-lg">등록된 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Mobile: Vertical list / Desktop: Slider */}
            <div className="md:hidden space-y-4">
              {news.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="flex gap-4 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 p-3"
                >
                  <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg relative overflow-hidden">
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-3xl text-primary/30 font-bold">N</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[item.category] || 'bg-gray-100 text-gray-600'}`}>
                        {categoryLabels[item.category] || item.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-dark text-sm line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: Slider Container */}
            <div className="hidden md:block overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out gap-6"
                style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage + 2)}%)` }}
              >
                {news.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className="group flex-shrink-0 w-full md:w-[calc(33.333%-16px)] bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                      {item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-6xl text-primary/30 font-bold">N</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[item.category] || 'bg-gray-100 text-gray-600'}`}>
                          {categoryLabels[item.category] || item.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-dark line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Desktop only */}
            {news.length > itemsPerPage && (
              <div className="hidden md:block">
                <button
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all border border-gray-200 ${
                    currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex >= news.length - itemsPerPage}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all border border-gray-200 ${
                    currentIndex >= news.length - itemsPerPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            )}

            {/* Dots Indicator - Desktop only */}
            {totalPages > 1 && (
              <div className="hidden md:flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false)
                      setCurrentIndex(index)
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentIndex
                        ? 'w-8 h-3 bg-primary'
                        : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm"
          >
            전체 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
