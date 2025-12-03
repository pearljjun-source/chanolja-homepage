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
      return null
    }
    return decoded.branch_id
  } catch {
    return null
  }
}

// GET: 지점 통계 조회
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

    // 차량 통계
    const { count: totalVehicles } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('is_active', true)

    const { count: availableVehicles } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .eq('status', 'available')

    // 예약 통계
    const { count: pendingReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('status', 'pending')

    const today = new Date().toISOString().split('T')[0]
    const { count: todayReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .lte('start_date', today)
      .gte('end_date', today)
      .not('status', 'eq', 'cancelled')

    // 이번 달 매출
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('status', 'completed')
      .gte('paid_at', startOfMonth.toISOString())

    const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0

    // 만료 임박 보험
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const { count: expiringInsurances } = await supabase
      .from('vehicle_insurances')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .lte('end_date', thirtyDaysLater.toISOString().split('T')[0])

    return NextResponse.json({
      success: true,
      data: {
        totalVehicles: totalVehicles || 0,
        availableVehicles: availableVehicles || 0,
        pendingReservations: pendingReservations || 0,
        todayReservations: todayReservations || 0,
        monthlyRevenue,
        expiringInsurances: expiringInsurances || 0
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
