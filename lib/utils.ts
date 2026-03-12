import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatPhone(phone: string) {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
}

/** 날짜 포맷 - YYYY.MM */
export function formatDateShort(date: string | Date) {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 날짜 포맷 - YYYY.MM.DD */
export function formatDateFull(date: string | Date) {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 날짜+시간 포맷 - YYYY년 MM월 DD일 HH:MM */
export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/** 이름 마스킹 (김철수 → 김**) */
export function maskName(name: string) {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}
