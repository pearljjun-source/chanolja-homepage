import { Metadata } from 'next'
import BranchesHero from '@/components/branches/BranchesHero'
import BranchesMap from '@/components/branches/BranchesMap'
import BranchesList from '@/components/branches/BranchesList'
import { createClient } from '@/lib/supabase/server'
import { BRANCHES_PUBLIC_COLUMNS } from '@/lib/supabase/constants'

export const revalidate = 3600 // 1시간마다 ISR 재생성

export const metadata: Metadata = {
  title: '지점현황',
  description: '차놀자 전국 120개 지점을 확인하세요. 서울, 경기, 인천, 충청, 전라, 경상, 강원, 부산, 제주까지 전국 어디서나 차놀자를 만날 수 있습니다.',
  alternates: {
    canonical: '/branches',
  },
}

export default async function BranchesPage() {
  const supabase = await createClient()

  const [branchesRes, vehicleCountsRes] = await Promise.all([
    supabase
      .from('branches')
      .select(BRANCHES_PUBLIC_COLUMNS)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('vehicles')
      .select('branch_id')
      .eq('is_active', true),
  ])

  const branchesData = branchesRes.data || []
  const vehicleCounts = vehicleCountsRes.data || []

  // 지점별 차량 수 계산
  const countMap: Record<string, number> = {}
  vehicleCounts.forEach(v => {
    countMap[v.branch_id] = (countMap[v.branch_id] || 0) + 1
  })

  const branches = branchesData.map(b => ({
    ...b,
    vehicle_count: countMap[b.id] || 0,
  }))

  const regions = ['전체', ...[...new Set(branchesData.map(b => b.region))].sort()]

  return (
    <>
      <BranchesHero />
      <BranchesMap />
      <BranchesList branches={branches} regions={regions} />
    </>
  )
}
