import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'

// GET: 차량 상세 조회
export const GET = withAuth({ auth: 'public' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        branch:branches(id, name, region, phone, address),
        insurance:vehicle_insurances(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: '차량을 찾을 수 없습니다.' },
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

// PUT: 차량 정보 수정
export const PUT = withAuth({ auth: 'branch_admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()
    const body = await request.json()

    // 차량의 지점 소유권 검증 (branch_admin은 자기 지점 차량만 수정 가능)
    if (user && user.role === 'branch_admin') {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('branch_id')
        .eq('id', id)
        .single()

      if (vehicleError || !vehicle) {
        return NextResponse.json(
          { success: false, error: '차량을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      if (vehicle.branch_id !== user.branchId) {
        return NextResponse.json(
          { success: false, error: '해당 지점의 차량만 수정할 수 있습니다.' },
          { status: 403 }
        )
      }
    }

    // 허용된 필드만 업데이트 (mass assignment 방지)
    const allowedFields = [
      'name',
      'brand',
      'model',
      'year',
      'license_plate',
      'vehicle_type',
      'price_per_day',
      'price_per_hour',
      'deposit',
      'color',
      'seats',
      'fuel_type',
      'transmission',
      'mileage',
      'images',
      'thumbnail_url',
      'description',
      'features',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Vehicle update error:', error.message)
      return NextResponse.json(
        { success: false, error: '차량 정보 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '차량 정보가 수정되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE: 차량 삭제 (비활성화)
export const DELETE = withAuth({ auth: 'admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()

    // 소프트 삭제 (is_active를 false로 변경)
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Vehicle delete error:', error.message)
      return NextResponse.json(
        { success: false, error: '차량 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '차량이 삭제되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})
