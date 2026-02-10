import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BANK_CODES, BankCode } from '@/lib/payments/types'
import { withAuth } from '@/lib/auth/with-auth'

// POST: 토스페이먼츠 가상계좌 발급 (인증된 사용자)
export const POST = withAuth({ auth: 'authenticated' }, async (request: NextRequest) => {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { payment_id, bank }: { payment_id: string; bank: BankCode } = body

    if (!payment_id || !bank) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const bankCode = BANK_CODES[bank]
    if (!bankCode) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 은행입니다.' },
        { status: 400 }
      )
    }

    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payments')
      .select(`
        *,
        reservation:reservations(
          customer_name,
          customer_phone,
          customer_email,
          start_date,
          end_date,
          vehicle:vehicles(name, brand, model)
        )
      `)
      .eq('id', payment_id)
      .single()

    if (fetchError || !paymentRecord) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (paymentRecord.virtual_account_number) {
      return NextResponse.json({
        success: true,
        data: {
          accountNumber: paymentRecord.virtual_account_number,
          bank: paymentRecord.virtual_account_bank,
          customerName: paymentRecord.virtual_account_holder,
          dueDate: paymentRecord.virtual_account_due_date,
          amount: paymentRecord.amount
        },
        message: '이미 발급된 가상계좌 정보입니다.'
      })
    }

    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: '결제 설정이 완료되지 않았습니다.' },
        { status: 500 }
      )
    }

    const vehicleName = paymentRecord.reservation?.vehicle?.brand
      ? `${paymentRecord.reservation.vehicle.brand} ${paymentRecord.reservation.vehicle.model || paymentRecord.reservation.vehicle.name}`
      : paymentRecord.reservation?.vehicle?.name || '차량 렌트'

    const orderName = `${vehicleName} 렌트 (${paymentRecord.reservation?.start_date} ~ ${paymentRecord.reservation?.end_date})`

    const tossResponse = await fetch('https://api.tosspayments.com/v1/virtual-accounts', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentRecord.amount,
        orderId: paymentRecord.pg_order_id,
        orderName,
        customerName: paymentRecord.reservation?.customer_name || '고객',
        customerEmail: paymentRecord.reservation?.customer_email,
        customerMobilePhone: paymentRecord.reservation?.customer_phone,
        bank: bankCode,
        validHours: 168,
        metadata: {
          splitPayment: true,
          branchSubMallId: paymentRecord.branch_submall_id,
          hqSubMallId: paymentRecord.hq_submall_id,
          branchAmount: paymentRecord.branch_settlement_amount,
          hqAmount: paymentRecord.hq_settlement_amount
        }
      }),
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: tossData.message || '가상계좌 발급 실패'
        })
        .eq('id', payment_id)

      return NextResponse.json(
        { success: false, error: tossData.message || '가상계좌 발급에 실패했습니다.' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        pg_transaction_id: tossData.paymentKey,
        status: 'awaiting_deposit',
        virtual_account_number: tossData.virtualAccount?.accountNumber,
        virtual_account_bank: bank,
        virtual_account_holder: tossData.virtualAccount?.customerName,
        virtual_account_due_date: tossData.virtualAccount?.dueDate
      })
      .eq('id', payment_id)

    if (updateError) {
      console.error('Virtual account update error:', updateError)
    }

    if (paymentRecord.reservation_id) {
      await supabase
        .from('reservations')
        .update({
          payment_status: 'awaiting'
        })
        .eq('id', paymentRecord.reservation_id)
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentKey: tossData.paymentKey,
        accountNumber: tossData.virtualAccount?.accountNumber,
        bank,
        bankName: bank,
        customerName: tossData.virtualAccount?.customerName,
        dueDate: tossData.virtualAccount?.dueDate,
        amount: paymentRecord.amount,
        splitInfo: {
          branchAmount: paymentRecord.branch_settlement_amount,
          hqAmount: paymentRecord.hq_settlement_amount,
          message: '입금 확인 후 정산이 자동으로 진행됩니다.'
        }
      },
      message: '가상계좌가 발급되었습니다. 입금 기한 내에 입금해주세요.'
    })
  } catch (error) {
    console.error('Virtual account issue error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// GET: 가상계좌 정보 조회 (인증된 사용자)
export const GET = withAuth({ auth: 'authenticated' }, async (request: NextRequest) => {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: '결제 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (error || !payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!payment.virtual_account_number) {
      return NextResponse.json(
        { success: false, error: '가상계좌가 발급되지 않았습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        accountNumber: payment.virtual_account_number,
        bank: payment.virtual_account_bank,
        customerName: payment.virtual_account_holder,
        dueDate: payment.virtual_account_due_date,
        amount: payment.amount,
        status: payment.status
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})
