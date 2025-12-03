// 토스페이먼츠 스플릿 결제 타입 정의

export type PaymentMethod = 'card' | 'virtualAccount'

export type PaymentStatus = 'pending' | 'awaiting_deposit' | 'completed' | 'failed' | 'cancelled' | 'refunded'

export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed'

// 스플릿 정산 비율 설정
export const SPLIT_RATIO = {
  BRANCH: 90, // 지점 90%
  HQ: 10      // 본사 10%
} as const

// 토스페이먼츠 스플릿 결제 요청 타입
export interface TossSplitInfo {
  // 지점 정산 정보
  branchSettlement: {
    subMallId: string       // 지점 서브몰 ID
    ratio: number           // 정산 비율 (90)
    amount?: number         // 실제 정산 금액
  }
  // 본사 정산 정보
  hqSettlement: {
    subMallId: string       // 본사 서브몰 ID
    ratio: number           // 정산 비율 (10)
    amount?: number         // 실제 정산 금액
  }
}

// 결제 요청 파라미터
export interface PaymentRequestParams {
  reservationId: string
  paymentMethod: PaymentMethod
  branchSubMallId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
}

// 카드 결제 요청
export interface CardPaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail?: string
  customerMobilePhone: string
  successUrl: string
  failUrl: string
  // 스플릿 정산 정보
  splitDetails?: {
    type: 'RATIO' | 'AMOUNT'
    subMalls: Array<{
      subMallId: string
      amount?: number
      ratio?: number
    }>
  }
}

// 가상계좌 결제 요청
export interface VirtualAccountRequest {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail?: string
  customerMobilePhone: string
  bank: string                    // 은행 코드 (예: '국민', '신한', '우리' 등)
  validHours?: number             // 입금 유효 시간 (기본 168시간 = 7일)
  cashReceipt?: {
    type: 'personal' | 'business'
    registrationNumber?: string
  }
  // 스플릿 정산 정보
  splitDetails?: {
    type: 'RATIO' | 'AMOUNT'
    subMalls: Array<{
      subMallId: string
      amount?: number
      ratio?: number
    }>
  }
}

// 토스페이먼츠 결제 승인 응답
export interface TossPaymentConfirmResponse {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  requestedAt: string
  approvedAt?: string
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
  }
  virtualAccount?: {
    accountNumber: string
    bank: string
    customerName: string
    dueDate: string
    refundStatus: string
  }
  splits?: Array<{
    subMallId: string
    amount: number
    status: string
  }>
}

// 가상계좌 발급 응답
export interface VirtualAccountIssueResponse {
  paymentKey: string
  orderId: string
  status: 'WAITING_FOR_DEPOSIT'
  virtualAccount: {
    accountType: string
    accountNumber: string
    bank: string
    customerName: string
    dueDate: string
    expired: boolean
  }
  totalAmount: number
}

// 가상계좌 입금 완료 웹훅 데이터
export interface VirtualAccountDepositWebhook {
  eventType: 'PAYMENT_STATUS_CHANGED'
  paymentKey: string
  orderId: string
  status: 'DONE'
  secret: string
  createdAt: string
}

// 결제 정보 (DB 저장용)
export interface PaymentRecord {
  id: string
  reservation_id: string
  branch_id: string
  amount: number
  payment_method: PaymentMethod
  pg_provider: 'tosspayments'
  pg_order_id: string
  pg_transaction_id?: string
  status: PaymentStatus
  settlement_status: SettlementStatus
  // 스플릿 정산 정보
  branch_submall_id: string
  hq_submall_id: string
  branch_settlement_amount: number
  hq_settlement_amount: number
  branch_settlement_status?: SettlementStatus
  hq_settlement_status?: SettlementStatus
  // 카드 정보
  card_company?: string
  card_number?: string
  installment_months?: number
  // 가상계좌 정보
  virtual_account_number?: string
  virtual_account_bank?: string
  virtual_account_holder?: string
  virtual_account_due_date?: string
  // 기타
  paid_at?: string
  cancelled_at?: string
  refund_amount?: number
  created_at: string
  updated_at: string
}

// 은행 코드 매핑
export const BANK_CODES = {
  '경남': 'KYONGNAMBANK',
  '광주': 'GWANGJUBANK',
  '국민': 'KOOKMIN',
  '기업': 'IBK',
  '농협': 'NONGHYUP',
  '대구': 'DAEGUBANK',
  '부산': 'BUSANBANK',
  '산업': 'KDB',
  '새마을': 'SAEMAUL',
  '수협': 'SUHYUP',
  '신한': 'SHINHAN',
  '신협': 'SHINHYUP',
  '씨티': 'CITI',
  '우리': 'WOORI',
  '우체국': 'POST',
  '전북': 'JEONBUKBANK',
  '제주': 'JEJUBANK',
  '카카오뱅크': 'KAKAOBANK',
  '케이뱅크': 'KBANK',
  '토스뱅크': 'TOSSBANK',
  '하나': 'HANA',
  'SC제일': 'SC',
} as const

export type BankCode = keyof typeof BANK_CODES
