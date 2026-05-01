'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight } from 'lucide-react'
import { News } from '@/types/database'
import { NEWS_CATEGORIES as categories, NEWS_CATEGORY_COLORS as categoryColors, NEWS_CATEGORY_LABELS as categoryLabels } from '@/lib/constants/categories'

interface NewsListProps {
  news: News[]
}

export default function NewsList({ news }: NewsListProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredNews = selectedCategory === 'all'
    ? news
    : news.filter((item) => item.category === selectedCategory)

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
