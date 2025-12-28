import { cn, formatDate, formatPhone } from '@/lib/utils'

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('should handle conditional class names', () => {
    const isActive = true
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class')
  })

  it('should handle false/undefined conditions', () => {
    const isActive = false
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class')
  })

  it('should merge conflicting Tailwind classes correctly', () => {
    // tailwind-merge should keep the last class
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle arrays of class names', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('should handle objects with boolean values', () => {
    expect(cn({ 'active': true, 'disabled': false })).toBe('active')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn(null, undefined)).toBe('')
  })
})

describe('formatDate', () => {
  it('should format date string correctly in Korean', () => {
    const result = formatDate('2024-01-15')
    expect(result).toBe('2024년 1월 15일')
  })

  it('should format Date object correctly', () => {
    const date = new Date(2024, 0, 15) // January 15, 2024
    const result = formatDate(date)
    expect(result).toBe('2024년 1월 15일')
  })

  it('should handle different date formats', () => {
    expect(formatDate('2024-12-31')).toBe('2024년 12월 31일')
    expect(formatDate('2024-06-01')).toBe('2024년 6월 1일')
  })

  it('should handle ISO date strings', () => {
    const result = formatDate('2024-01-15T10:30:00Z')
    expect(result).toContain('2024년')
    expect(result).toContain('1월')
  })
})

describe('formatPhone', () => {
  it('should format 11-digit phone number correctly', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678')
  })

  it('should format different phone numbers', () => {
    expect(formatPhone('01098765432')).toBe('010-9876-5432')
    expect(formatPhone('01011112222')).toBe('010-1111-2222')
  })

  it('should handle phone number with only digits', () => {
    expect(formatPhone('01000000000')).toBe('010-0000-0000')
  })

  it('should handle already formatted phone numbers', () => {
    // If already has dashes, the regex won't match the full pattern
    const formatted = '010-1234-5678'
    expect(formatPhone(formatted)).toBe(formatted)
  })

  it('should handle phone numbers with less than 11 digits', () => {
    // Less than 11 digits - regex won't match full pattern
    const result = formatPhone('0101234567')
    // The function uses a regex that expects exactly 3-4-4 digits
    expect(result).toBe('0101234567')
  })

  it('should handle phone numbers with more than 11 digits', () => {
    // More than 11 digits - regex will match first 11 chars
    const result = formatPhone('010123456789')
    // The regex (\d{3})(\d{4})(\d{4}) will match from the start
    expect(result).toBe('010-1234-56789')
  })
})
