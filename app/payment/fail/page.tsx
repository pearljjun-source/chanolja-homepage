'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'

function PaymentFailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const code = searchParams.get('code')
  const message = searchParams.get('message')

  function getErrorMessage(code: string | null): string {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.'
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거절했습니다.'
      case 'INVALID_CARD_EXPIRATION':
        return '카드 유효기간이 만료되었습니다.'
      case 'EXCEED_MAX_CARD_INSTALLMENT_PLAN':
        return '할부 개월 수가 초과되었습니다.'
      case 'NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT':
        return '지원하지 않는 할부 개월입니다.'
      case 'INVALID_CARD_NUMBER':
        return '유효하지 않은 카드번호입니다.'
      case 'INVALID_CARD_LOST_OR_STOLEN':
        return '분실 또는 도난 카드입니다.'
      case 'RESTRICTED_CARD':
        return '사용이 제한된 카드입니다.'
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 횟수를 초과했습니다.'
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 한도를 초과했습니다.'
      default:
        return message || '결제 처리 중 오류가 발생했습니다.'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <XCircle className="w-20 h-20 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold">결제에 실패했습니다</h1>
            <p className="text-gray-600 mt-2">{getErrorMessage(code)}</p>
          </div>

          {code && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-500">
                오류 코드: {code}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              다시 시도하기
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  )
}
