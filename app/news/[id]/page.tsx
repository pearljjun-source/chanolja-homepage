import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Share2, Eye } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

async function getNews(id: string) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (error) {
    return null
  }

  // 조회수 증가
  await supabase
    .from('news')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', id)

  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const news = await getNews(id)

  if (!news) {
    return {
      title: '뉴스를 찾을 수 없습니다',
    }
  }

  return {
    title: news.title,
    description: news.content.replace(/<[^>]*>/g, '').substring(0, 160),
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const news = await getNews(id)

  if (!news) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark mb-4">뉴스를 찾을 수 없습니다</h1>
          <Link href="/news" className="text-primary hover:underline">
            뉴스룸으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-dark via-dark-200 to-dark">
        <div className="container-custom">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뉴스룸으로 돌아가기
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${categoryColors[news.category] || 'bg-gray-100 text-gray-600'}`}>
              {categoryLabels[news.category] || news.category}
            </span>
            <span className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              {new Date(news.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-2 text-gray-400">
              <Eye className="w-4 h-4" />
              {news.view_count || 0}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-4xl">
            {news.title}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            {/* Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-12 relative overflow-hidden">
              {news.thumbnail_url ? (
                <Image
                  src={news.thumbnail_url}
                  alt={news.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-9xl text-primary/20 font-bold">N</span>
              )}
            </div>

            {/* Article Content */}
            <article className="prose prose-lg max-w-none">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: news.content.replace(/\n/g, '<br />') }}
              />
            </article>

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  목록으로
                </Link>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Share2 className="w-4 h-4" />
                  공유하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
