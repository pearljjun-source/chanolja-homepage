'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * 기본 스켈레톤 컴포넌트
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded',
        className
      )}
    />
  )
}

/**
 * 텍스트 스켈레톤
 */
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

/**
 * 아바타 스켈레톤
 */
export function AvatarSkeleton({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return <Skeleton className={cn('rounded-full', sizeClasses[size])} />
}

/**
 * 카드 스켈레톤
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm overflow-hidden', className)}>
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * 차량 카드 스켈레톤
 */
export function VehicleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl overflow-hidden', className)}>
      <div className="aspect-[4/3] relative">
        <Skeleton className="absolute inset-0" />
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-14 rounded-lg" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  )
}

/**
 * 뉴스 카드 스켈레톤
 */
export function NewsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-md overflow-hidden', className)}>
      <Skeleton className="aspect-video w-full" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  )
}

/**
 * 리스트 아이템 스켈레톤
 */
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-4 p-4 bg-white rounded-lg', className)}>
      <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}

/**
 * 테이블 스켈레톤
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm overflow-hidden', className)}>
      {/* 헤더 */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* 바디 */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  'h-4 flex-1',
                  colIndex === 0 && 'w-1/4',
                  colIndex === columns - 1 && 'w-1/6'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 폼 스켈레톤
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-32 rounded-lg mt-4" />
    </div>
  )
}

/**
 * 대시보드 통계 카드 스켈레톤
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

/**
 * 페이지 헤더 스켈레톤
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
  )
}

/**
 * 전체 페이지 로딩 스켈레톤
 */
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">로딩 중...</p>
      </div>
    </div>
  )
}
