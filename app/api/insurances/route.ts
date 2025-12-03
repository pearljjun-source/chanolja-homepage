import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 보험 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const branchId = searchParams.get('branch_id')
    const vehicleId = searchParams.get('vehicle_id')
    const expiringSoon = searchParams.get('expiring_soon') // 30일 이내 만료
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    let query = supabase
      .from('vehicle_insurances')
      .select(`
        *,
        vehicle:vehicles(id, name, brand, model, license_plate, thumbnail_url),
        branch:branches(id, name, region)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('end_date', { ascending: true })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }

    if (expiringSoon === 'true') {
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
      query = query.lte('end_date', thirtyDaysLater.toISOString().split('T')[0])
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

// POST: 보험 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      vehicle_id,
      branch_id,
      insurance_company,
      policy_number,
      insurance_type,
      coverage,
      start_date,
      end_date,
      annual_premium,
      monthly_premium,
      document_url
    } = body

    // 필수 필드 검증
    if (!vehicle_id || !branch_id || !insurance_company || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 활성 보험 비활성화 (동일 차량)
    await supabase
      .from('vehicle_insurances')
      .update({ is_active: false })
      .eq('vehicle_id', vehicle_id)
      .eq('is_active', true)

    const defaultCoverage = {
      liability_per_person: 100000000,
      liability_per_accident: 200000000,
      property_damage: 20000000,
      uninsured_motorist: 20000000,
      self_damage: true,
      self_damage_deductible: 300000
    }

    const { data, error } = await supabase
      .from('vehicle_insurances')
      .insert({
        vehicle_id,
        branch_id,
        insurance_company,
        policy_number,
        insurance_type: insurance_type || 'comprehensive',
        coverage: coverage || defaultCoverage,
        start_date,
        end_date,
        annual_premium,
        monthly_premium,
        document_url,
        is_active: true
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
      message: '보험이 등록되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
