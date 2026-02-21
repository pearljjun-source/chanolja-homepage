import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'

// GET: 예약 상세 조회
export const GET = withAuth({ auth: 'authenticated' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        vehicle:vehicles(*),
        branch:branches(id, name, region, phone, address),
        payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// PUT: 예약 정보 수정 / 상태 변경
export const PUT = withAuth({ auth: 'branch_admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()
    const body = await request.json()

    // 상태 변경인 경우
    if (body.action) {
      const { action } = body
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
          // 차량 상태도 변경
          const { data: reservation } = await supabase
            .from('reservations')
            .select('vehicle_id')
            .eq('id', id)
            .single()
          if (reservation) {
            await supabase
              .from('vehicles')
              .update({ status: 'rented' })
              .eq('id', reservation.vehicle_id)
          }
          break
        case 'complete':
          updateData = { status: 'completed' }
          // 차량 상태 복구
          const { data: completeRes } = await supabase
            .from('reservations')
            .select('vehicle_id')
            .eq('id', id)
            .single()
          if (completeRes) {
            await supabase
              .from('vehicles')
              .update({ status: 'available' })
              .eq('id', completeRes.vehicle_id)
          }
          break
        case 'cancel':
          updateData = {
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_reason: body.cancel_reason || null
          }
          // 차량 상태 복구
          const { data: cancelRes } = await supabase
            .from('reservations')
            .select('vehicle_id')
            .eq('id', id)
            .single()
          if (cancelRes) {
            await supabase
              .from('vehicles')
              .update({ status: 'available' })
              .eq('id', cancelRes.vehicle_id)
          }
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
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Reservation action error:', error.message)
        return NextResponse.json(
          { success: false, error: '예약 상태 변경에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data,
        message: '예약 상태가 변경되었습니다.'
      })
    }

    // 일반 정보 수정 - 허용된 필드만 업데이트 (mass assignment 방지)
    const allowedFields = [
      'customer_name',
      'customer_phone',
      'customer_email',
      'customer_birth',
      'license_number',
      'license_type',
      'start_date',
      'end_date',
      'start_time',
      'end_time',
      'pickup_location',
      'return_location',
      'options',
      'customer_memo',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Reservation update error:', error.message)
      return NextResponse.json(
        { success: false, error: '예약 정보 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '예약 정보가 수정되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE: 예약 삭제
export const DELETE = withAuth({ auth: 'admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()

    // 예약 취소로 처리 (실제 삭제 X)
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Reservation cancel error:', error.message)
      return NextResponse.json(
        { success: false, error: '예약 취소에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '예약이 취소되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})
