'use client'

import { useState, useEffect } from 'react'
import { MapPin, Phone, Car, Tent, Globe, ExternalLink, Home } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Branch {
  id: string
  name: string
  region: string
  address: string | null
  phone: string | null
  branch_type: string
  is_active: boolean
  owner_name?: string | null
  website_url?: string | null
  subdomain?: string | null
}

export default function BranchesList() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('전체')
  const [regions, setRegions] = useState<string[]>(['전체'])

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (error) {
          console.error('Supabase error:', error)
        }
        if (data) {
          setBranches(data)
          // 지역 목록 추출
          const uniqueRegions = [...new Set(data.map(b => b.region))].sort()
          setRegions(['전체', ...uniqueRegions])
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBranches()
  }, [])

  const filteredBranches = selectedRegion === '전체'
    ? branches
    : branches.filter(b => b.region === selectedRegion)

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">
            지역별 <span className="text-primary">지점 안내</span>
          </h2>
          <p className="section-subtitle">
            원하시는 지역을 선택하여 지점을 확인하세요
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Region Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedRegion === region
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Branch Grid */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-dark">
                  {selectedRegion === '전체' ? '전국' : selectedRegion} 지점
                </h3>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {filteredBranches.length}개 지점
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium text-gray-800">{branch.name}</span>
                    </div>
                    {branch.address && (
                      <p className="text-gray-500 text-xs mb-1 line-clamp-1">{branch.address}</p>
                    )}
                    {branch.phone && (
                      <p className="text-gray-500 text-xs mb-2">{branch.phone}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={`/branch/${encodeURIComponent(branch.subdomain || branch.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <Home className="w-3 h-3" />
                        지점 홈페이지
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {branch.website_url && (
                        <a
                          href={branch.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          외부링크
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredBranches.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  등록된 지점이 없습니다.
                </div>
              )}
            </div>
          </>
        )}

        {/* Contact Info */}
        <div className="mt-12 bg-primary rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">지점 문의</h3>
          <p className="text-white/90 mb-6">
            가까운 지점이나 창업에 관한 문의는 본사로 연락해주세요.
          </p>
          <a
            href="tel:041-522-7000"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-5 h-5" />
            041-522-7000
          </a>
        </div>

        {/* Camping Branches */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="section-title">
              <span className="text-primary">캠핑카</span> 지점 안내
            </h2>
            <p className="section-subtitle">
              국내 최다/최대 차놀자캠핑 (50여개 지점 / 230여대 캠핑카)
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { region: '서울', branches: '경기 | 서초 | 송파 | 용산 | 중랑' },
                { region: '인천', branches: '남동 | 부평 | 영종도 | 서구 | 송도' },
                { region: '경기', branches: '고양 | 김포 | 수원 | 안성 | 평택 | 용인 | 화성' },
                { region: '충남/대전', branches: '대전 | 아산 | 세종 | 천안 | 홍성 | 청주' },
                { region: '전북', branches: '전주 | 익산 | 세종' },
                { region: '경북권', branches: '대구 | 경주 | 울산' },
                { region: '경남/부산', branches: '부산북구 | 부산해운대 | 남양산 | 창원' },
                { region: '제주', branches: '제주시' },
              ].map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Tent className="w-5 h-5 text-green-500" />
                    <h4 className="font-bold text-dark">{item.region}</h4>
                  </div>
                  <p className="text-gray-600 text-sm">{item.branches}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
