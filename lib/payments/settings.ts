/**
 * 결제 설정 관리
 *
 * DB에서 결제 관련 설정을 가져옵니다.
 * 기본값은 하드코딩되어 있으며, DB에 설정이 있으면 그 값을 우선합니다.
 */

import { createClient } from '@/lib/supabase/server'

// 결제 설정 타입
export interface PaymentSettings {
  BRANCH_RATIO: number
  HQ_RATIO: number
  VIRTUAL_ACCOUNT_VALID_HOURS: number
  PG_FEE_RATE: number
}

// 기본 설정값 (DB에 값이 없을 때 사용)
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  // 스플릿 정산 비율
  BRANCH_RATIO: 90,  // 지점 90%
  HQ_RATIO: 10,      // 본사 10%

  // 가상계좌 유효 시간 (시간)
  VIRTUAL_ACCOUNT_VALID_HOURS: 168, // 7일

  // PG 수수료율 (참고용)
  PG_FEE_RATE: 2.5,
}

export type PaymentSettingKey = keyof PaymentSettings

// 캐시 (1분간 유지)
let settingsCache: Record<string, number> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60 * 1000 // 1분

/**
 * DB에서 결제 설정 가져오기
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const now = Date.now()

  // 캐시가 유효하면 캐시 반환
  if (settingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return {
      BRANCH_RATIO: settingsCache.BRANCH_RATIO ?? DEFAULT_PAYMENT_SETTINGS.BRANCH_RATIO,
      HQ_RATIO: settingsCache.HQ_RATIO ?? DEFAULT_PAYMENT_SETTINGS.HQ_RATIO,
      VIRTUAL_ACCOUNT_VALID_HOURS: settingsCache.VIRTUAL_ACCOUNT_VALID_HOURS ?? DEFAULT_PAYMENT_SETTINGS.VIRTUAL_ACCOUNT_VALID_HOURS,
      PG_FEE_RATE: settingsCache.PG_FEE_RATE ?? DEFAULT_PAYMENT_SETTINGS.PG_FEE_RATE,
    }
  }

  try {
    const supabase = await createClient()

    // site_settings 테이블에서 결제 관련 설정 가져오기
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'payment_branch_ratio',
        'payment_hq_ratio',
        'payment_virtual_account_hours',
        'payment_pg_fee_rate',
      ])

    if (error) {
      console.error('Failed to fetch payment settings:', error)
      return { ...DEFAULT_PAYMENT_SETTINGS }
    }

    // 설정값 파싱
    const parsedSettings: Record<string, number> = {}

    for (const setting of settings || []) {
      const value = parseFloat(setting.value)
      if (!isNaN(value)) {
        switch (setting.key) {
          case 'payment_branch_ratio':
            parsedSettings.BRANCH_RATIO = value
            break
          case 'payment_hq_ratio':
            parsedSettings.HQ_RATIO = value
            break
          case 'payment_virtual_account_hours':
            parsedSettings.VIRTUAL_ACCOUNT_VALID_HOURS = value
            break
          case 'payment_pg_fee_rate':
            parsedSettings.PG_FEE_RATE = value
            break
        }
      }
    }

    // 캐시 업데이트
    settingsCache = parsedSettings
    cacheTimestamp = now

    return {
      BRANCH_RATIO: parsedSettings.BRANCH_RATIO ?? DEFAULT_PAYMENT_SETTINGS.BRANCH_RATIO,
      HQ_RATIO: parsedSettings.HQ_RATIO ?? DEFAULT_PAYMENT_SETTINGS.HQ_RATIO,
      VIRTUAL_ACCOUNT_VALID_HOURS: parsedSettings.VIRTUAL_ACCOUNT_VALID_HOURS ?? DEFAULT_PAYMENT_SETTINGS.VIRTUAL_ACCOUNT_VALID_HOURS,
      PG_FEE_RATE: parsedSettings.PG_FEE_RATE ?? DEFAULT_PAYMENT_SETTINGS.PG_FEE_RATE,
    }
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return { ...DEFAULT_PAYMENT_SETTINGS }
  }
}

/**
 * 스플릿 정산 비율만 가져오기 (자주 사용되는 함수)
 */
export async function getSplitRatio(): Promise<{ branch: number; hq: number }> {
  const settings = await getPaymentSettings()
  return {
    branch: settings.BRANCH_RATIO,
    hq: settings.HQ_RATIO,
  }
}

/**
 * 스플릿 정산 금액 계산 (DB 설정 사용)
 */
export async function calculateSplitAmountsFromDB(totalAmount: number): Promise<{
  branchAmount: number
  hqAmount: number
  branchRatio: number
  hqRatio: number
}> {
  const { branch: branchRatio, hq: hqRatio } = await getSplitRatio()

  const hqAmount = Math.round(totalAmount * hqRatio / 100)
  const branchAmount = totalAmount - hqAmount // 반올림 오차 방지

  return {
    branchAmount,
    hqAmount,
    branchRatio,
    hqRatio,
  }
}

/**
 * 캐시 무효화 (설정 변경 후 호출)
 */
export function invalidateSettingsCache(): void {
  settingsCache = null
  cacheTimestamp = 0
}
