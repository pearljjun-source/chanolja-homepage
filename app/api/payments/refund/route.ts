import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: 결제 환불
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { payment_id, refund_amount, refund_reason } = body

    if (!payment_id) {
      return NextResponse.json(
        { success: false, error: '결제 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (payment.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: '완료된 결제만 환불 가능합니다.' },
        { status: 400 }
      )
    }

    const actualRefundAmount = refund_amount || payment.amount

    // 토스페이먼츠 시크릿 키
    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: '결제 설정이 완료되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 토스페이먼츠 환불 API 호출
    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${payment.pg_transaction_id}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: refund_reason || '고객 요청 환불',
          cancelAmount: actualRefundAmount
        }),
      }
    )

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      return NextResponse.json(
        { success: false, error: tossData.message || '환불 처리에 실패했습니다.' },
        { status: 400 }
      )
    }

    // 환불 성공 - DB 업데이트
    const isFullRefund = actualRefundAmount >= payment.amount
    const newStatus = isFullRefund ? 'refunded' : 'partial_refund'

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        refund_amount: actualRefundAmount,
        refund_reason: refund_reason || '고객 요청 환불',
        refunded_at: new Date().toISOString()
      })
      .eq('id', payment_id)
      .select()
      .single()

    if (updateError) {
      console.error('Payment refund update error:', updateError)
    }

    // 예약 상태 업데이트 (전액 환불 시)
    if (isFullRefund && payment.reservation_id) {
      await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          cancelled_at: new Date().toISOString(),
          cancel_reason: refund_reason || '결제 환불'
        })
        .eq('id', payment.reservation_id)

      // 차량 상태 복구
      const { data: reservation } = await supabase
        .from('reservations')
        .select('vehicle_id')
        .eq('id', payment.reservation_id)
        .single()

      if (reservation?.vehicle_id) {
        await supabase
          .from('vehicles')
          .update({ status: 'available' })
          .eq('id', reservation.vehicle_id)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payment: updatedPayment,
        refund: tossData
      },
      message: `${actualRefundAmount.toLocaleString()}원이 환불되었습니다.`
    })
  } catch (error) {
    console.error('Payment refund error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
