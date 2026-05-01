import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'
import { calculateReservationPrice } from '@/lib/pricing/calculate-price'
import { reservationCreateServerSchema } from '@/lib/validations/reservation'

// GET: 예약 목록 조회
export const GET = withAuth({ auth: 'admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const branchId = searchParams.get('branch_id')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const search = searchParams.get('search')
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

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,reservation_number.ilike.%${search}%`
      )
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    if (startDate) {
      if (!dateRegex.test(startDate)) {
        return NextResponse.json(
          { success: false, error: '시작일 형식이 올바르지 않습니다. (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
      query = query.gte('start_date', startDate)
    }

    if (endDate) {
      if (!dateRegex.test(endDate)) {
        return NextResponse.json(
          { success: false, error: '종료일 형식이 올바르지 않습니다. (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
      query = query.lte('end_date', endDate)
    }

    // 페이지네이션
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Reservation query error:', error.message)
      return NextResponse.json(
        { success: false, error: '예약 목록 조회에 실패했습니다.' },
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

// POST: 예약 생성
export const POST = withAuth({ auth: 'public', rateLimit: 'reservation' }, async (request: NextRequest, { user, params }) => {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // 서버사이드 입력값 검증 (Zod)
    const parsed = reservationCreateServerSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다.'
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      )
    }

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
      insurance_id: rawInsuranceId,
      options,
      customer_memo
    } = parsed.data
    const insurance_id = rawInsuranceId ?? undefined

    // 서버 사이드 가격 계산 (클라이언트 가격 무시)
    const pricing = await calculateReservationPrice({
      vehicle_id,
      start_date,
      end_date,
      insurance_id,
    })

    // 해당 차량이 해당 기간에 예약 가능한지 확인
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .not('status', 'eq', 'cancelled')
      .lte('start_date', end_date)
      .gte('end_date', start_date)

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
        base_price: pricing.base_price,
        discount_amount: pricing.discount_amount,
        insurance_fee: pricing.insurance_fee,
        additional_fee: pricing.additional_fee,
        total_price: pricing.total_price,
        options: options || {},
        customer_memo,
        user_id: user?.id || null,
        status: 'pending',
        payment_status: 'unpaid'
      })
      .select()
      .single()

    if (error) {
      console.error('Reservation insert error:', error.message)
      return NextResponse.json(
        { success: false, error: '예약 생성에 실패했습니다.' },
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
})
