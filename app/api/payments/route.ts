import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'
import { canAccessReservation } from '@/lib/auth/ownership'

// GET: 결제 목록 조회 (admin 이상만)
export const GET = withAuth({ auth: 'admin', permission: 'manage_payments' }, async (request: NextRequest) => {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const branchId = searchParams.get('branch_id')
    const status = searchParams.get('status')
    const settlementStatus = searchParams.get('settlement_status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    let query = supabase
      .from('payments')
      .select(`
        *,
        reservation:reservations(
          id,
          reservation_number,
          customer_name,
          customer_phone,
          start_date,
          end_date,
          vehicle:vehicles(id, name, license_plate)
        ),
        branch:branches(id, name, region)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (settlementStatus) {
      query = query.eq('settlement_status', settlementStatus)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // 페이지네이션
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Payment query error:', error.message)
      return NextResponse.json(
        { success: false, error: '결제 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST: 결제 생성 (인증된 사용자)
export const POST = withAuth({ auth: 'authenticated' }, async (request: NextRequest, { user }) => {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      reservation_id,
      payment_method,
      pg_provider
    } = body

    // 필수 필드 검증
    if (!reservation_id || !payment_method) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 예약 조회 + 소유권 검증 + 금액을 서버에서 결정
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, branch_id, total_price, user_id, customer_email, payment_status')
      .eq('id', reservation_id)
      .single()

    if (resError || !reservation) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 소유권 검증 (auth: 'authenticated'이므로 user는 항상 non-null)
    if (!canAccessReservation(user!, reservation)) {
      return NextResponse.json(
        { success: false, error: '해당 예약에 대한 접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 결제 완료된 예약인지 확인
    if (reservation.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: '이미 결제가 완료된 예약입니다.' },
        { status: 400 }
      )
    }

    // 서버의 예약 금액을 사용 (클라이언트 amount 무시 — 금액 조작 방지)
    const amount = reservation.total_price

    // 본사 수수료 계산 (기본 5%)
    const hqFeeRate = 5.00
    const hqFeeAmount = Math.round(amount * hqFeeRate / 100)
    const settlementAmount = amount - hqFeeAmount

    const { data, error } = await supabase
      .from('payments')
      .insert({
        reservation_id,
        branch_id: reservation.branch_id,
        amount,
        payment_method,
        pg_provider: pg_provider || 'tosspayments',
        pg_order_id: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        settlement_status: 'pending',
        hq_fee_rate: hqFeeRate,
        hq_fee_amount: hqFeeAmount,
        settlement_amount: settlementAmount
      })
      .select()
      .single()

    if (error) {
      console.error('Payment insert error:', error.message)
      return NextResponse.json(
        { success: false, error: '결제 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '결제가 준비되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})
