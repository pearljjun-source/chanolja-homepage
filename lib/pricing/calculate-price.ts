/**
 * 서버 사이드 가격 계산 모듈
 * 클라이언트가 보낸 가격을 신뢰하지 않고, 서버에서 직접 계산
 */

import { createClient } from '@/lib/supabase/server'

interface PriceCalculationResult {
  base_price: number
  insurance_fee: number
  additional_fee: number
  discount_amount: number
  total_price: number
  rental_days: number
}

/**
 * 대여 일수 계산 (최소 1일)
 */
function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffMs = end.getTime() - start.getTime()
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(days, 1)
}

/**
 * 예약 가격을 서버에서 계산
 * - vehicle의 price_per_day를 DB에서 조회
 * - 대여 기간으로 base_price 계산
 * - 보험료는 vehicle_insurances에서 조회 (선택된 경우)
 */
export async function calculateReservationPrice(params: {
  vehicle_id: string
  start_date: string
  end_date: string
  insurance_id?: string
}): Promise<PriceCalculationResult> {
  const supabase = await createClient()

  // 차량 가격 조회
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('price_per_day')
    .eq('id', params.vehicle_id)
    .eq('is_active', true)
    .single()

  if (vehicleError || !vehicle) {
    throw new Error('차량 정보를 찾을 수 없습니다.')
  }

  const rentalDays = calculateRentalDays(params.start_date, params.end_date)
  const basePrice = rentalDays * vehicle.price_per_day

  // 보험료 조회 (선택된 경우)
  let insuranceFee = 0
  if (params.insurance_id) {
    const { data: insurance } = await supabase
      .from('vehicle_insurances')
      .select('daily_rate')
      .eq('id', params.insurance_id)
      .eq('is_active', true)
      .single()

    if (insurance) {
      insuranceFee = rentalDays * insurance.daily_rate
    }
  }

  const discountAmount = 0
  const additionalFee = 0
  const totalPrice = basePrice + insuranceFee + additionalFee - discountAmount

  return {
    base_price: basePrice,
    insurance_fee: insuranceFee,
    additional_fee: additionalFee,
    discount_amount: discountAmount,
    total_price: totalPrice,
    rental_days: rentalDays,
  }
}
