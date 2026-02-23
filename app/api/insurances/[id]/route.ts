import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'

// GET: 보험 상세 조회
export const GET = withAuth({ auth: 'branch_admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vehicle_insurances')
      .select(`
        *,
        vehicle:vehicles(id, name, brand, model, license_plate, thumbnail_url),
        branch:branches(id, name, region, phone)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: '보험 정보를 찾을 수 없습니다.' },
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

// PUT: 보험 정보 수정
export const PUT = withAuth({ auth: 'branch_admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()
    const body = await request.json()

    // 보험의 지점 소유권 검증 (branch_admin은 자기 지점 보험만 수정 가능)
    if (user && user.role === 'branch_admin') {
      const { data: insurance, error: insuranceError } = await supabase
        .from('vehicle_insurances')
        .select('branch_id')
        .eq('id', id)
        .single()

      if (insuranceError || !insurance) {
        return NextResponse.json(
          { success: false, error: '보험 정보를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      if (insurance.branch_id !== user.branchId) {
        return NextResponse.json(
          { success: false, error: '해당 지점의 보험만 수정할 수 있습니다.' },
          { status: 403 }
        )
      }
    }

    // 허용된 필드만 업데이트 (mass assignment 방지)
    const allowedFields = [
      'insurance_company',
      'policy_number',
      'insurance_type',
      'coverage',
      'start_date',
      'end_date',
      'annual_premium',
      'monthly_premium',
      'document_url',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('vehicle_insurances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Insurance update error:', error.message)
      return NextResponse.json(
        { success: false, error: '보험 정보 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: '보험 정보가 수정되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE: 보험 삭제 (비활성화)
export const DELETE = withAuth({ auth: 'admin' }, async (request: NextRequest, { user, params }) => {
  try {
    const id = params?.id
    const supabase = await createClient()

    const { error } = await supabase
      .from('vehicle_insurances')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Insurance delete error:', error.message)
      return NextResponse.json(
        { success: false, error: '보험 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '보험 정보가 삭제되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})
