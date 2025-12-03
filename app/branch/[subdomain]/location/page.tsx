'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  MapPin,
  Phone,
  Clock,
  Car,
  Navigation
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database'

export default function BranchLocationPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranchData()
  }, [subdomain])

  const fetchBranchData = async () => {
    try {
      const supabase = createClient()
      const { data: allBranches, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)

      if (error || !allBranches) {
        setLoading(false)
        return
      }

      let branchData = allBranches.find(b => b.subdomain === decodedSubdomain)
      if (!branchData) {
        branchData = allBranches.find(b => b.name === decodedSubdomain)
      }
      if (!branchData) {
        branchData = allBranches.find(b => b.name.includes(decodedSubdomain))
      }

      setBranch(branchData || null)
    } catch (error) {
      console.error('Error fetching branch:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !branch) {
    return null
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">찾아오는길</h1>
          <p className="text-white/80">
            {branch.name} 오시는 방법을 안내해 드립니다
          </p>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 지도 영역 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                {/* 네이버맵 iframe */}
                <div className="aspect-video bg-gray-100">
                  {branch.lat && branch.lng ? (
                    <iframe
                      src={`https://map.naver.com/p/entry/place/${branch.lat},${branch.lng}?c=${branch.lng},${branch.lat},15,0,0,0,dh`}
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: '400px' }}
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
                      <MapPin className="w-16 h-16 mb-4" />
                      <p className="font-medium">{branch.name}</p>
                      <p className="text-sm mt-2">{branch.address}</p>
                    </div>
                  )}
                </div>

                {/* 길찾기 버튼 */}
                <div className="p-4 border-t">
                  <a
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(branch.address || branch.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-green-500 text-white font-medium rounded-lg text-center hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    네이버 지도에서 길찾기
                  </a>
                </div>
              </div>
            </div>

            {/* 지점 정보 */}
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-dark text-lg mb-4">지점 정보</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">주소</p>
                      <p className="text-dark font-medium">{branch.address}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">전화번호</p>
                      <a href={`tel:${branch.phone}`} className="text-primary font-medium hover:underline">
                        {branch.phone}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">영업시간</p>
                      <p className="text-dark font-medium">연중무휴 09:00 - 21:00</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 전화 문의 */}
              <div className="bg-primary rounded-xl p-6 text-white">
                <h3 className="font-bold text-lg mb-2">전화 문의</h3>
                <p className="text-white/80 text-sm mb-4">
                  길을 찾기 어려우시면 전화주세요.<br />
                  친절하게 안내해 드리겠습니다.
                </p>
                <a
                  href={`tel:${branch.phone}`}
                  className="w-full py-3 bg-white text-primary font-bold rounded-lg text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  {branch.phone}
                </a>
              </div>

              {/* 주차 안내 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-dark">주차 안내</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  지점 방문 시 주차가 가능합니다.<br />
                  자세한 주차 안내는 전화로 문의해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 교통 안내 */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-dark mb-8 text-center">교통 안내</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-bold text-dark mb-4">대중교통 이용 시</h4>
              <ul className="space-y-2 text-gray-600">
                <li>- 가까운 지하철역/버스정류장에서 도보 이동</li>
                <li>- 자세한 대중교통 정보는 네이버 지도 길찾기를 이용해주세요</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-bold text-dark mb-4">자가용 이용 시</h4>
              <ul className="space-y-2 text-gray-600">
                <li>- 네비게이션에 "{branch.name}" 또는 주소 검색</li>
                <li>- 지점 내 주차 가능 (방문 전 전화 확인)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">방문 예약</h3>
          <p className="text-gray-400 mb-6">
            방문 전 전화로 예약하시면 더 빠른 서비스를 받으실 수 있습니다
          </p>
          <a
            href={`tel:${branch.phone}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-5 h-5" />
            {branch.phone}
          </a>
        </div>
      </section>
    </>
  )
}
