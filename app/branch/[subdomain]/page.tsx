'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  MapPin,
  Phone,
  Clock,
  Star,
  ChevronRight,
  Shield,
  FileText,
  CheckCircle,
  Quote,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  Play
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Vehicle, Review } from '@/types/database'

export default function BranchHomePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
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

      if (!branchData) {
        setLoading(false)
        return
      }

      setBranch(branchData)

      // 차량 조회
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('branch_id', branchData.id)
        .eq('is_active', true)
        .eq('status', 'available')
        .order('price_per_day', { ascending: true })
        .limit(6)

      if (vehiclesData) {
        setVehicles(vehiclesData)
      }

      // 승인된 리뷰 조회
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('branch_id', branchData.id)
        .eq('is_approved', true)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(3)

      if (reviewsData) {
        setReviews(reviewsData)
      }
    } catch (error) {
      console.error('Error fetching branch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (name.length <= 1) return name
    return name[0] + '*'.repeat(name.length - 1)
  }

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  if (loading || !branch) {
    return null
  }

  return (
    <>
      {/* Hero Section - 모바일 최적화 */}
      <section className="relative bg-white min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-5 md:top-20 md:left-10 w-48 md:w-72 h-48 md:h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-5 md:bottom-20 md:right-10 w-64 md:w-96 h-64 md:h-96 bg-sky-200 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 backdrop-blur-sm rounded-full mb-4 md:mb-6">
                <Award className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-xs md:text-sm font-bold text-primary">차놀자 공식 파트너</span>
              </div>

              <h1 className="mb-4 md:mb-6 flex flex-col items-center lg:items-start">
                <Image
                  src="/images/korean logo.png"
                  alt="차놀자"
                  width={600}
                  height={160}
                  className="h-16 md:h-24 lg:h-32 w-auto"
                />
                <span className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-primary -mt-1 md:-mt-2">
                  {branch.name}
                  <span className="text-gray-700 font-bold ml-1">지점</span>
                </span>
              </h1>

              <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {branch.description || '깨끗하고 안전한 차량, 합리적인 가격으로 고객님의 특별한 여정을 함께합니다.'}
              </p>

              {/* 모바일 CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-10">
                <a
                  href={`tel:${branch.phone}`}
                  className="group px-6 py-3.5 md:px-8 md:py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-sm md:text-base"
                >
                  <Phone className="w-4 h-4 md:w-5 md:h-5" />
                  지금 예약하기
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link
                  href={`/branch/${decodedSubdomain}/vehicles`}
                  className="px-6 py-3.5 md:px-8 md:py-4 bg-transparent hover:bg-primary/5 text-primary rounded-xl font-bold transition-all duration-300 border-2 border-primary flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Car className="w-4 h-4 md:w-5 md:h-5" />
                  차량 둘러보기
                </Link>
              </div>

              {/* 빠른 정보 - 모바일 최적화 */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] md:text-xs text-gray-500 font-semibold">위치</p>
                    <p className="text-xs md:text-sm font-bold text-gray-800">{branch.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] md:text-xs text-gray-500 font-semibold">영업시간</p>
                    <p className="text-xs md:text-sm font-bold text-gray-800">09:00 - 21:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 카드 영역 - 데스크톱 전용 */}
            <div className="hidden lg:block relative">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full mb-3">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-semibold">전화 문의</span>
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight text-gray-800">
                    {branch.phone}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4">
                    <p className="text-2xl font-bold text-primary">{vehicles.length}+</p>
                    <p className="text-xs text-gray-600 font-semibold">보유 차량</p>
                  </div>
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4">
                    <p className="text-2xl font-bold text-primary">4.8</p>
                    <p className="text-xs text-gray-600 font-semibold">평점</p>
                  </div>
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4">
                    <p className="text-2xl font-bold text-primary">24h</p>
                    <p className="text-xs text-gray-600 font-semibold">지원</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 모바일 통계 - 개선 */}
      <section className="lg:hidden py-4 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="py-3 bg-gray-50 rounded-xl">
              <p className="text-xl font-bold text-primary">{vehicles.length}+</p>
              <p className="text-[10px] text-gray-500 font-medium">보유 차량</p>
            </div>
            <div className="py-3 bg-gray-50 rounded-xl">
              <p className="text-xl font-bold text-primary">4.8</p>
              <p className="text-[10px] text-gray-500 font-medium">고객 평점</p>
            </div>
            <div className="py-3 bg-gray-50 rounded-xl">
              <p className="text-xl font-bold text-primary">24h</p>
              <p className="text-[10px] text-gray-500 font-medium">고객 지원</p>
            </div>
          </div>
        </div>
      </section>

      {/* 서비스 특징 - 모바일 최적화 */}
      <section className="py-12 md:py-20 bg-primary relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-sky-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4">
              WHY CHANOLJA
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">
              차놀자를 선택하는 이유
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base">
              전국 120개 이상의 지점 네트워크와 함께 편리한 렌트카 서비스를 경험하세요
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {[
              {
                icon: Car,
                title: '다양한 차량',
                description: '경차부터 SUV까지',
                color: 'bg-blue-500'
              },
              {
                icon: Shield,
                title: '완벽한 보험',
                description: '대인/대물/자차 보장',
                color: 'bg-green-500'
              },
              {
                icon: Award,
                title: '품질 보증',
                description: '깨끗한 차량 제공',
                color: 'bg-purple-500'
              },
              {
                icon: Users,
                title: '친절한 서비스',
                description: '24시간 고객 지원',
                color: 'bg-orange-500'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="group relative bg-white/10 backdrop-blur-sm md:hover:bg-white rounded-xl md:rounded-2xl p-4 md:p-8 transition-all duration-300 md:hover:shadow-xl md:hover:-translate-y-1"
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 ${item.color} rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-6`}>
                  <item.icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
                <h3 className="text-sm md:text-xl font-bold text-white group-hover:text-gray-900 mb-1 md:mb-3 transition-colors">{item.title}</h3>
                <p className="text-white/80 group-hover:text-gray-500 text-xs md:text-base leading-relaxed transition-colors">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 인기 차량 - 모바일 최적화 */}
      {vehicles.length > 0 && (
        <section className="py-10 md:py-20 bg-gray-50 pb-24 md:pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between gap-4 mb-6 md:mb-12">
              <div>
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-medium mb-2 md:mb-4">
                  POPULAR
                </span>
                <h2 className="text-xl md:text-4xl font-bold text-gray-900">
                  인기 차량
                </h2>
              </div>
              <Link
                href={`/branch/${decodedSubdomain}/vehicles`}
                className="inline-flex items-center gap-1 text-primary font-semibold text-sm md:text-base"
              >
                전체보기
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {vehicles.slice(0, 4).map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/branch/${decodedSubdomain}/vehicle/${vehicle.id}`}
                  className="group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] md:hover:shadow-2xl transition-all duration-300 md:hover:-translate-y-2"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {vehicle.thumbnail_url ? (
                      <Image
                        src={vehicle.thumbnail_url}
                        alt={vehicle.name}
                        fill
                        className="object-cover md:group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 md:w-20 h-12 md:h-20 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-6">
                    <div className="mb-2 md:mb-3">
                      <h4 className="text-sm md:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                        {vehicle.name}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-400">일 렌트</p>
                        <p className="text-base md:text-xl font-bold text-primary">
                          {vehicle.price_per_day.toLocaleString()}
                          <span className="text-xs md:text-sm font-normal text-gray-500">원</span>
                        </p>
                      </div>
                      <div className="hidden md:flex w-10 h-10 bg-primary/10 rounded-full items-center justify-center group-hover:bg-primary transition-colors">
                        <ArrowRight className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 고객 후기 - 모바일 최적화 */}
      <section className="py-10 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between gap-4 mb-6 md:mb-12">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-medium mb-2 md:mb-4">
                REVIEWS
              </span>
              <h2 className="text-xl md:text-4xl font-bold text-gray-900">
                고객 후기
              </h2>
            </div>
            <Link
              href={`/branch/${decodedSubdomain}/reviews`}
              className="inline-flex items-center gap-1 text-primary font-semibold text-sm md:text-base"
            >
              더보기
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-8"
                >
                  <div className="flex items-center gap-0.5 mb-2 md:mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 md:w-5 md:h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-3 md:mb-6 leading-relaxed text-sm md:text-lg line-clamp-3 md:line-clamp-none">
                    "{review.content}"
                  </p>
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm md:text-base">{maskName(review.customer_name)}</p>
                      {review.vehicle_name && (
                        <p className="text-xs md:text-sm text-gray-400">{review.vehicle_name}</p>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-gray-400">{formatDate(review.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 bg-gray-50 rounded-xl md:rounded-2xl">
              <Quote className="w-8 h-8 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-500 mb-3 md:mb-4 text-sm md:text-base">아직 등록된 후기가 없습니다.</p>
              <Link
                href={`/branch/${decodedSubdomain}/reviews`}
                className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-primary text-white rounded-lg font-semibold text-sm md:text-base"
              >
                첫 번째 후기 작성하기
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 보험 및 이용안내 - 모바일 최적화 */}
      <section className="py-10 md:py-20 bg-gradient-to-br from-gray-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-16">
            <span className="inline-block px-3 py-1 bg-white/10 text-white rounded-full text-xs md:text-sm font-medium mb-2 md:mb-4">
              INFO
            </span>
            <h2 className="text-xl md:text-4xl font-bold mb-2 md:mb-4">
              보험 및 이용안내
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 border border-white/10">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-green-500/20 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 md:w-7 md:h-7 text-green-400" />
                </div>
                <h3 className="text-base md:text-xl font-bold">보험 안내</h3>
              </div>
              <ul className="space-y-2 md:space-y-4">
                {[
                  '대인배상: 무한',
                  '대물배상: 2천만원 ~ 1억원',
                  '자손/자차: 차량에 따라 상이',
                  '만 26세 미만 추가요금'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs md:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 border border-white/10">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-500/20 rounded-lg md:rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 md:w-7 md:h-7 text-blue-400" />
                </div>
                <h3 className="text-base md:text-xl font-bold">이용 안내</h3>
              </div>
              <ul className="space-y-2 md:space-y-4">
                {[
                  '만 21세 이상, 면허 1년 이상',
                  '본인 명의 신용카드 필수',
                  '24시간 전 무료 취소',
                  '연료 동일 반납'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs md:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - 모바일 최적화 */}
      <section className="py-10 md:py-20 bg-primary relative overflow-hidden mb-16 md:mb-0">
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-sky-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-4xl font-bold text-white mb-3 md:mb-6">
            지금 바로 예약하세요
          </h2>
          <p className="text-slate-700 mb-4 md:mb-8 max-w-xl mx-auto text-sm md:text-lg leading-relaxed font-medium">
            친절한 상담과 합리적인 가격으로 모시겠습니다
          </p>
          <a
            href={`tel:${branch.phone}`}
            className="inline-flex items-center gap-2 md:gap-3 px-6 py-3 md:px-10 md:py-5 bg-white text-primary rounded-xl font-bold text-lg md:text-xl shadow-xl active:scale-95 transition-transform"
          >
            <Phone className="w-5 h-5 md:w-6 md:h-6" />
            {branch.phone}
          </a>
          <p className="mt-4 md:mt-6 text-slate-700 text-xs md:text-sm font-medium">
            연중무휴 09:00 - 21:00
          </p>
        </div>
      </section>
    </>
  )
}
