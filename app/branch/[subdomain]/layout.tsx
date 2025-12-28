import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: { subdomain: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subdomain = decodeURIComponent(params.subdomain)

  try {
    const supabase = await createClient()
    const { data: branches } = await supabase
      .from('branches')
      .select('name, subdomain, description, region, phone')
      .eq('is_active', true)

    if (!branches) {
      return {
        title: '지점 페이지',
      }
    }

    // subdomain 또는 name으로 지점 찾기
    let branch = branches.find((b: any) => b.subdomain === subdomain)
    if (!branch) {
      branch = branches.find((b: any) => b.name === subdomain)
    }
    if (!branch) {
      branch = branches.find((b: any) => b.name.includes(subdomain))
    }

    if (!branch) {
      return {
        title: '지점 페이지',
      }
    }

    const title = `차놀자 ${branch.name} | 렌트카 예약`
    const description = branch.description || `${branch.name}에서 깨끗하고 안전한 렌트카를 합리적인 가격에 이용하세요. ${branch.region} 지역 렌트카 예약.`

    return {
      title,
      description,
      keywords: [
        branch.name,
        `${branch.name} 렌트카`,
        `${branch.region} 렌트카`,
        '차놀자',
        '렌트카 예약',
        '자동차 렌트',
      ],
      openGraph: {
        title,
        description,
        url: `/branch/${subdomain}`,
        siteName: '차놀자 CHANOLJA',
        locale: 'ko_KR',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: `/branch/${subdomain}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: '지점 페이지 | 차놀자',
    }
  }
}

export default function BranchLayout({ children }: Props) {
  return children
}
