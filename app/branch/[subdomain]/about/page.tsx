'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import {
  MapPin,
  Phone,
  Clock,
  Car,
  Users,
  Award,
  CheckCircle,
  Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { findBranch } from '@/lib/supabase/branch-lookup'
import type { Branch } from '@/types/database'
import { BRANCH_DEFAULTS } from '@/lib/constants/company'

export default function BranchAboutPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [branchImages, setBranchImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranchData()
  }, [subdomain])

  const fetchBranchData = async () => {
    try {
      const supabase = createClient()
      const branchData = await findBranch(supabase, subdomain)

      setBranch(branchData)

      // 지점 이미지 로드
      if (branchData) {
        const { data: imageFiles, error: listError } = await supabase.storage
          .from('branch-images')
          .list(branchData.id, {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (imageFiles && imageFiles.length > 0) {
          // Filter out placeholder files and subfolders (like 'vehicles')
          const validFiles = imageFiles.filter(file =>
            file.name !== '.emptyFolderPlaceholder' &&
            !file.name.includes('vehicles') &&
            file.id // folders don't have an id, only files do
          )

          if (validFiles.length > 0) {
            const imageUrls = validFiles.map(file => {
              const { data: urlData } = supabase.storage
                .from('branch-images')
                .getPublicUrl(`${branchData.id}/${file.name}`)
              return urlData.publicUrl
            })
            setBranchImages(imageUrls)
          }
        }
      }
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">지점소개</h1>
          <p className="text-white/80">
            차놀자 {branch.name}을 소개합니다
          </p>
        </div>
      </section>

      {/* 지점 소개 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm font-medium">차놀자 {branch.region}</span>
              </div>
              <h2 className="text-3xl font-bold text-dark mb-6">
                {branch.name}
              </h2>
              {branch.introduction ? (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {branch.introduction}
                </p>
              ) : (
                <>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    차놀자 {branch.name}은 {branch.region} 지역에서 고객님께 최고의 렌트카 서비스를 제공하기 위해
                    노력하고 있습니다. {BRANCH_DEFAULTS.description}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    전국 120개 이상의 차놀자 네트워크와 함께 어디서나 편리하게
                    렌트카 서비스를 이용하실 수 있습니다.
                  </p>
                </>
              )}
            </div>
            <div className="relative">
              {branchImages.length > 0 ? (
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <Image
                    src={branchImages[0]}
                    alt={`${branch.name} 지점 이미지`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-2xl aspect-square flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Car className="w-24 h-24 mx-auto mb-4" />
                    <p>지점 이미지</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 지점 정보 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-dark mb-8 text-center">지점 정보</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-dark mb-2">주소</h4>
              <p className="text-gray-600">{branch.address}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-dark mb-2">연락처</h4>
              <a href={`tel:${branch.phone}`} className="text-primary hover:underline">
                {branch.phone}
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-dark mb-2">영업시간</h4>
              <p className="text-gray-600">연중무휴 {BRANCH_DEFAULTS.businessHours}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 왜 차놀자인가 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-dark mb-4">왜 차놀자인가요?</h3>
            <p className="text-gray-500">차놀자만의 특별한 서비스를 경험하세요</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Car,
                title: '다양한 차량',
                description: '경차부터 SUV, 캠핑카까지 다양한 차량 보유'
              },
              {
                icon: Award,
                title: '품질 보증',
                description: '정기적인 점검과 세차로 깨끗한 차량 제공'
              },
              {
                icon: Users,
                title: '친절한 서비스',
                description: '전문 상담원의 친절한 고객 응대'
              },
              {
                icon: CheckCircle,
                title: '합리적 가격',
                description: '투명한 가격 정책으로 합리적인 요금'
              }
            ].map((item, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-bold text-dark mb-2">{item.title}</h4>
                <p className="text-gray-500 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">문의하기</h3>
          <p className="text-white/80 mb-6">궁금한 점이 있으시면 언제든 연락주세요</p>
          <a
            href={`tel:${branch.phone}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-5 h-5" />
            {branch.phone}
          </a>
        </div>
      </section>
    </>
  )
}
