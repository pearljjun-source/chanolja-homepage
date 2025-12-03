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
      return null // 토큰 만료
    }
    return decoded.branch_id
  } catch {
    return null
  }
}

// GET: 지점의 차량 목록 조회
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
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    let query = supabase
      .from('vehicles')
      .select(`
        *,
        insurance:vehicle_insurances(*)
      `, { count: 'exact' })
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
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

// POST: 지점에서 차량 등록
export async function POST(request: NextRequest) {
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

    // branch_id를 인증된 지점으로 강제 설정
    const vehicleData = {
      ...body,
      branch_id: branchId,
      is_active: true,
      status: 'available'
    }

    // 필수 필드 검증
    if (!vehicleData.name || !vehicleData.price_per_day) {
      return NextResponse.json(
        { success: false, error: '차량명과 일 요금은 필수입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
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
