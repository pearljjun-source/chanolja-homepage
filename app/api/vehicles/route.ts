import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 차량 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const branchId = searchParams.get('branch_id')
    const status = searchParams.get('status')
    const vehicleType = searchParams.get('vehicle_type')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    let query = supabase
      .from('vehicles')
      .select(`
        *,
        branch:branches(id, name, region),
        insurance:vehicle_insurances(*)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType)
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

// POST: 차량 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      branch_id,
      name,
      brand,
      model,
      year,
      license_plate,
      vehicle_type,
      price_per_day,
      price_per_hour,
      deposit,
      color,
      seats,
      fuel_type,
      transmission,
      mileage,
      images,
      thumbnail_url,
      description,
      features
    } = body

    // 필수 필드 검증
    if (!branch_id || !name || !price_per_day) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        branch_id,
        name,
        brand,
        model,
        year,
        license_plate,
        vehicle_type: vehicle_type || 'sedan',
        price_per_day,
        price_per_hour,
        deposit: deposit || 0,
        color,
        seats: seats || 5,
        fuel_type,
        transmission,
        mileage,
        images: images || [],
        thumbnail_url,
        description,
        features: features || [],
        status: 'available',
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
      message: '차량이 등록되었습니다.'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
