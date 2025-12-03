import { Metadata } from 'next'
import NewsHero from '@/components/news/NewsHero'
import NewsList from '@/components/news/NewsList'

export const metadata: Metadata = {
  title: '뉴스룸',
  description: '차놀자의 최신 소식, 미디어 보도, 파트너십, 이벤트 등 다양한 뉴스를 확인하세요.',
}

export default function NewsPage() {
  return (
    <>
      <NewsHero />
      <NewsList />
    </>
  )
}
