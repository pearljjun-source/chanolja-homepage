import type { Branch } from '@/types/database'
import { BRANCHES_PUBLIC_COLUMNS } from './constants'

interface SupabaseClient {
  from: (table: string) => any
}

/**
 * 지점 조회 유틸 - subdomain 또는 name으로 지점 찾기
 * 모든 branch 관련 페이지에서 이 함수를 사용하세요.
 */
export async function findBranch(
  supabase: SupabaseClient,
  subdomain: string
): Promise<Branch | null> {
  const decoded = decodeURIComponent(subdomain)

  const { data: allBranches, error } = await supabase
    .from('branches')
    .select(BRANCHES_PUBLIC_COLUMNS)
    .eq('is_active', true)

  if (error || !allBranches) return null

  return findBranchFromList(allBranches, decoded)
}

/**
 * 이미 조회한 branches 배열에서 지점 찾기
 */
export function findBranchFromList(
  branches: Branch[],
  subdomain: string
): Branch | null {
  const decoded = decodeURIComponent(subdomain)

  // 1순위: subdomain 정확 매칭
  let branch = branches.find(b => b.subdomain === decoded)
  // 2순위: name 정확 매칭
  if (!branch) branch = branches.find(b => b.name === decoded)
  // 3순위: name 부분 매칭
  if (!branch) branch = branches.find(b => b.name.includes(decoded))

  return branch || null
}
