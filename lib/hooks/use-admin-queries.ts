import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle, Reservation, Payment, VehicleInsurance, News, Inquiry } from '@/types/database'
import type { FranchiseSurvey } from '@/types/franchise-survey'

// ─── 공통: 활성 지점 목록 (4곳에서 중복 제거) ───

export function useActiveBranches() {
  return useQuery({
    queryKey: ['branches', 'active'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data as Branch[]
    },
    staleTime: 5 * 60 * 1000, // 지점은 자주 안 바뀌므로 5분
  })
}

// ─── 공통: 페이지네이션 API 호출 헬퍼 ───

interface PaginatedParams {
  page: number
  pageSize: number
  [key: string]: string | number | boolean | undefined
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

async function fetchPaginatedAPI<T>(
  endpoint: string,
  { page, pageSize, ...filters }: PaginatedParams
): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  })
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      params.append(key, String(value))
    }
  }

  const response = await fetch(`/api/${endpoint}?${params}`)
  const result = await response.json()

  if (!result.success) throw new Error(result.error || 'API 요청 실패')

  return {
    data: result.data ?? [],
    total: result.total ?? 0,
    totalPages: result.totalPages ?? 1,
    page: result.page ?? page,
    pageSize: result.pageSize ?? pageSize,
  }
}

// ─── 차량 목록 (기존 /api/vehicles 재사용) ───

interface UseVehiclesParams {
  page: number
  pageSize?: number
  branchId?: string
  status?: string
  search?: string
}

export function useVehicles({ page, pageSize = 10, branchId, status, search }: UseVehiclesParams) {
  return useQuery({
    queryKey: ['vehicles', { page, pageSize, branchId, status, search }],
    queryFn: () =>
      fetchPaginatedAPI<Vehicle>('vehicles', {
        page,
        pageSize,
        branch_id: branchId,
        status,
        search,
      }),
  })
}

// ─── 예약 목록 (기존 /api/reservations 재사용) ───

interface UseReservationsParams {
  page: number
  pageSize?: number
  branchId?: string
  status?: string
  search?: string
}

export function useReservations({ page, pageSize = 10, branchId, status, search }: UseReservationsParams) {
  return useQuery({
    queryKey: ['reservations', { page, pageSize, branchId, status, search }],
    queryFn: () =>
      fetchPaginatedAPI<Reservation>('reservations', {
        page,
        pageSize,
        branch_id: branchId,
        status,
        search,
      }),
  })
}

// ─── 보험 목록 (기존 /api/insurances 재사용) ───

interface UseInsurancesParams {
  page: number
  pageSize?: number
  branchId?: string
  expiringSoon?: boolean
  search?: string
}

export function useInsurances({ page, pageSize = 10, branchId, expiringSoon, search }: UseInsurancesParams) {
  return useQuery({
    queryKey: ['insurances', { page, pageSize, branchId, expiringSoon, search }],
    queryFn: () =>
      fetchPaginatedAPI<VehicleInsurance>('insurances', {
        page,
        pageSize,
        branch_id: branchId,
        expiring_soon: expiringSoon || undefined,
        search,
      }),
  })
}

// ─── 만료 임박 보험 건수 ───

export function useExpiringInsuranceCount() {
  return useQuery({
    queryKey: ['insurances', 'expiring-count'],
    queryFn: async () => {
      const response = await fetch('/api/insurances?expiring_soon=true&page_size=1')
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.total as number
    },
    staleTime: 60 * 1000,
  })
}

// ─── 결제 목록 (기존 /api/payments 재사용) ───

interface UsePaymentsParams {
  page: number
  pageSize?: number
  branchId?: string
  status?: string
}

export function usePayments({ page, pageSize = 10, branchId, status }: UsePaymentsParams) {
  return useQuery({
    queryKey: ['payments', { page, pageSize, branchId, status }],
    queryFn: () =>
      fetchPaginatedAPI<Payment>('payments', {
        page,
        pageSize,
        branch_id: branchId,
        status,
      }),
  })
}

// ─── 뉴스 목록 (관리자 - 전체, Supabase 직접) ───

export function useAdminNews() {
  return useQuery({
    queryKey: ['admin', 'news'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as News[]
    },
  })
}

// ─── 문의 목록 (관리자 - 전체, Supabase 직접) ───

export function useAdminInquiries() {
  return useQuery({
    queryKey: ['admin', 'inquiries'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Inquiry[]
    },
  })
}

// ─── 설문 목록 (관리자 - 전체, Supabase 직접) ───

export function useAdminSurveys() {
  return useQuery({
    queryKey: ['admin', 'surveys'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('franchise_surveys')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FranchiseSurvey[]
    },
  })
}

// ─── 대시보드 통계 (9개 쿼리 → Promise.all 병렬화) ───

export interface DashboardStats {
  newsCount: number
  branchCount: number
  unreadInquiries: number
  vehicleCount: number
  pendingReservations: number
  monthlyRevenue: number
  expiringInsurances: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const supabase = createClient()

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

      const [
        newsRes,
        branchRes,
        unreadRes,
        vehicleRes,
        pendingRes,
        paymentsRes,
        expiringRes,
      ] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('branches').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payments').select('amount').eq('status', 'completed').gte('paid_at', startOfMonth.toISOString()),
        supabase.from('vehicle_insurances').select('*', { count: 'exact', head: true }).eq('is_active', true).lte('end_date', thirtyDaysLater.toISOString().split('T')[0]),
      ])

      const monthlyRevenue = paymentsRes.data?.reduce((sum, p) => sum + p.amount, 0) || 0

      return {
        newsCount: newsRes.count || 0,
        branchCount: branchRes.count || 0,
        unreadInquiries: unreadRes.count || 0,
        vehicleCount: vehicleRes.count || 0,
        pendingReservations: pendingRes.count || 0,
        monthlyRevenue,
        expiringInsurances: expiringRes.count || 0,
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useDashboardRecentItems() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'recent'],
    queryFn: async () => {
      const supabase = createClient()

      const [inquiriesRes, newsRes] = await Promise.all([
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3),
      ])

      return {
        recentInquiries: (inquiriesRes.data || []) as Inquiry[],
        recentNews: (newsRes.data || []) as News[],
      }
    },
    staleTime: 60 * 1000,
  })
}
