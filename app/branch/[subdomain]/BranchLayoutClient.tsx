'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRANCHES_PUBLIC_COLUMNS } from '@/lib/supabase/constants'
import { getTheme } from '@/lib/themes'
import BranchHeader from '@/components/branch/BranchHeader'
import BranchFooter from '@/components/branch/BranchFooter'
import type { Branch } from '@/types/database'

interface Props {
  subdomain: string
  children: React.ReactNode
}

export default function BranchLayoutClient({ subdomain, children }: Props) {
  const pathname = usePathname()
  const decodedSubdomain = decodeURIComponent(subdomain)
  const [branch, setBranch] = useState<Branch | null>(null)

  // 관리자 페이지에서는 헤더/푸터 숨김
  const isAdminPage = pathname?.includes('/admin')

  useEffect(() => {
    if (isAdminPage) return

    const fetchBranch = async () => {
      const supabase = createClient()
      const { data: allBranches } = await supabase
        .from('branches')
        .select(BRANCHES_PUBLIC_COLUMNS)
        .eq('is_active', true)

      if (!allBranches) return

      let found = allBranches.find(b => b.subdomain === decodedSubdomain)
      if (!found) found = allBranches.find(b => b.name === decodedSubdomain)
      if (!found) found = allBranches.find(b => b.name.includes(decodedSubdomain))

      if (found) setBranch(found)
    }

    fetchBranch()
  }, [decodedSubdomain, isAdminPage])

  // 관리자 페이지는 헤더/푸터 없이 렌더링
  if (isAdminPage) {
    return <>{children}</>
  }

  const theme = getTheme(branch?.theme)

  return (
    <div className="pt-14 pb-14 lg:pt-16 lg:pb-0">
      <BranchHeader
        subdomain={decodedSubdomain}
        branchName={branch?.name || ''}
        branchPhone={branch?.phone || undefined}
        theme={theme}
      />
      <main className="min-h-screen">
        {children}
      </main>
      <BranchFooter
        subdomain={decodedSubdomain}
        branchName={branch?.name || ''}
        branchPhone={branch?.phone || undefined}
        branchAddress={branch?.address || undefined}
        theme={theme}
      />
    </div>
  )
}
