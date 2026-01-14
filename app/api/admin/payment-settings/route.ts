import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/rbac'
import { getPaymentSettings, invalidateSettingsCache, DEFAULT_PAYMENT_SETTINGS } from '@/lib/payments/settings'

// GET: 결제 설정 조회
export async function GET() {
  try {
    // 권한 검사: admin 이상만 조회 가능
    const authResult = await requireAdmin()
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const settings = await getPaymentSettings()

    return NextResponse.json({
      success: true,
      data: {
        branchRatio: settings.BRANCH_RATIO,
        hqRatio: settings.HQ_RATIO,
        virtualAccountValidHours: settings.VIRTUAL_ACCOUNT_VALID_HOURS,
        pgFeeRate: settings.PG_FEE_RATE,
      },
      defaults: {
        branchRatio: DEFAULT_PAYMENT_SETTINGS.BRANCH_RATIO,
        hqRatio: DEFAULT_PAYMENT_SETTINGS.HQ_RATIO,
        virtualAccountValidHours: DEFAULT_PAYMENT_SETTINGS.VIRTUAL_ACCOUNT_VALID_HOURS,
        pgFeeRate: DEFAULT_PAYMENT_SETTINGS.PG_FEE_RATE,
      },
    })
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json(
      { success: false, error: '설정 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 결제 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    // 권한 검사: admin 이상만 수정 가능
    const authResult = await requireAdmin()
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { branchRatio, hqRatio, virtualAccountValidHours, pgFeeRate } = body as {
      branchRatio?: number
      hqRatio?: number
      virtualAccountValidHours?: number
      pgFeeRate?: number
    }

    // 유효성 검사
    if (branchRatio !== undefined && hqRatio !== undefined) {
      if (branchRatio + hqRatio !== 100) {
        return NextResponse.json(
          { success: false, error: '지점 비율과 본사 비율의 합이 100이어야 합니다.' },
          { status: 400 }
        )
      }
      if (branchRatio < 0 || branchRatio > 100 || hqRatio < 0 || hqRatio > 100) {
        return NextResponse.json(
          { success: false, error: '비율은 0에서 100 사이여야 합니다.' },
          { status: 400 }
        )
      }
    }

    if (virtualAccountValidHours !== undefined && (virtualAccountValidHours < 1 || virtualAccountValidHours > 720)) {
      return NextResponse.json(
        { success: false, error: '가상계좌 유효시간은 1시간에서 720시간(30일) 사이여야 합니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 설정 업데이트 (upsert)
    const updates: { key: string; value: string; description: string }[] = []

    if (branchRatio !== undefined) {
      updates.push({
        key: 'payment_branch_ratio',
        value: branchRatio.toString(),
        description: '지점 정산 비율 (%)',
      })
    }

    if (hqRatio !== undefined) {
      updates.push({
        key: 'payment_hq_ratio',
        value: hqRatio.toString(),
        description: '본사 정산 비율 (%)',
      })
    }

    if (virtualAccountValidHours !== undefined) {
      updates.push({
        key: 'payment_virtual_account_hours',
        value: virtualAccountValidHours.toString(),
        description: '가상계좌 입금 유효 시간',
      })
    }

    if (pgFeeRate !== undefined) {
      updates.push({
        key: 'payment_pg_fee_rate',
        value: pgFeeRate.toString(),
        description: 'PG 수수료율 (%)',
      })
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: '업데이트할 설정이 없습니다.' },
        { status: 400 }
      )
    }

    // Upsert 수행
    for (const update of updates) {
      const { error } = await supabase
        .from('site_settings')
        .upsert(update, { onConflict: 'key' })

      if (error) {
        console.error('Error updating setting:', update.key, error)
        return NextResponse.json(
          { success: false, error: `설정 업데이트 실패: ${update.key}` },
          { status: 500 }
        )
      }
    }

    // 캐시 무효화
    invalidateSettingsCache()

    // 업데이트된 설정 반환
    const updatedSettings = await getPaymentSettings()

    return NextResponse.json({
      success: true,
      message: '결제 설정이 업데이트되었습니다.',
      data: {
        branchRatio: updatedSettings.BRANCH_RATIO,
        hqRatio: updatedSettings.HQ_RATIO,
        virtualAccountValidHours: updatedSettings.VIRTUAL_ACCOUNT_VALID_HOURS,
        pgFeeRate: updatedSettings.PG_FEE_RATE,
      },
    })
  } catch (error) {
    console.error('Error updating payment settings:', error)
    return NextResponse.json(
      { success: false, error: '설정 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
