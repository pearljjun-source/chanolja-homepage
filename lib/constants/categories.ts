// 뉴스 카테고리 - 본사/지점 공통
export const NEWS_CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'news', label: '뉴스' },
  { value: 'notice', label: '공지사항' },
  { value: 'media', label: '미디어' },
  { value: 'event', label: '이벤트' },
] as const

export const NEWS_CATEGORY_LABELS: Record<string, string> = {
  news: '뉴스',
  notice: '공지사항',
  media: '미디어',
  event: '이벤트',
}

export const NEWS_CATEGORY_COLORS: Record<string, string> = {
  news: 'bg-blue-100 text-blue-600',
  notice: 'bg-red-100 text-red-600',
  media: 'bg-purple-100 text-purple-600',
  event: 'bg-orange-100 text-orange-600',
}

// 카테고리 옵션 (select용, 'all' 제외)
export const NEWS_CATEGORY_OPTIONS = NEWS_CATEGORIES.filter(c => c.value !== 'all')

// 카테고리 라벨 가져오기 (fallback 포함)
export function getCategoryLabel(category: string): string {
  return NEWS_CATEGORY_LABELS[category.toLowerCase()] || category
}
