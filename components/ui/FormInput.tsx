'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

// 기본 입력 필드 Props
interface BaseInputProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

// 텍스트 입력
interface TextInputProps
  extends BaseInputProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  variant?: 'default' | 'dark'
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, required, variant = 'default', ...props }, ref) => {
    const inputClasses = cn(
      'w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
      variant === 'default' && [
        'bg-white border-slate-200 text-slate-800 placeholder-slate-400',
        error && 'border-red-500 focus:ring-red-500',
      ],
      variant === 'dark' && [
        'bg-white/10 border-white/20 text-white placeholder-white/30',
        error && 'border-red-500/50 focus:ring-red-500',
      ],
      props.disabled && 'opacity-50 cursor-not-allowed'
    )

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className={cn(
              'block text-sm font-medium',
              variant === 'default' ? 'text-slate-700' : 'text-white/70'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && (
          <p className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className={cn(
            'text-sm',
            variant === 'default' ? 'text-slate-500' : 'text-white/50'
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
TextInput.displayName = 'TextInput'

// Textarea
interface TextareaInputProps
  extends BaseInputProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  variant?: 'default' | 'dark'
}

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  ({ label, error, helperText, required, variant = 'default', ...props }, ref) => {
    const textareaClasses = cn(
      'w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none',
      variant === 'default' && [
        'bg-white border-slate-200 text-slate-800 placeholder-slate-400',
        error && 'border-red-500 focus:ring-red-500',
      ],
      variant === 'dark' && [
        'bg-white/10 border-white/20 text-white placeholder-white/30',
        error && 'border-red-500/50 focus:ring-red-500',
      ],
      props.disabled && 'opacity-50 cursor-not-allowed'
    )

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className={cn(
              'block text-sm font-medium',
              variant === 'default' ? 'text-slate-700' : 'text-white/70'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea ref={ref} className={textareaClasses} {...props} />
        {error && (
          <p className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className={cn(
            'text-sm',
            variant === 'default' ? 'text-slate-500' : 'text-white/50'
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
TextareaInput.displayName = 'TextareaInput'

// Select
interface SelectInputProps
  extends BaseInputProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: { value: string; label: string }[]
  placeholder?: string
  variant?: 'default' | 'dark'
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    { label, error, helperText, required, options, placeholder, variant = 'default', ...props },
    ref
  ) => {
    const selectClasses = cn(
      'w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-no-repeat bg-right',
      variant === 'default' && [
        'bg-white border-slate-200 text-slate-800',
        error && 'border-red-500 focus:ring-red-500',
      ],
      variant === 'dark' && [
        'bg-white/10 border-white/20 text-white',
        error && 'border-red-500/50 focus:ring-red-500',
      ],
      props.disabled && 'opacity-50 cursor-not-allowed'
    )

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className={cn(
              'block text-sm font-medium',
              variant === 'default' ? 'text-slate-700' : 'text-white/70'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select ref={ref} className={selectClasses} {...props}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className={variant === 'dark' ? 'bg-slate-800 text-white' : ''}
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* 화살표 아이콘 */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg
              className={cn(
                'w-4 h-4',
                variant === 'default' ? 'text-slate-400' : 'text-white/50'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className={cn(
            'text-sm',
            variant === 'default' ? 'text-slate-500' : 'text-white/50'
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
SelectInput.displayName = 'SelectInput'

// Checkbox
interface CheckboxInputProps extends BaseInputProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
  ({ label, error, checked, onChange, disabled }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            className={cn(
              'w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary focus:ring-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          {label && <span className="text-sm text-slate-700">{label}</span>}
        </label>
        {error && (
          <p className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    )
  }
)
CheckboxInput.displayName = 'CheckboxInput'

// 날짜 입력
interface DateInputProps extends Omit<TextInputProps, 'type'> {
  minDate?: string
  maxDate?: string
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ minDate, maxDate, ...props }, ref) => {
    return <TextInput ref={ref} type="date" min={minDate} max={maxDate} {...props} />
  }
)
DateInput.displayName = 'DateInput'

// 시간 입력
interface TimeInputProps extends Omit<TextInputProps, 'type'> {}

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>((props, ref) => {
  return <TextInput ref={ref} type="time" {...props} />
})
TimeInput.displayName = 'TimeInput'

// 전화번호 입력 (자동 포맷팅)
export const PhoneInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/[^0-9]/g, '')

      // 자동 하이픈 추가
      if (value.length > 3 && value.length <= 7) {
        value = value.slice(0, 3) + '-' + value.slice(3)
      } else if (value.length > 7) {
        value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11)
      }

      e.target.value = value
      onChange?.(e)
    }

    return (
      <TextInput
        ref={ref}
        type="tel"
        placeholder="010-1234-5678"
        onChange={handleChange}
        maxLength={13}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = 'PhoneInput'
