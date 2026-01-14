import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { capturePaymentError } from '@/lib/sentry'

// POST: 토스페이먼츠 카드 결제 승인 (스플릿 정산)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { paymentKey, orderId, amount } = body

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // DB에서 결제 정보 조회
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payments')
      .select('*, branch:branches(submall_id, hq_submall_id)')
      .eq('pg_order_id', orderId)
      .single()

    if (fetchError || !paymentRecord) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 금액 검증
    if (paymentRecord.amount !== amount) {
      return NextResponse.json(
        { success: false, error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    // 토스페이먼츠 시크릿 키
    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: '결제 설정이 완료되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 스플릿 정산 정보 구성
    const branchSubMallId = paymentRecord.branch_submall_id || paymentRecord.branch?.submall_id
    const hqSubMallId = paymentRecord.hq_submall_id || paymentRecord.branch?.hq_submall_id

    // 토스페이먼츠 결제 승인 API 호출
    // Note: 토스페이먼츠 플랫폼 파트너 계정에서 스플릿 정산 설정이 필요합니다
    const tossRequestBody: Record<string, unknown> = {
      paymentKey,
      orderId,
      amount
    }

    // 스플릿 정산 정보가 있는 경우 추가 (플랫폼 파트너 전용)
    if (branchSubMallId && hqSubMallId) {
      // 토스페이먼츠 플랫폼 API를 사용하는 경우
      // 자동 정산 분배가 설정됨 (지점 90%, 본사 10%)
      tossRequestBody.metadata = {
        splitPayment: true,
        branchSubMallId,
        hqSubMallId,
        branchAmount: paymentRecord.branch_settlement_amount,
        hqAmount: paymentRecord.hq_settlement_amount
      }
    }

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tossRequestBody),
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      // DB에서 결제 실패 기록
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: tossData.message || '결제 승인 실패'
        })
        .eq('pg_order_id', orderId)

      return NextResponse.json(
        { success: false, error: tossData.message || '결제 승인에 실패했습니다.' },
        { status: 400 }
      )
    }

    // 결제 성공 - 트랜잭션으로 DB 업데이트 (결제 + 예약 원자적 처리)
    const { data: txResult, error: txError } = await supabase
      .rpc('complete_payment_transaction', {
        p_order_id: orderId,
        p_payment_key: paymentKey,
        p_card_company: tossData.card?.company || null,
        p_card_number: tossData.card?.number || null,
        p_installment_months: tossData.card?.installmentPlanMonths || 0,
      })

    // RPC 함수가 없는 경우 기존 방식으로 폴백
    if (txError?.code === 'PGRST202') {
      console.log('RPC function not found, using fallback method')

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          pg_transaction_id: paymentKey,
          status: 'completed',
          paid_at: new Date().toISOString(),
          card_company: tossData.card?.company || null,
          card_number: tossData.card?.number || null,
          installment_months: tossData.card?.installmentPlanMonths || 0,
          settlement_status: 'processing',
          branch_settlement_status: 'processing',
          hq_settlement_status: 'processing'
        })
        .eq('pg_order_id', orderId)
        .select('*, reservation_id')
        .single()

      if (paymentError) {
        console.error('Payment update error:', paymentError)
      }

      if (payment?.reservation_id) {
        await supabase
          .from('reservations')
          .update({
            status: 'confirmed',
            payment_status: 'paid'
          })
          .eq('id', payment.reservation_id)
      }
    } else if (txError) {
      console.error('Transaction error:', txError)
      capturePaymentError(txError, { orderId, paymentKey, amount })
      return NextResponse.json(
        { success: false, error: '결제 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    } else if (!txResult?.success) {
      return NextResponse.json(
        { success: false, error: txResult?.error || '결제 처리 실패' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: txResult?.payment_id || paymentRecord.id,
        reservationId: txResult?.reservation_id || paymentRecord.reservation_id,
        toss: tossData,
        splitInfo: {
          branchSubMallId,
          branchAmount: txResult?.branch_settlement_amount || paymentRecord.branch_settlement_amount,
          hqSubMallId,
          hqAmount: txResult?.hq_settlement_amount || paymentRecord.hq_settlement_amount,
          message: '결제가 완료되었습니다. 정산은 T+1일에 각 계좌로 입금됩니다.'
        }
      },
      message: '결제가 완료되었습니다.'
    })
  } catch (error) {
    console.error('Payment confirm error:', error)

    // Sentry에 결제 에러 보고
    capturePaymentError(error, {
      orderId: 'unknown',
      paymentKey: 'unknown',
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
