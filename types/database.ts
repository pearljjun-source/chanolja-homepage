// =====================================================
// 기존 타입
// =====================================================

export interface News {
  id: string
  title: string
  content: string
  category: 'Media' | 'Business' | 'Partnership' | 'Milestone' | 'Event'
  thumbnail_url: string | null
  is_published: boolean
  published_at: string
  created_at: string
  updated_at: string
  view_count?: number
}

export interface Branch {
  id: string
  name: string
  region: string
  address: string
  phone: string | null
  manager: string | null
  owner_name: string | null
  type: 'rentcar' | 'camping' | 'both'
  latitude: number | null
  longitude: number | null
  lat: number | null
  lng: number | null
  website_url: string | null
  subdomain: string | null
  api_key: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
  // 추가 필드
  business_hours: string | null
  description: string | null
  introduction: string | null
  logo_url: string | null
  banner_url: string | null
  // 관리자 필드
  admin_email: string | null
  // 스플릿 결제 필드
  submall_id: string | null
  hq_submall_id: string | null
  bank_account_number: string | null
  bank_name: string | null
  bank_holder_name: string | null
}

export interface Inquiry {
  id: string
  name: string
  phone: string
  email: string | null
  region: string | null
  inquiry_type: 'branch' | 'corporation' | 'camping' | 'other'
  message: string
  is_read: boolean
  created_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: string
  description: string | null
}

// =====================================================
// 차량 관련 타입
// =====================================================

export type VehicleType = 'sedan' | 'suv' | 'van' | 'truck' | 'camper' | 'luxury'
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'reserved'
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'lpg'
export type TransmissionType = 'automatic' | 'manual'

export interface Vehicle {
  id: string
  branch_id: string

  // 기본 정보
  name: string
  brand: string | null
  model: string | null
  year: number | null
  license_plate: string | null
  vehicle_type: VehicleType

  // 가격
  price_per_day: number
  price_per_hour: number | null
  deposit: number

  // 상세 정보
  color: string | null
  seats: number
  fuel_type: FuelType | null
  transmission: TransmissionType | null
  mileage: number | null

  // 이미지
  images: string[]
  thumbnail_url: string | null

  // 설명
  description: string | null
  features: string[]

  // 상태
  status: VehicleStatus
  is_active: boolean

  created_at: string
  updated_at: string

  // 조인 데이터
  branch?: Branch
  insurance?: VehicleInsurance
}

// =====================================================
// 보험 관련 타입
// =====================================================

export type InsuranceType = 'comprehensive' | 'liability_only'

export interface InsuranceCoverage {
  liability_per_person: number      // 대인 1인당 한도
  liability_per_accident: number    // 대인 1사고당 한도
  property_damage: number           // 대물 한도
  uninsured_motorist: number        // 무보험차 상해
  self_damage: boolean              // 자차 손해 가입여부
  self_damage_deductible: number    // 자차 자기부담금
}

export interface VehicleInsurance {
  id: string
  vehicle_id: string
  branch_id: string

  // 보험 기본 정보
  insurance_company: string
  policy_number: string | null
  insurance_type: InsuranceType

  // 보장 내용
  coverage: InsuranceCoverage

  // 보험 기간
  start_date: string
  end_date: string

  // 보험료
  annual_premium: number | null
  monthly_premium: number | null

  // 서류
  document_url: string | null

  is_active: boolean
  created_at: string
  updated_at: string

  // 조인 데이터
  vehicle?: Vehicle
  branch?: Branch
}

// =====================================================
// 예약 관련 타입
// =====================================================

export type ReservationStatus =
  | 'pending'     // 예약 대기
  | 'approved'    // 승인됨
  | 'confirmed'   // 결제 완료 확정
  | 'in_use'      // 이용중
  | 'completed'   // 완료
  | 'cancelled'   // 취소

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type LicenseType = '1종보통' | '2종보통' | '1종대형' | '2종소형'

export interface ReservationOptions {
  child_seat?: boolean
  gps?: boolean
  wifi?: boolean
  insurance_premium?: boolean
  [key: string]: boolean | undefined
}

export interface Reservation {
  id: string
  branch_id: string
  vehicle_id: string
  reservation_number: string

  // 고객 정보
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_birth: string | null
  license_number: string | null
  license_type: LicenseType | null

  // 예약 기간
  start_date: string
  end_date: string
  start_time: string
  end_time: string

  // 픽업/반납 장소
  pickup_location: string | null
  return_location: string | null

  // 가격
  base_price: number
  discount_amount: number
  insurance_fee: number
  additional_fee: number
  total_price: number

  // 추가 옵션
  options: ReservationOptions

  // 상태
  status: ReservationStatus
  payment_status: PaymentStatus

  // 메모
  customer_memo: string | null
  admin_memo: string | null

  // 취소 정보
  cancelled_at: string | null
  cancel_reason: string | null

  created_at: string
  updated_at: string

  // 조인 데이터
  vehicle?: Vehicle
  branch?: Branch
  payments?: Payment[]
}

// =====================================================
// 결제 관련 타입
// =====================================================

export type PaymentMethod = 'card' | 'bank_transfer' | 'kakao_pay' | 'naver_pay' | 'cash'
export type PGProvider = 'tosspayments' | 'inicis' | 'nicepay' | 'kakao' | 'naver'
export type PaymentStatusType =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partial_refund'

export type SettlementStatus = 'pending' | 'processing' | 'completed'

export interface Payment {
  id: string
  reservation_id: string
  branch_id: string

  // 결제 금액
  amount: number

  // 결제 수단
  payment_method: PaymentMethod

  // PG 정보
  pg_provider: PGProvider | null
  pg_transaction_id: string | null
  pg_order_id: string | null

  // 카드 정보
  card_company: string | null
  card_number: string | null
  installment_months: number

  // 상태
  status: PaymentStatusType

  // 환불 정보
  refund_amount: number
  refund_reason: string | null
  refunded_at: string | null

  // 정산 정보
  settlement_status: SettlementStatus
  settlement_amount: number | null
  settlement_date: string | null
  hq_fee_rate: number
  hq_fee_amount: number | null

  paid_at: string | null
  created_at: string
  updated_at: string

  // 조인 데이터
  reservation?: Reservation
  branch?: Branch
}

// =====================================================
// API 응답 타입
// =====================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =====================================================
// 통계 타입
// =====================================================

export interface BranchRevenueStats {
  branch_id: string
  branch_name: string
  total_reservations: number
  completed_reservations: number
  total_revenue: number
  total_hq_fee: number
}

export interface DashboardStats {
  totalVehicles: number
  availableVehicles: number
  totalReservations: number
  pendingReservations: number
  todayReservations: number
  monthlyRevenue: number
  expiringInsurances: number
}

// =====================================================
// 토스페이먼츠 타입
// =====================================================

export interface TossPaymentRequest {
  orderId: string
  amount: number
  orderName: string
  customerName: string
  customerEmail?: string
  customerMobilePhone?: string
  successUrl: string
  failUrl: string
}

export interface TossPaymentConfirm {
  paymentKey: string
  orderId: string
  amount: number
}

export interface TossPaymentResponse {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
  }
}

// =====================================================
// 리뷰 관련 타입
// =====================================================

export interface Review {
  id: string
  branch_id: string
  vehicle_id: string | null

  // 고객 정보
  customer_name: string
  customer_phone: string | null

  // 리뷰 내용
  rating: number // 1-5
  content: string
  vehicle_name: string | null

  // 상태
  is_approved: boolean
  is_visible: boolean

  // 타임스탬프
  created_at: string
  updated_at: string

  // 조인 데이터
  branch?: Branch
  vehicle?: Vehicle
}
