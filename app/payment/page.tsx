'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, Building, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { BANK_CODES, BankCode, SPLIT_RATIO } from '@/lib/payments/types'

type PaymentMethod = 'card' | 'virtualAccount'

interface PaymentData {
  payment_id: string
  payment_method: PaymentMethod
  orderId: string
  amount: number
  orderName: string
  customerName: string
  customerEmail?: string
  customerMobilePhone: string
  successUrl: string
  failUrl: string
  splitInfo: {
    branchSubMallId: string
    branchAmount: number
    branchRatio: number
    hqSubMallId: string
    hqAmount: number
    hqRatio: number
  }
  bank?: BankCode
  bankCode?: string
}

interface VirtualAccountInfo {
  accountNumber: string
  bank: string
  customerName: string
  dueDate: string
  amount: number
}

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = searchParams.get('reservation_id')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [selectedBank, setSelectedBank] = useState<BankCode | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [virtualAccountInfo, setVirtualAccountInfo] = useState<VirtualAccountInfo | null>(null)

  // 예약 정보 조회
  const [reservationInfo, setReservationInfo] = useState<{
    vehicleName: string
    startDate: string
    endDate: string
    totalPrice: number
    branchName: string
  } | null>(null)

  useEffect(() => {
    if (reservationId) {
      fetchReservationInfo()
    }
  }, [reservationId])

  async function fetchReservationInfo() {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`)
      const data = await res.json()
      if (data.success) {
        const r = data.data
        setReservationInfo({
          vehicleName: r.vehicle?.brand
            ? `${r.vehicle.brand} ${r.vehicle.model || r.vehicle.name}`
            : r.vehicle?.name || '차량',
          startDate: r.start_date,
          endDate: r.end_date,
          totalPrice: r.total_price,
          branchName: r.branch?.name || ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch reservation:', err)
    }
  }

  // 결제 요청
  async function handlePaymentRequest() {
    if (!reservationId) {
      setError('예약 정보가 없습니다.')
      return
    }

    if (paymentMethod === 'virtualAccount' && !selectedBank) {
      setError('입금하실 은행을 선택해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservationId,
          payment_method: paymentMethod,
          bank: selectedBank
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setPaymentData(data.data)

      if (paymentMethod === 'card') {
        // 토스페이먼츠 결제 위젯 실행
        await initTossPayment(data.data)
      } else {
        // 가상계좌 발급
        await issueVirtualAccount(data.data.payment_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 요청에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 토스페이먼츠 결제 위젯 초기화
  async function initTossPayment(data: PaymentData) {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY

    if (!clientKey) {
      setError('결제 설정이 완료되지 않았습니다.')
      return
    }

    // @ts-expect-error - TossPayments SDK
    const tossPayments = window.TossPayments(clientKey)

    try {
      await tossPayments.requestPayment('카드', {
        amount: data.amount,
        orderId: data.orderId,
        orderName: data.orderName,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerMobilePhone: data.customerMobilePhone,
        successUrl: data.successUrl,
        failUrl: data.failUrl
      })
    } catch (err) {
      if (err instanceof Error && err.message !== 'USER_CANCEL') {
        setError('결제가 취소되었습니다.')
      }
    }
  }

  // 가상계좌 발급
  async function issueVirtualAccount(paymentId: string) {
    try {
      const res = await fetch('/api/payments/virtual-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          bank: selectedBank
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setVirtualAccountInfo({
        accountNumber: data.data.accountNumber,
        bank: data.data.bankName,
        customerName: data.data.customerName,
        dueDate: data.data.dueDate,
        amount: data.data.amount
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '가상계좌 발급에 실패했습니다.')
    }
  }

  // 금액 포맷
  function formatPrice(price: number) {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  // 날짜 포맷
  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!reservationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">예약 정보가 없습니다</h1>
          <p className="text-gray-600 mb-4">올바른 경로로 접근해주세요.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    )
  }

  // 가상계좌 발급 완료 화면
  if (virtualAccountInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-bold">가상계좌가 발급되었습니다</h1>
              <p className="text-gray-600 mt-2">아래 계좌로 입금해주세요</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">은행</span>
                <span className="font-semibold">{virtualAccountInfo.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">계좌번호</span>
                <span className="font-mono font-semibold">{virtualAccountInfo.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">예금주</span>
                <span className="font-semibold">{virtualAccountInfo.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">입금액</span>
                <span className="font-bold text-xl text-blue-600">
                  {formatPrice(virtualAccountInfo.amount)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">입금기한</span>
                <span className="text-red-600 font-semibold">
                  {formatDate(virtualAccountInfo.dueDate)}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                입금 기한 내에 정확한 금액을 입금해주세요.
                입금이 확인되면 예약이 자동으로 확정됩니다.
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">정산 안내</h3>
              <p className="text-sm text-blue-800">
                입금 확인 후 지점({SPLIT_RATIO.BRANCH}%)과 본사({SPLIT_RATIO.HQ}%)로 자동 분배되어 T+1일에 정산됩니다.
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* 토스페이먼츠 SDK 로드 */}
      <script src="https://js.tosspayments.com/v1/payment" />

      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">결제하기</h1>

        {/* 예약 정보 */}
        {reservationInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">예약 정보</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">차량</span>
                <span className="font-semibold">{reservationInfo.vehicleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">지점</span>
                <span>{reservationInfo.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">대여기간</span>
                <span>{reservationInfo.startDate} ~ {reservationInfo.endDate}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">결제 금액</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatPrice(reservationInfo.totalPrice)}원
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 결제 방법 선택 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">결제 방법</h2>

          <div className="space-y-3">
            {/* 신용카드 */}
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                paymentMethod === 'card' ? 'bg-blue-600' : 'bg-gray-100'
              }`}>
                <CreditCard className={paymentMethod === 'card' ? 'text-white' : 'text-gray-600'} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">신용카드</div>
                <div className="text-sm text-gray-500">모든 카드 결제 가능</div>
              </div>
              <ChevronRight className="text-gray-400" />
            </button>

            {/* 계좌이체 (가상계좌) */}
            <button
              onClick={() => setPaymentMethod('virtualAccount')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                paymentMethod === 'virtualAccount'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                paymentMethod === 'virtualAccount' ? 'bg-blue-600' : 'bg-gray-100'
              }`}>
                <Building className={paymentMethod === 'virtualAccount' ? 'text-white' : 'text-gray-600'} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">계좌이체</div>
                <div className="text-sm text-gray-500">가상계좌 발급 후 입금</div>
              </div>
              <ChevronRight className="text-gray-400" />
            </button>
          </div>

          {/* 은행 선택 (가상계좌) */}
          {paymentMethod === 'virtualAccount' && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">입금 은행 선택</h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(BANK_CODES) as BankCode[]).map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                      selectedBank === bank
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 정산 안내 */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">자동 정산 안내</h3>
          <p className="text-sm text-blue-800">
            결제 금액은 토스페이먼츠 스플릿 결제를 통해 지점({SPLIT_RATIO.BRANCH}%)과
            본사({SPLIT_RATIO.HQ}%)로 자동 분배되어 각 계좌로 정산됩니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handlePaymentRequest}
          disabled={isLoading || (paymentMethod === 'virtualAccount' && !selectedBank)}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            isLoading || (paymentMethod === 'virtualAccount' && !selectedBank)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading
            ? '처리 중...'
            : paymentMethod === 'card'
              ? `${reservationInfo ? formatPrice(reservationInfo.totalPrice) : ''}원 결제하기`
              : '가상계좌 발급받기'
          }
        </button>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
