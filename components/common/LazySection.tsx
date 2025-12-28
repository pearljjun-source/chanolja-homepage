'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface LazySectionProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
  className?: string
}

/**
 * Intersection Observer를 사용하여 뷰포트에 진입할 때만 컴포넌트를 렌더링
 * 스크롤해서 보이기 전까지는 placeholder만 표시
 */
export default function LazySection({
  children,
  fallback,
  rootMargin = '200px', // 뷰포트 200px 전에 미리 로드 시작
  threshold = 0,
  className = '',
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // IntersectionObserver가 없는 브라우저는 즉시 표시
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      setHasLoaded(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setHasLoaded(true)
          observer.disconnect() // 한 번 로드되면 관찰 중지
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return (
    <div ref={ref} className={className}>
      {isVisible || hasLoaded ? (
        children
      ) : (
        fallback || (
          <div className="min-h-[200px] bg-gradient-to-br from-slate-50 to-slate-100 animate-pulse rounded-lg" />
        )
      )}
    </div>
  )
}

/**
 * 스켈레톤 UI 컴포넌트들
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  )
}

export function VehicleCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-slate-200 rounded w-16" />
          <div className="h-6 bg-slate-200 rounded w-16" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-24 h-24 bg-slate-200 rounded-lg" />
          <div className="flex-1 space-y-2 py-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TextBlockSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-5/6" />
      <div className="h-4 bg-slate-200 rounded w-4/5" />
    </div>
  )
}
