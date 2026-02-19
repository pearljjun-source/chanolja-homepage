import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'
import { sendInquiryNotification } from '@/lib/solapi/sms'

// POST: 문의 접수 + SMS 알림
export const POST = withAuth({ auth: 'public', rateLimit: 'inquiry' }, async (request: NextRequest) => {
  try {
    const body = await request.json()

    const { name, phone, email, region, inquiry_type, message } = body

    // 필수 필드 검증
    if (!name || !phone || !inquiry_type || !message) {
      return NextResponse.json(
        { success: false, error: '필수 항목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 입력값 길이 제한
    if (
      typeof name !== 'string' || name.length > 50 ||
      typeof phone !== 'string' || phone.length > 20 ||
      typeof inquiry_type !== 'string' || inquiry_type.length > 30 ||
      typeof message !== 'string' || message.length > 2000 ||
      (email && (typeof email !== 'string' || email.length > 100)) ||
      (region && (typeof region !== 'string' || region.length > 20))
    ) {
      return NextResponse.json(
        { success: false, error: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // Supabase에 문의 저장
    const supabase = await createClient()
    const { error: insertError } = await supabase
      .from('inquiries')
      .insert({
        name,
        phone,
        email: email || null,
        region: region || null,
        inquiry_type,
        message,
      })

    if (insertError) {
      console.error('문의 저장 실패:', insertError)
      return NextResponse.json(
        { success: false, error: '문의 접수 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // SMS 알림 전송 (실패해도 문의 접수는 성공)
    try {
      await sendInquiryNotification({ name, phone, email, region, inquiry_type, message })
    } catch (err) {
      console.error('SMS 알림 전송 실패:', err)
    }

    return NextResponse.json({
      success: true,
      message: '문의가 접수되었습니다.',
    })
  } catch (error) {
    console.error('문의 API 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
})
