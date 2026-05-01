'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateBranches() {
  revalidatePath('/branches')
}

export async function revalidateVehicles(branchSubdomain?: string) {
  if (branchSubdomain) {
    revalidatePath(`/branch/${branchSubdomain}/vehicles`)
  }
}

export async function revalidateInsurances() {
  // 보험은 공개 페이지가 없으므로 관련 차량 페이지만 갱신
  revalidatePath('/branches')
}
