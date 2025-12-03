import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: 지점 API 키 인증
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { api_key } = body

    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'API 키가 필요합니다.' },
        { status: 400 }
      )
    }

    // API 키로 지점 조회
    const { data: branch, error } = await supabase
      .from('branches')
      .select('id, name, region, address, phone, website_url, is_active')
      .eq('api_key', api_key)
      .eq('is_active', true)
      .single()

    if (error || !branch) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 API 키입니다.' },
        { status: 401 }
      )
    }

    // JWT 토큰 생성 (간단한 예시 - 실제로는 jose 라이브러리 사용 권장)
    const token = Buffer.from(JSON.stringify({
      branch_id: branch.id,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24시간
    })).toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        branch,
        token
      },
      message: '인증 성공'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
