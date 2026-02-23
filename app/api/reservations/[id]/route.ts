import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'
import { canAccessReservation } from '@/lib/auth/ownership'

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

    // 소유권 검증 (auth: 'authenticated'이므로 user는 항상 non-null)
    if (!canAccessReservation(user!, data)) {
      return NextResponse.json(
        { success: false, error: '해당 예약에 대한 접근 권한이 없습니다.' },
        { status: 403 }
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

    // 소유권 검증: branch_admin/staff는 자기 지점만 수정 가능
    const { data: targetReservation, error: targetError } = await supabase
      .from('reservations')
      .select('user_id, customer_email, branch_id')
      .eq('id', id)
      .single()

    if (targetError || !targetReservation) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!canAccessReservation(user!, targetReservation)) {
      return NextResponse.json(
        { success: false, error: '해당 예약에 대한 접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // 상태 변경인 경우
    if (body.action) {
      const { action } = body
      const validActions = ['approve', 'confirm', 'start', 'complete', 'cancel']

      if (!validActions.includes(action)) {
        return NextResponse.json(
          { success: false, error: '잘못된 액션입니다.' },
          { status: 400 }
        )
      }

      // RPC로 원자적 상태 전환 (예약 + 차량 동시 업데이트)
      const { data: txResult, error: txError } = await supabase
        .rpc('transition_reservation_status', {
          p_reservation_id: id,
          p_action: action,
          p_cancel_reason: body.cancel_reason || null,
        })

      // RPC 함수가 없는 경우 기존 방식으로 폴백
      if (txError?.code === 'PGRST202') {
        let updateData: Record<string, unknown> = {}

        switch (action) {
          case 'approve':
            updateData = { status: 'approved' }
            break
          case 'confirm':
            updateData = { status: 'confirmed', payment_status: 'paid' }
            break
          case 'start': {
            updateData = { status: 'in_use' }
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
          }
          case 'complete': {
            updateData = { status: 'completed' }
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
          }
          case 'cancel': {
            updateData = {
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancel_reason: body.cancel_reason || null
            }
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
          }
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
      } else if (txError) {
        console.error('Reservation transition error:', txError)
        return NextResponse.json(
          { success: false, error: '예약 상태 변경에 실패했습니다.' },
          { status: 500 }
        )
      } else if (!txResult?.success) {
        return NextResponse.json(
          { success: false, error: txResult?.error || '예약 상태 변경 실패' },
          { status: 400 }
        )
      }

      // RPC 성공 - 업데이트된 예약 데이터 다시 조회
      const { data: updatedReservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single()

      return NextResponse.json({
        success: true,
        data: updatedReservation,
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
