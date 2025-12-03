// 토스페이먼츠 API 클라이언트

import { SPLIT_RATIO, BANK_CODES, BankCode } from './types'

const TOSS_API_BASE = 'https://api.tosspayments.com/v1'

// 토스페이먼츠 인증 헤더 생성
function getAuthHeader(): string {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY
  if (!secretKey) {
    throw new Error('TOSS_PAYMENTS_SECRET_KEY is not configured')
  }
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
}

// 스플릿 정산 금액 계산
export function calculateSplitAmounts(totalAmount: number) {
  const hqAmount = Math.round(totalAmount * SPLIT_RATIO.HQ / 100)
  const branchAmount = totalAmount - hqAmount // 반올림 오차 방지

  return {
    branchAmount,
    hqAmount,
    branchRatio: SPLIT_RATIO.BRANCH,
    hqRatio: SPLIT_RATIO.HQ
  }
}

// 카드 결제 위젯용 데이터 생성
export function createCardPaymentData(params: {
  orderId: string
  amount: number
  orderName: string
  customerName: string
  customerEmail?: string
  customerMobilePhone: string
  branchSubMallId: string
  hqSubMallId: string
  successUrl: string
  failUrl: string
}) {
  const { branchAmount, hqAmount } = calculateSplitAmounts(params.amount)

  return {
    amount: params.amount,
    orderId: params.orderId,
    orderName: params.orderName,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerMobilePhone: params.customerMobilePhone,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    // 스플릿 정산 정보 (결제 위젯에서 사용)
    metadata: {
      splitPayment: true,
      branchSubMallId: params.branchSubMallId,
      hqSubMallId: params.hqSubMallId,
      branchAmount,
      hqAmount
    }
  }
}

// 카드 결제 승인 (스플릿 정산 포함)
export async function confirmCardPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
  branchSubMallId: string
  hqSubMallId: string
}) {
  const { branchAmount, hqAmount } = calculateSplitAmounts(params.amount)

  const response = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
      // 스플릿 정산 설정
      // 토스페이먼츠 플랫폼 결제 API 사용시
      // Note: 실제 스플릿 정산은 토스페이먼츠 대시보드에서 서브몰 설정이 필요합니다
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '결제 승인에 실패했습니다.')
  }

  return {
    ...data,
    splitInfo: {
      branchSubMallId: params.branchSubMallId,
      branchAmount,
      hqSubMallId: params.hqSubMallId,
      hqAmount
    }
  }
}

// 가상계좌 발급 (스플릿 정산 포함)
export async function issueVirtualAccount(params: {
  orderId: string
  amount: number
  orderName: string
  customerName: string
  customerEmail?: string
  customerMobilePhone: string
  bank: BankCode
  validHours?: number
  branchSubMallId: string
  hqSubMallId: string
}) {
  const { branchAmount, hqAmount } = calculateSplitAmounts(params.amount)
  const bankCode = BANK_CODES[params.bank]

  const response = await fetch(`${TOSS_API_BASE}/virtual-accounts`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerMobilePhone: params.customerMobilePhone,
      bank: bankCode,
      validHours: params.validHours || 168, // 기본 7일
      // 스플릿 정산 정보는 입금 확인 시 처리
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '가상계좌 발급에 실패했습니다.')
  }

  return {
    ...data,
    splitInfo: {
      branchSubMallId: params.branchSubMallId,
      branchAmount,
      hqSubMallId: params.hqSubMallId,
      hqAmount
    }
  }
}

// 결제 조회
export async function getPayment(paymentKey: string) {
  const response = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(),
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '결제 조회에 실패했습니다.')
  }

  return data
}

// 결제 취소
export async function cancelPayment(params: {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number
}) {
  const response = await fetch(`${TOSS_API_BASE}/payments/${params.paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason: params.cancelReason,
      cancelAmount: params.cancelAmount,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '결제 취소에 실패했습니다.')
  }

  return data
}

// 웹훅 시크릿 검증
export function verifyWebhookSecret(receivedSecret: string): boolean {
  const webhookSecret = process.env.TOSS_PAYMENTS_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('TOSS_PAYMENTS_WEBHOOK_SECRET is not configured')
    return false
  }
  return receivedSecret === webhookSecret
}
