import { Metadata } from 'next'
import NewsHero from '@/components/news/NewsHero'
import NewsList from '@/components/news/NewsList'
import { createClient } from '@/lib/supabase/server'
import type { News } from '@/types/database'

export const revalidate = 1800 // 30분마다 ISR 재생성

export const metadata: Metadata = {
  title: '뉴스룸',
  description: '차놀자의 최신 소식, 미디어 보도, 파트너십, 이벤트 등 다양한 뉴스를 확인하세요.',
  keywords: ['차놀자 뉴스', '렌트카 소식', '차놀자 이벤트', '자동차 업계 뉴스'],
  openGraph: {
    title: '뉴스룸 | 차놀자 CHANOLJA',
    description: '차놀자의 최신 소식, 미디어 보도, 이벤트 등 다양한 뉴스.',
    url: '/news',
  },
  alternates: {
    canonical: '/news',
  },
}

export default async function NewsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('news')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const news = (data || []) as News[]

  return (
    <>
      <NewsHero />
      <NewsList news={news} />
    </>
  )
}
