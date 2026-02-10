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
      return NextResponse.json(
        { success: false, error: error.message },
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
      return NextResponse.json(
        { success: false, error: error.message },
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
