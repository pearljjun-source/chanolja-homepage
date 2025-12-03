import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSplitAmounts } from '@/lib/payments/toss-client'
import { PaymentMethod, BANK_CODES, BankCode } from '@/lib/payments/types'

// POST: 결제 요청 준비 (카드 / 가상계좌)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      reservation_id,
      payment_method = 'card',
      bank // 가상계좌 선택 시 은행
    }: {
      reservation_id: string
      payment_method: PaymentMethod
      bank?: BankCode
    } = body

    if (!reservation_id) {
      return NextResponse.json(
        { success: false, error: '예약 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 가상계좌 선택 시 은행 필수
    if (payment_method === 'virtualAccount' && !bank) {
      return NextResponse.json(
        { success: false, error: '가상계좌 발급 시 은행을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 예약 정보 조회 (지점 정보 포함)
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        vehicle:vehicles(name, brand, model),
        branch:branches(id, name, submall_id, hq_submall_id)
      `)
      .eq('id', reservation_id)
      .single()

    if (reservationError || !reservation) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 결제된 예약인지 확인
    if (reservation.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: '이미 결제가 완료된 예약입니다.' },
        { status: 400 }
      )
    }

    // 지점 서브몰 ID 확인
    const branchSubMallId = reservation.branch?.submall_id || process.env.DEFAULT_BRANCH_SUBMALL_ID
    const hqSubMallId = reservation.branch?.hq_submall_id || process.env.HQ_SUBMALL_ID

    if (!branchSubMallId || !hqSubMallId) {
      return NextResponse.json(
        { success: false, error: '정산 설정이 완료되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 500 }
      )
    }

    // 주문 정보 생성
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const vehicleName = reservation.vehicle?.brand
      ? `${reservation.vehicle.brand} ${reservation.vehicle.model || reservation.vehicle.name}`
      : reservation.vehicle?.name || '차량 렌트'

    const orderName = `${vehicleName} 렌트 (${reservation.start_date} ~ ${reservation.end_date})`

    // 스플릿 정산 금액 계산 (지점 90%, 본사 10%)
    const { branchAmount, hqAmount, branchRatio, hqRatio } = calculateSplitAmounts(reservation.total_price)

    // 결제 레코드 생성
    const paymentData: Record<string, unknown> = {
      reservation_id,
      branch_id: reservation.branch_id,
      amount: reservation.total_price,
      payment_method,
      pg_provider: 'tosspayments',
      pg_order_id: orderId,
      status: payment_method === 'virtualAccount' ? 'awaiting_deposit' : 'pending',
      settlement_status: 'pending',
      // 스플릿 정산 정보
      branch_submall_id: branchSubMallId,
      hq_submall_id: hqSubMallId,
      branch_settlement_amount: branchAmount,
      hq_settlement_amount: hqAmount,
      hq_fee_rate: hqRatio,
      hq_fee_amount: hqAmount,
      settlement_amount: branchAmount
    }

    // 가상계좌의 경우 추가 정보
    if (payment_method === 'virtualAccount' && bank) {
      paymentData.virtual_account_bank = bank
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json(
        { success: false, error: paymentError.message },
        { status: 500 }
      )
    }

    // 응답 데이터 구성
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    const responseData: Record<string, unknown> = {
      payment_id: payment.id,
      payment_method,
      orderId,
      amount: reservation.total_price,
      orderName,
      customerName: reservation.customer_name,
      customerEmail: reservation.customer_email,
      customerMobilePhone: reservation.customer_phone,
      successUrl: `${baseUrl}/payment/success`,
      failUrl: `${baseUrl}/payment/fail`,
      // 스플릿 정산 정보
      splitInfo: {
        branchSubMallId,
        branchAmount,
        branchRatio,
        hqSubMallId,
        hqAmount,
        hqRatio
      }
    }

    // 가상계좌의 경우 은행 정보 추가
    if (payment_method === 'virtualAccount' && bank) {
      responseData.bank = bank
      responseData.bankCode = BANK_CODES[bank]
      responseData.virtualAccountUrl = `${baseUrl}/api/payments/virtual-account`
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Payment request error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
