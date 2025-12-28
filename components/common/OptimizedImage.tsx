'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

// 기본 blur placeholder (회색 그라데이션)
const defaultBlurDataURL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlMmU4ZjAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjYmQ5ZTgiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg=='

// 차량 이미지용 blur placeholder (자동차 아이콘 포함)
const vehicleBlurDataURL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlMmU4ZjAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjYmQyZTMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjxwYXRoIGQ9Ik0xNjAgMTcwaDgwbDEwLTMwaDYwbDEwIDMwaDIwdjMwSDE0MHYtMzBoMjB6IiBmaWxsPSIjOTRhM2I4IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNzAiIGN5PSIyMDAiIHI9IjE1IiBmaWxsPSIjNjQ3NDhiIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzMTAiIGN5PSIyMDAiIHI9IjE1IiBmaWxsPSIjNjQ3NDhiIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4='

// 뉴스/기사 이미지용 blur placeholder
const newsBlurDataURL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU4ZjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjxyZWN0IHg9IjE1MCIgeT0iMTEwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iIzk0YTNiOCIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+'

// 로고/브랜드 이미지용 blur placeholder
const logoBlurDataURL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9IiNmOGZhZmMiLz48L3N2Zz4='

export type ImageVariant = 'default' | 'vehicle' | 'news' | 'logo'

const blurDataURLs: Record<ImageVariant, string> = {
  default: defaultBlurDataURL,
  vehicle: vehicleBlurDataURL,
  news: newsBlurDataURL,
  logo: logoBlurDataURL,
}

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  variant?: ImageVariant
  showSkeleton?: boolean
}

export default function OptimizedImage({
  variant = 'default',
  showSkeleton = true,
  className = '',
  onLoad,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    onLoad?.(e as any)
  }

  const handleError = () => {
    setHasError(true)
  }

  if (hasError) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className}`}
        style={{ width: props.width, height: props.height }}
      >
        <svg
          className="w-12 h-12 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  // fill 속성이 있으면 부모가 position과 크기를 가져야 함
  const isFill = props.fill === true

  if (isFill) {
    // fill 이미지는 부모 요소의 크기를 따르므로 추가 wrapper 없이 직접 렌더링
    return (
      <>
        {showSkeleton && !isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
        )}
        <Image
          {...props}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          placeholder="blur"
          blurDataURL={blurDataURLs[variant]}
          onLoad={handleLoad}
          onError={handleError}
        />
      </>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* 스켈레톤 로딩 표시 */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse rounded-inherit" />
      )}
      <Image
        {...props}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        placeholder="blur"
        blurDataURL={blurDataURLs[variant]}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

// 차량 이미지 전용 컴포넌트
export function VehicleImage(props: Omit<OptimizedImageProps, 'variant'>) {
  return <OptimizedImage {...props} variant="vehicle" />
}

// 뉴스 이미지 전용 컴포넌트
export function NewsImage(props: Omit<OptimizedImageProps, 'variant'>) {
  return <OptimizedImage {...props} variant="news" />
}

// 로고 이미지 전용 컴포넌트
export function LogoImage(props: Omit<OptimizedImageProps, 'variant'>) {
  return <OptimizedImage {...props} variant="logo" showSkeleton={false} />
}
