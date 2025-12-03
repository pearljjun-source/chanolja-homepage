'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { SPLIT_RATIO } from '@/lib/payments/types'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<{
    amount: number
    orderName: string
    cardCompany?: string
    cardNumber?: string
    branchAmount: number
    hqAmount: number
  } | null>(null)

  useEffect(() => {
    if (paymentKey && orderId && amount) {
      confirmPayment()
    }
  }, [paymentKey, orderId, amount])

  async function confirmPayment() {
    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount)
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setPaymentInfo({
        amount: data.data.payment.amount,
        orderName: data.data.toss.orderName,
        cardCompany: data.data.toss.card?.company,
        cardNumber: data.data.toss.card?.number,
        branchAmount: data.data.splitInfo.branchAmount,
        hqAmount: data.data.splitInfo.hqAmount
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 승인에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
          <h1 className="text-2xl font-bold mb-2">결제 처리 중...</h1>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-3xl">!</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">결제 승인 실패</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold">결제가 완료되었습니다</h1>
            <p className="text-gray-600 mt-2">예약이 확정되었습니다.</p>
          </div>

          {paymentInfo && (
            <div className="space-y-6">
              {/* 결제 정보 */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4">결제 정보</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상품</span>
                    <span className="font-semibold">{paymentInfo.orderName}</span>
                  </div>
                  {paymentInfo.cardCompany && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">결제수단</span>
                      <span>{paymentInfo.cardCompany} {paymentInfo.cardNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold">결제 금액</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(paymentInfo.amount)}원
                    </span>
                  </div>
                </div>
              </div>

              {/* 정산 안내 */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-3">정산 안내</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>지점 정산 ({SPLIT_RATIO.BRANCH}%)</span>
                    <span className="font-semibold">{formatPrice(paymentInfo.branchAmount)}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>본사 정산 ({SPLIT_RATIO.HQ}%)</span>
                    <span className="font-semibold">{formatPrice(paymentInfo.hqAmount)}원</span>
                  </div>
                  <p className="mt-3 text-xs">
                    결제 금액은 T+1일에 각 계좌로 자동 정산됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
          <h1 className="text-2xl font-bold mb-2">결제 처리 중...</h1>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
