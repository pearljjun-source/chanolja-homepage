'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  onClick?: () => void
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
}: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-slate-200',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-transparent border-2 border-slate-300',
  }

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable && 'cursor-pointer hover:shadow-md hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function CardTitle({ children, className, as: Tag = 'h3' }: CardTitleProps) {
  return (
    <Tag className={cn('text-lg font-bold text-slate-800', className)}>
      {children}
    </Tag>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-slate-500 mt-1', className)}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-slate-100', className)}>
      {children}
    </div>
  )
}

interface CardImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'video' | 'square' | 'wide'
}

export function CardImage({ src, alt, className, aspectRatio = 'video' }: CardImageProps) {
  const aspectStyles = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
  }

  return (
    <div className={cn('overflow-hidden rounded-t-xl -mx-4 -mt-4 mb-4', className)}>
      <img
        src={src}
        alt={alt}
        className={cn('w-full object-cover', aspectStyles[aspectRatio])}
      />
    </div>
  )
}

// 미리 구성된 차량 카드
interface VehicleCardProps {
  name: string
  brand?: string
  imageUrl?: string
  pricePerDay: number
  seats: number
  fuelType: string
  isAvailable?: boolean
  onClick?: () => void
}

export function VehicleCard({
  name,
  brand,
  imageUrl,
  pricePerDay,
  seats,
  fuelType,
  isAvailable = true,
  onClick,
}: VehicleCardProps) {
  return (
    <Card variant="default" padding="none" hoverable onClick={onClick}>
      <div className="relative">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full aspect-[4/3] object-cover rounded-t-xl" />
        ) : (
          <div className="w-full aspect-[4/3] bg-slate-100 rounded-t-xl flex items-center justify-center">
            <span className="text-slate-400">이미지 없음</span>
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-lg',
            isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}
        >
          {isAvailable ? '예약가능' : '예약불가'}
        </span>
      </div>
      <div className="p-4">
        <h4 className="font-bold text-slate-800">{name}</h4>
        {brand && <p className="text-sm text-slate-500">{brand}</p>}
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
            {seats}인승
          </span>
          <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
            {fuelType}
          </span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xl font-bold text-primary">
            {pricePerDay.toLocaleString()}원
          </span>
          <span className="text-xs text-slate-400">/일</span>
        </div>
      </div>
    </Card>
  )
}

// 미리 구성된 뉴스 카드
interface NewsCardProps {
  title: string
  category: string
  date: string
  imageUrl?: string
  excerpt?: string
  onClick?: () => void
}

export function NewsCard({
  title,
  category,
  date,
  imageUrl,
  excerpt,
  onClick,
}: NewsCardProps) {
  return (
    <Card variant="elevated" padding="none" hoverable onClick={onClick}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full aspect-video object-cover rounded-t-xl" />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl" />
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {category}
          </span>
          <span className="text-xs text-slate-400">{date}</span>
        </div>
        <h4 className="font-bold text-slate-800 line-clamp-2">{title}</h4>
        {excerpt && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{excerpt}</p>
        )}
      </div>
    </Card>
  )
}

// 미리 구성된 통계 카드
interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: ReactNode
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
}: StatCardProps) {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-slate-500',
  }

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">{title}</span>
        {icon && (
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {change && (
        <p className={cn('text-xs mt-1', changeColors[changeType])}>{change}</p>
      )}
    </Card>
  )
}
