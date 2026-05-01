import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth/with-auth'
import { sendSMS } from '@/lib/solapi/sms'

export const POST = withAuth({ auth: 'public', rateLimit: 'survey' }, async (request: NextRequest) => {
  try {
    const body = await request.json()

    const {
      name, phone, email, region, age_group,
      startup_reason, experience, experience_other, experience_years,
      business_models, important_factors, important_factors_other,
      estimated_budget, vehicle_plan,
      swot_strength, swot_weakness, swot_opportunity, swot_threat,
      referral_source, referral_source_other,
      preferred_contact, privacy_agreed,
    } = body

    // 필수 필드 검증
    if (!name || !phone || !age_group || !startup_reason || !estimated_budget || !privacy_agreed) {
      return NextResponse.json(
        { success: false, error: '필수 항목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 입력값 타입/길이 검증
    if (
      typeof name !== 'string' || name.length > 50 ||
      typeof phone !== 'string' || phone.length > 20 ||
      typeof age_group !== 'string' || age_group.length > 10 ||
      typeof startup_reason !== 'string' || startup_reason.length > 2000 ||
      typeof estimated_budget !== 'string' || estimated_budget.length > 30 ||
      (email && (typeof email !== 'string' || email.length > 100)) ||
      (region && (typeof region !== 'string' || region.length > 20))
    ) {
      return NextResponse.json(
        { success: false, error: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 배열 필드 검증 (타입 + 개수 + 항목 길이 제한)
    const arrayFields = [experience, business_models, important_factors, referral_source]
    for (const arr of arrayFields) {
      if (arr && (
        !Array.isArray(arr) ||
        arr.length > 20 ||
        arr.some((item: unknown) => typeof item !== 'string' || (item as string).length > 100)
      )) {
        return NextResponse.json(
          { success: false, error: '입력값이 올바르지 않습니다.' },
          { status: 400 }
        )
      }
    }

    // 주관식 필드 길이 제한
    const textFields = [
      experience_other, important_factors_other, referral_source_other,
      swot_strength, swot_weakness, swot_opportunity, swot_threat,
    ]
    for (const text of textFields) {
      if (text && (typeof text !== 'string' || text.length > 2000)) {
        return NextResponse.json(
          { success: false, error: '입력값이 올바르지 않습니다.' },
          { status: 400 }
        )
      }
    }

    // vehicle_plan 검증
    if (vehicle_plan && (typeof vehicle_plan !== 'object' || Array.isArray(vehicle_plan))) {
      return NextResponse.json(
        { success: false, error: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error: insertError } = await supabase
      .from('franchise_surveys')
      .insert({
        name,
        phone,
        email: email || null,
        region: region || null,
        age_group,
        startup_reason,
        experience: experience || [],
        experience_other: experience_other || null,
        experience_years: experience_years ? Number(experience_years) : null,
        business_models: business_models || [],
        important_factors: important_factors || [],
        important_factors_other: important_factors_other || null,
        estimated_budget,
        vehicle_plan: vehicle_plan || {},
        swot_strength: swot_strength || null,
        swot_weakness: swot_weakness || null,
        swot_opportunity: swot_opportunity || null,
        swot_threat: swot_threat || null,
        referral_source: referral_source || [],
        referral_source_other: referral_source_other || null,
        preferred_contact: preferred_contact || '전화',
        privacy_agreed,
      })

    if (insertError) {
      console.error('설문 저장 실패:', insertError)
      return NextResponse.json(
        { success: false, error: '설문 제출 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // SMS 알림 (실패해도 설문 접수는 성공)
    try {
      const adminPhone = process.env.ADMIN_PHONE_NUMBER?.trim()
      if (adminPhone) {
        const msg = [
          '[차놀자] 새 프랜차이즈 설문',
          `이름: ${name}`,
          `연락처: ${phone}`,
          `지역: ${region || '미입력'}`,
          `연령대: ${age_group}`,
          `예상투자: ${estimated_budget}`,
        ].join('\n')

        await sendSMS({
          receiver: adminPhone,
          message: msg,
          subject: '[차놀자] 새 프랜차이즈 설문',
        })
      }
    } catch (err) {
      console.error('SMS 알림 전송 실패:', err)
    }

    return NextResponse.json({
      success: true,
      message: '설문이 제출되었습니다. 감사합니다.',
    })
  } catch (error) {
    console.error('설문 API 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
})
