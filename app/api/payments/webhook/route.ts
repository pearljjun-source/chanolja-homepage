import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * HMAC-SHA256 서명 검증 (타이밍 공격 방지)
 * 토스페이먼츠 웹훅 서명 검증 방식을 따름
 */
function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  try {
    // 토스페이먼츠 서명 포맷: t={timestamp},v1={signature}
    const parts = signature.split(',')
    const timestampPart = parts.find(p => p.startsWith('t='))
    const signaturePart = parts.find(p => p.startsWith('v1='))

    if (!timestampPart || !signaturePart) {
      // 레거시 방식: 단순 시크릿 비교 (기존 호환성)
      const expectedBuffer = Buffer.from(secret, 'utf8')
      const actualBuffer = Buffer.from(signature, 'utf8')
      if (expectedBuffer.length !== actualBuffer.length) return false
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    }

    const timestamp = timestampPart.replace('t=', '')
    const receivedSignature = signaturePart.replace('v1=', '')

    // 5분 이상 지난 요청은 거부 (리플레이 공격 방지)
    const timestampMs = parseInt(timestamp, 10)
    const now = Date.now()
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.error('Webhook timestamp expired:', { timestamp, now })
      return false
    }

    // HMAC-SHA256 서명 생성
    const signaturePayload = `${timestamp}.${rawBody}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload, 'utf8')
      .digest('hex')

    // 타이밍 안전 비교
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const actualBuffer = Buffer.from(receivedSignature, 'hex')

    if (expectedBuffer.length !== actualBuffer.length) return false
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// POST: 토스페이먼츠 웹훅 (가상계좌 입금 확인 등)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Raw body를 먼저 추출 (서명 검증용)
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // 웹훅 시크릿 검증 (HMAC-SHA256)
    const webhookSecret = process.env.TOSS_PAYMENTS_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('Toss-Signature') || body.secret

      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('Webhook signature verification failed')
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const { eventType, data } = body

    console.log('Received webhook:', eventType, data)

    switch (eventType) {
      // 가상계좌 입금 완료
      case 'PAYMENT_STATUS_CHANGED':
        if (data.status === 'DONE') {
          await handlePaymentCompleted(supabase, data)
        } else if (data.status === 'CANCELED') {
          await handlePaymentCanceled(supabase, data)
        } else if (data.status === 'EXPIRED') {
          await handlePaymentExpired(supabase, data)
        }
        break

      // 정산 완료 (플랫폼 파트너 전용)
      case 'SETTLEMENT_COMPLETED':
        await handleSettlementCompleted(supabase, data)
        break

      // 정산 실패
      case 'SETTLEMENT_FAILED':
        await handleSettlementFailed(supabase, data)
        break

      default:
        console.log('Unhandled webhook event:', eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 결제 완료 처리 (가상계좌 입금 완료)
async function handlePaymentCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: { orderId?: string; paymentKey?: string }
) {
  const { orderId, paymentKey } = data

  if (!orderId) {
    console.error('Missing orderId in webhook data')
    return
  }

  // 결제 정보 조회
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('pg_order_id', orderId)
    .single()

  if (fetchError || !payment) {
    console.error('Payment not found for orderId:', orderId)
    return
  }

  // 결제 상태 업데이트
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      pg_transaction_id: paymentKey || payment.pg_transaction_id,
      paid_at: new Date().toISOString(),
      // 정산 상태 - 입금 완료 후 자동 정산 시작
      settlement_status: 'processing',
      branch_settlement_status: 'processing',
      hq_settlement_status: 'processing'
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('Failed to update payment:', updateError)
    return
  }

  // 예약 상태 업데이트
  if (payment.reservation_id) {
    await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        payment_status: 'paid'
      })
      .eq('id', payment.reservation_id)
  }

  console.log('Payment completed:', orderId, {
    branchAmount: payment.branch_settlement_amount,
    hqAmount: payment.hq_settlement_amount
  })
}

// 결제 취소 처리
async function handlePaymentCanceled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: { orderId?: string }
) {
  const { orderId } = data

  if (!orderId) return

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('pg_order_id', orderId)
    .single()

  if (!payment) return

  await supabase
    .from('payments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', payment.id)

  if (payment.reservation_id) {
    await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        payment_status: 'refunded'
      })
      .eq('id', payment.reservation_id)
  }

  console.log('Payment canceled:', orderId)
}

// 결제 만료 처리 (가상계좌 입금 기한 만료)
async function handlePaymentExpired(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: { orderId?: string }
) {
  const { orderId } = data

  if (!orderId) return

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('pg_order_id', orderId)
    .single()

  if (!payment) return

  await supabase
    .from('payments')
    .update({
      status: 'failed',
      error_message: '입금 기한이 만료되었습니다.'
    })
    .eq('id', payment.id)

  if (payment.reservation_id) {
    await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        payment_status: 'expired'
      })
      .eq('id', payment.reservation_id)
  }

  console.log('Payment expired:', orderId)
}

// 정산 완료 처리 (플랫폼 파트너 전용)
async function handleSettlementCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: {
    orderId?: string
    subMallId?: string
    settlementAmount?: number
  }
) {
  const { orderId, subMallId, settlementAmount } = data

  if (!orderId || !subMallId) return

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('pg_order_id', orderId)
    .single()

  if (!payment) return

  // 지점 정산인지 본사 정산인지 확인
  const isBranchSettlement = subMallId === payment.branch_submall_id
  const isHqSettlement = subMallId === payment.hq_submall_id

  const updateData: Record<string, unknown> = {}

  if (isBranchSettlement) {
    updateData.branch_settlement_status = 'completed'
    updateData.branch_settled_at = new Date().toISOString()
    updateData.branch_settled_amount = settlementAmount
  }

  if (isHqSettlement) {
    updateData.hq_settlement_status = 'completed'
    updateData.hq_settled_at = new Date().toISOString()
    updateData.hq_settled_amount = settlementAmount
  }

  // 모두 정산 완료되었는지 확인
  const { data: updatedPayment } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', payment.id)
    .select()
    .single()

  if (updatedPayment?.branch_settlement_status === 'completed' &&
      updatedPayment?.hq_settlement_status === 'completed') {
    await supabase
      .from('payments')
      .update({ settlement_status: 'completed' })
      .eq('id', payment.id)
  }

  console.log('Settlement completed:', orderId, subMallId, settlementAmount)
}

// 정산 실패 처리
async function handleSettlementFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: {
    orderId?: string
    subMallId?: string
    failReason?: string
  }
) {
  const { orderId, subMallId, failReason } = data

  if (!orderId || !subMallId) return

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('pg_order_id', orderId)
    .single()

  if (!payment) return

  const isBranchSettlement = subMallId === payment.branch_submall_id
  const isHqSettlement = subMallId === payment.hq_submall_id

  const updateData: Record<string, unknown> = {
    settlement_status: 'failed',
    settlement_error_message: failReason
  }

  if (isBranchSettlement) {
    updateData.branch_settlement_status = 'failed'
  }

  if (isHqSettlement) {
    updateData.hq_settlement_status = 'failed'
  }

  await supabase
    .from('payments')
    .update(updateData)
    .eq('id', payment.id)

  console.error('Settlement failed:', orderId, subMallId, failReason)
}
