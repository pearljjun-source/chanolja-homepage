import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 결제 목록 조회
export async function GET(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, error: error.message },
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
}

// POST: 결제 생성 (결제 준비)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      reservation_id,
      branch_id,
      amount,
      payment_method,
      pg_provider
    } = body

    // 필수 필드 검증
    if (!reservation_id || !branch_id || !amount || !payment_method) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 본사 수수료 계산 (기본 5%)
    const hqFeeRate = 5.00
    const hqFeeAmount = Math.round(amount * hqFeeRate / 100)
    const settlementAmount = amount - hqFeeAmount

    const { data, error } = await supabase
      .from('payments')
      .insert({
        reservation_id,
        branch_id,
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
      return NextResponse.json(
        { success: false, error: error.message },
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
}
