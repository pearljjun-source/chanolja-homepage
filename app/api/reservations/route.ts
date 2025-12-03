import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const branchId = searchParams.get('branch_id')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    let query = supabase
      .from('reservations')
      .select(`
        *,
        vehicle:vehicles(id, name, brand, model, license_plate, thumbnail_url),
        branch:branches(id, name, region)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }

    if (startDate) {
      query = query.gte('start_date', startDate)
    }

    if (endDate) {
      query = query.lte('end_date', endDate)
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

// POST: 예약 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      branch_id,
      vehicle_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_birth,
      license_number,
      license_type,
      start_date,
      end_date,
      start_time,
      end_time,
      pickup_location,
      return_location,
      base_price,
      discount_amount,
      insurance_fee,
      additional_fee,
      total_price,
      options,
      customer_memo
    } = body

    // 필수 필드 검증
    if (!branch_id || !vehicle_id || !customer_name || !customer_phone || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 해당 차량이 해당 기간에 예약 가능한지 확인
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .not('status', 'eq', 'cancelled')
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)

    if (existingReservations && existingReservations.length > 0) {
      return NextResponse.json(
        { success: false, error: '해당 기간에 이미 예약이 있습니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        branch_id,
        vehicle_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_birth,
        license_number,
        license_type,
        start_date,
        end_date,
        start_time: start_time || '10:00',
        end_time: end_time || '10:00',
        pickup_location,
        return_location,
        base_price: base_price || 0,
        discount_amount: discount_amount || 0,
        insurance_fee: insurance_fee || 0,
        additional_fee: additional_fee || 0,
        total_price: total_price || 0,
        options: options || {},
        customer_memo,
        status: 'pending',
        payment_status: 'unpaid'
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
      message: '예약이 접수되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
