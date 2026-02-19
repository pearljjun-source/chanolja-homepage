import { z } from 'zod'

// 예약 폼 스키마
export const reservationSchema = z.object({
  customer_name: z
    .string()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요'),

  customer_phone: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(
      /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
      '올바른 휴대폰 번호 형식으로 입력해주세요 (예: 010-1234-5678)'
    ),

  customer_email: z
    .string()
    .email('올바른 이메일 형식으로 입력해주세요')
    .optional()
    .or(z.literal('')),

  start_date: z.string().min(1, '대여 시작일을 선택해주세요'),

  end_date: z.string().min(1, '반납일을 선택해주세요'),

  start_time: z.string().min(1, '대여 시작 시간을 선택해주세요'),

  end_time: z.string().min(1, '반납 시간을 선택해주세요'),

  notes: z.string().max(500, '요청사항은 500자 이하로 입력해주세요').optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date)
    }
    return true
  },
  {
    message: '반납일은 대여 시작일 이후여야 합니다',
    path: ['end_date'],
  }
)

export type ReservationFormData = z.infer<typeof reservationSchema>

// 서버사이드 예약 생성 스키마 (API에서 사용)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const reservationCreateServerSchema = z.object({
  branch_id: z.string().regex(uuidRegex, '유효하지 않은 지점 ID입니다'),
  vehicle_id: z.string().regex(uuidRegex, '유효하지 않은 차량 ID입니다'),
  customer_name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하로 입력해주세요'),
  customer_phone: z.string().min(1, '연락처를 입력해주세요').max(20, '연락처가 너무 깁니다')
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 휴대폰 번호 형식이 아닙니다'),
  customer_email: z.string().email('올바른 이메일 형식이 아닙니다').max(100).optional().or(z.literal('')).or(z.null()),
  customer_birth: z.string().max(20).optional().or(z.literal('')).or(z.null()),
  license_number: z.string().max(50).optional().or(z.literal('')).or(z.null()),
  license_type: z.string().max(20).optional().or(z.literal('')).or(z.null()),
  start_date: z.string().min(1, '대여 시작일을 선택해주세요').regex(/^\d{4}-\d{2}-\d{2}/, '날짜 형식이 올바르지 않습니다'),
  end_date: z.string().min(1, '반납일을 선택해주세요').regex(/^\d{4}-\d{2}-\d{2}/, '날짜 형식이 올바르지 않습니다'),
  start_time: z.string().max(10).optional().or(z.literal('')).or(z.null()),
  end_time: z.string().max(10).optional().or(z.literal('')).or(z.null()),
  pickup_location: z.string().max(200).optional().or(z.literal('')).or(z.null()),
  return_location: z.string().max(200).optional().or(z.literal('')).or(z.null()),
  insurance_id: z.string().regex(uuidRegex, '유효하지 않은 보험 ID입니다').optional().or(z.null()),
  options: z.record(z.string(), z.unknown()).optional().or(z.null()),
  customer_memo: z.string().max(500, '메모는 500자 이하로 입력해주세요').optional().or(z.literal('')).or(z.null()),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: '반납일은 대여 시작일 이후여야 합니다', path: ['end_date'] }
)

export type ReservationCreateServerData = z.infer<typeof reservationCreateServerSchema>

// 문의 폼 스키마
export const inquirySchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요'),

  phone: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(
      /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
      '올바른 휴대폰 번호 형식으로 입력해주세요'
    ),

  email: z
    .string()
    .email('올바른 이메일 형식으로 입력해주세요')
    .optional()
    .or(z.literal('')),

  subject: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자 이하로 입력해주세요'),

  message: z
    .string()
    .min(10, '내용은 10자 이상 입력해주세요')
    .max(2000, '내용은 2000자 이하로 입력해주세요'),

  inquiry_type: z.enum(['startup', 'rental', 'partnership', 'other'], {
    message: '문의 유형을 선택해주세요',
  }),
})

export type InquiryFormData = z.infer<typeof inquirySchema>

// 로그인 폼 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식으로 입력해주세요'),

  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(6, '비밀번호는 6자 이상이어야 합니다'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// 지점 등록 스키마
export const branchSchema = z.object({
  name: z
    .string()
    .min(2, '지점명은 2자 이상 입력해주세요')
    .max(50, '지점명은 50자 이하로 입력해주세요'),

  owner_name: z
    .string()
    .max(50, '대표자명은 50자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),

  business_number: z
    .string()
    .regex(/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/, '사업자등록번호 형식이 올바르지 않습니다 (예: 123-45-67890)')
    .optional()
    .or(z.literal('')),

  address: z.string().max(200, '주소는 200자 이하로 입력해주세요').optional().or(z.literal('')),

  phone: z
    .string()
    .regex(/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/, '전화번호 형식이 올바르지 않습니다')
    .optional()
    .or(z.literal('')),

  admin_email: z
    .string()
    .email('올바른 이메일 형식으로 입력해주세요')
    .optional()
    .or(z.literal('')),

  website_url: z
    .string()
    .url('올바른 URL 형식으로 입력해주세요')
    .optional()
    .or(z.literal('')),

  branch_type: z.enum(['rental', 'camping', 'both']),

  is_active: z.boolean(),
})

export type BranchFormData = z.infer<typeof branchSchema>

// 차량 등록 스키마
export const vehicleSchema = z.object({
  name: z
    .string()
    .min(1, '차량명을 입력해주세요')
    .max(100, '차량명은 100자 이하로 입력해주세요'),

  brand: z
    .string()
    .max(50, '브랜드명은 50자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),

  model_year: z
    .number()
    .min(2000, '연식은 2000년 이상이어야 합니다')
    .max(new Date().getFullYear() + 1, '유효한 연식을 입력해주세요')
    .optional()
    .or(z.nan()),

  vehicle_type: z.enum(['sedan', 'suv', 'van', 'truck', 'camper', 'luxury'], {
    message: '차량 유형을 선택해주세요',
  }),

  fuel_type: z.enum(['gasoline', 'diesel', 'lpg', 'electric', 'hybrid'], {
    message: '연료 유형을 선택해주세요',
  }),

  seats: z
    .number()
    .min(1, '좌석수는 1 이상이어야 합니다')
    .max(50, '좌석수는 50 이하여야 합니다'),

  price_per_day: z
    .number()
    .min(0, '가격은 0 이상이어야 합니다')
    .max(10000000, '가격이 너무 높습니다'),

  license_plate: z
    .string()
    .max(20, '차량번호는 20자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),

  description: z
    .string()
    .max(1000, '설명은 1000자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),

  is_active: z.boolean(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
