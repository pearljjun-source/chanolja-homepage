import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 지점 인증 헬퍼
async function authenticateBranch(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (decoded.exp < Date.now()) {
      return null
    }
    return decoded.branch_id
  } catch {
    return null
  }
}

// GET: 지점의 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const branchId = await authenticateBranch(request)
    if (!branchId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    let query = supabase
      .from('reservations')
      .select(`
        *,
        vehicle:vehicles(id, name, brand, model, license_plate, thumbnail_url)
      `, { count: 'exact' })
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('start_date', startDate)
    }

    if (endDate) {
      query = query.lte('end_date', endDate)
    }

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

// PUT: 예약 상태 변경
export async function PUT(request: NextRequest) {
  try {
    const branchId = await authenticateBranch(request)
    if (!branchId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()
    const { reservation_id, action, cancel_reason } = body

    if (!reservation_id || !action) {
      return NextResponse.json(
        { success: false, error: '예약 ID와 액션이 필요합니다.' },
        { status: 400 }
      )
    }

    // 해당 지점의 예약인지 확인
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id, branch_id, vehicle_id')
      .eq('id', reservation_id)
      .eq('branch_id', branchId)
      .single()

    if (!existingReservation) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'approve':
        updateData = { status: 'approved' }
        break
      case 'confirm':
        updateData = { status: 'confirmed', payment_status: 'paid' }
        break
      case 'start':
        updateData = { status: 'in_use' }
        await supabase
          .from('vehicles')
          .update({ status: 'rented' })
          .eq('id', existingReservation.vehicle_id)
        break
      case 'complete':
        updateData = { status: 'completed' }
        await supabase
          .from('vehicles')
          .update({ status: 'available' })
          .eq('id', existingReservation.vehicle_id)
        break
      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: cancel_reason || null
        }
        await supabase
          .from('vehicles')
          .update({ status: 'available' })
          .eq('id', existingReservation.vehicle_id)
        break
      default:
        return NextResponse.json(
          { success: false, error: '잘못된 액션입니다.' },
          { status: 400 }
        )
    }

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservation_id)
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
      message: '예약 상태가 변경되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
