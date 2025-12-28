import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // URL에서 줄바꿈 제거 및 punycode 도메인 사용
  const baseUrl = (process.env.NEXT_PUBLIC_URL || 'https://xn--w80bk23b0hd.net').trim()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/startup`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/branches`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reservation`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Dynamic pages - branches
  let branchPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data: branches } = await supabase
      .from('branches')
      .select('name, subdomain, updated_at')
      .eq('is_active', true)

    if (branches) {
      branchPages = branches.map((branch) => ({
        url: `${baseUrl}/branch/${encodeURIComponent(branch.subdomain || branch.name)}`,
        lastModified: branch.updated_at ? new Date(branch.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error fetching branches for sitemap:', error)
  }

  // Dynamic pages - news
  let newsPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data: news } = await supabase
      .from('news')
      .select('id, updated_at')
      .eq('is_published', true)

    if (news) {
      newsPages = news.map((item) => ({
        url: `${baseUrl}/news/${item.id}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error fetching news for sitemap:', error)
  }

  return [...staticPages, ...branchPages, ...newsPages]
}
