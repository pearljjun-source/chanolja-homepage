'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Branch {
  id: string
  name: string
  region: string
  address: string | null
  phone: string | null
  branch_type: string
  is_active: boolean
  lat: number | null
  lng: number | null
  subdomain?: string | null
  vehicle_count?: number
}

export default function BranchesMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  // Supabase에서 지점 데이터 가져오기
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const supabase = createClient()

        // 지점 조회
        const { data: branchesData, error } = await supabase
          .from('branches')
          .select('*')
          .eq('is_active', true)
          .order('region', { ascending: true })

        if (error) {
          console.error('Supabase error:', error)
        }

        if (branchesData) {
          // 각 지점의 차량 수 조회
          const { data: vehicleCounts } = await supabase
            .from('vehicles')
            .select('branch_id')
            .eq('is_active', true)

          // 지점별 차량 수 계산
          const countMap: Record<string, number> = {}
          vehicleCounts?.forEach(v => {
            countMap[v.branch_id] = (countMap[v.branch_id] || 0) + 1
          })

          // 지점 데이터에 차량 수 추가
          const branchesWithCount = branchesData.map(b => ({
            ...b,
            vehicle_count: countMap[b.id] || 0
          }))

          setBranches(branchesWithCount)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBranches()
  }, [])

  // 지역별 지점 수 계산
  const regionCounts = branches.reduce((acc, branch) => {
    acc[branch.region] = (acc[branch.region] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  useEffect(() => {
    // 네이버 지도 API 키가 없으면 스킵
    if (!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID) {
      setMapError(true)
      return
    }

    // 지점 데이터가 로드될 때까지 대기
    if (loading) return

    const initMap = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) return

      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(36.5, 127.5),
        zoom: 7,
      })

      // 정보창 인스턴스
      let currentInfoWindow: any = null

      // 좌표가 있는 지점들에 마커 추가
      branches.forEach((branch) => {
        if (branch.lat && branch.lng) {
          const position = new window.naver.maps.LatLng(branch.lat, branch.lng)

          // 지점 유형에 따른 마커 색상 설정
          const markerColor = branch.branch_type === 'camping' ? '#22c55e' :
                              branch.branch_type === 'both' ? '#a855f7' : '#F97316'

          const marker = new window.naver.maps.Marker({
            position,
            map,
            icon: {
              content: `<div style="width: 24px; height: 24px; background: ${markerColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
              anchor: new window.naver.maps.Point(12, 12),
            },
          })

          // 정보창 내용
          const branchUrl = `/branch/${encodeURIComponent(branch.subdomain || branch.name)}`
          const hasHomepage = (branch.vehicle_count ?? 0) > 0
          const infoContent = `
            <div style="padding: 12px; min-width: 200px; font-family: sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${branch.name}</h3>
              ${branch.address ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">${branch.address}</p>` : ''}
              ${branch.phone ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">📞 ${branch.phone}</p>` : ''}
              ${hasHomepage ? `<a href="${branchUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 6px 12px; background: #F97316; color: white; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none;">지점 홈페이지 →</a>` : ''}
            </div>
          `

          const infoWindow = new window.naver.maps.InfoWindow({
            content: infoContent,
            borderWidth: 0,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          })

          // 마커 클릭 이벤트
          window.naver.maps.Event.addListener(marker, 'click', () => {
            if (currentInfoWindow) {
              currentInfoWindow.close()
            }
            infoWindow.open(map, marker)
            currentInfoWindow = infoWindow
          })
        }
      })

      // 지도 클릭 시 정보창 닫기
      window.naver.maps.Event.addListener(map, 'click', () => {
        if (currentInfoWindow) {
          currentInfoWindow.close()
          currentInfoWindow = null
        }
      })
    }

    // 인증 실패 핸들러 등록
    (window as any).navermap_authFailure = function() {
      console.error('네이버 지도 API 인증 실패')
      setMapError(true)
    }

    // 네이버 지도 API 스크립트 로드
    const existingScript = document.querySelector(`script[src*="oapi.map.naver.com"]`)

    if (existingScript && window.naver && window.naver.maps) {
      // 이미 스크립트가 로드되어 있으면 바로 지도 초기화
      initMap()
    } else if (!existingScript) {
      // 스크립트가 없으면 새로 로드
      const script = document.createElement('script')
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`
      script.async = true
      script.onload = initMap
      script.onerror = () => setMapError(true)
      document.head.appendChild(script)
    }

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (재사용을 위해)
    }
  }, [loading, branches])

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">
            전국 <span className="text-primary">지점 지도</span>
          </h2>
          <p className="section-subtitle">
            지도에서 가까운 지점을 찾아보세요
          </p>
        </div>

        {/* Map Container or Region Summary */}
        <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
          {mapError || !process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ? (
            <div className="p-8">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <Building2 className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-gray-700 text-lg font-medium">
                      전국 <span className="text-primary font-bold">{branches.length}</span>개 지점 운영 중
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(regionCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([region, count]) => (
                        <div
                          key={region}
                          className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                        >
                          <p className="text-2xl font-bold text-primary">{count}</p>
                          <p className="text-gray-600 text-sm">{region}</p>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div ref={mapRef} className="aspect-[16/9] w-full" />
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded-full" />
            <span className="text-gray-600">렌트카 지점</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span className="text-gray-600">캠핑카 지점</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// 네이버 지도 타입 선언
declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: object) => object
        LatLng: new (lat: number, lng: number) => object
        Point: new (x: number, y: number) => object
        Marker: new (options: object) => object
        InfoWindow: new (options: object) => { getMap: () => object | null; open: (map: object, marker: object) => void; close: () => void }
        Event: {
          addListener: (target: object, event: string, callback: () => void) => void
        }
      }
    }
  }
}
