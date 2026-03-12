'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  MapPin,
  Phone,
  Star,
  ChevronRight,
  Shield,
  FileText,
  CheckCircle,
  Quote,
  Users,
  Award,
  ArrowRight,
  Newspaper
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { findBranch } from '@/lib/supabase/branch-lookup'
import type { Branch, Vehicle, Review, News } from '@/types/database'
import { getTheme, themeClasses, type ThemeType } from '@/lib/themes'
import { getCategoryLabel } from '@/lib/constants/categories'
import { formatDateShort, maskName } from '@/lib/utils'
import { INSURANCE_INFO, RENTAL_REQUIREMENTS } from '@/lib/constants/insurance'
import { BRANCH_DEFAULTS } from '@/lib/constants/company'

export default function BranchHomePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const decodedSubdomain = decodeURIComponent(subdomain)

  const [branch, setBranch] = useState<Branch | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranchData()
  }, [subdomain])

  const fetchBranchData = async () => {
    try {
      const supabase = createClient()
      const branchData = await findBranch(supabase, subdomain)

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

      // 지점 뉴스 조회
      const { data: newsData } = await supabase
        .from('news')
        .select('*')
        .eq('branch_id', branchData.id)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3)

      if (newsData) {
        setNews(newsData)
      }
    } catch (error) {
      console.error('Error fetching branch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !branch) {
    return null
  }

  // 테마 설정
  const theme = getTheme(branch.theme)
  const tc = themeClasses[theme]

  // 실제 평균 평점 계산
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '-'

  // 최저가 차량
  const lowestPrice = vehicles.length > 0
    ? Math.min(...vehicles.map(v => v.price_per_day))
    : 0

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-10 left-5 md:top-20 md:left-10 w-48 md:w-72 h-48 md:h-72 ${tc.bg}/20 rounded-full blur-3xl`} />
          <div className={`absolute bottom-10 right-5 md:bottom-20 md:right-10 w-64 md:w-96 h-64 md:h-96 ${tc.accentBg} rounded-full blur-3xl`} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* 지점 뉴스룸 */}
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 ${tc.bgLight} backdrop-blur-sm rounded-full mb-4 md:mb-6`}>
                <Newspaper className={`w-3 h-3 md:w-4 md:h-4 ${tc.text}`} />
                <span className={`text-xs md:text-sm font-bold ${tc.text}`}>{branch.name} 뉴스룸</span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 md:mb-4">
                최신 소식
              </h1>
              <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8">
                {branch.name} 지점의 최신 뉴스와 공지사항을 확인하세요
              </p>

              {news.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {news.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/branch/${decodedSubdomain}/news`}
                      className="flex items-start gap-3 md:gap-4 bg-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all group"
                    >
                      {item.thumbnail_url && (
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <Image
                            src={item.thumbnail_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 text-[10px] md:text-xs font-medium rounded ${tc.bgLight} ${tc.text}`}>
                            {getCategoryLabel(item.category)}
                          </span>
                          <span className="text-[10px] md:text-xs text-gray-400">
                            {new Date(item.published_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <h3 className="text-sm md:text-base font-bold text-gray-900 truncate group-hover:text-gray-700">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.content}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm text-center mb-6">
                  <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">아직 등록된 소식이 없습니다</p>
                </div>
              )}

              <Link
                href={`/branch/${decodedSubdomain}/news`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 ${tc.bgLight} ${tc.text} rounded-xl font-bold text-sm md:text-base hover:opacity-80 transition-opacity`}
              >
                <Newspaper className="w-4 h-4" />
                모든 소식 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 우측 Quick Info Hub - 데스크톱 전용 */}
            <div className="hidden lg:flex flex-col gap-4 relative">
              <div className={`absolute -top-10 -right-10 w-64 h-64 ${tc.bg}/30 rounded-full blur-3xl`} />

              {/* 전화 문의 카드 */}
              <a href={`tel:${branch.phone}`} className="relative bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">전화 문의</p>
                    <p className="text-2xl font-extrabold tracking-tight text-gray-800 group-hover:text-gray-900">
                      {branch.phone}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${tc.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                </div>
              </a>

              {/* 클릭 가능한 통계 카드 그리드 */}
              <div className="grid grid-cols-3 gap-3">
                <Link
                  href={`/branch/${decodedSubdomain}/vehicles`}
                  className={`relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group text-center`}
                >
                  <Car className={`w-6 h-6 ${tc.text} mx-auto mb-2`} />
                  <p className={`text-2xl font-bold ${tc.text}`}>{vehicles.length}+</p>
                  <p className="text-[11px] text-gray-500 font-semibold">보유 차량</p>
                  {lowestPrice > 0 && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{(lowestPrice / 10000).toFixed(0)}만원~</p>
                  )}
                </Link>

                <Link
                  href={`/branch/${decodedSubdomain}/reviews`}
                  className="relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group text-center"
                >
                  <Star className={`w-6 h-6 ${tc.text} mx-auto mb-2`} />
                  <p className={`text-2xl font-bold ${tc.text}`}>{avgRating}</p>
                  <p className="text-[11px] text-gray-500 font-semibold">고객 평점</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">후기 {reviews.length}건</p>
                </Link>

                <Link
                  href={`/branch/${decodedSubdomain}/location`}
                  className="relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group text-center"
                >
                  <MapPin className={`w-6 h-6 ${tc.text} mx-auto mb-2`} />
                  <p className={`text-lg font-bold text-gray-800`}>{branch.region}</p>
                  <p className="text-[11px] text-gray-500 font-semibold">오시는 길</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">지도 보기</p>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 모바일 통계 - 클릭 가능 */}
      <section className="lg:hidden py-4 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Link href={`/branch/${decodedSubdomain}/vehicles`} className="py-3 bg-gray-50 rounded-xl active:bg-gray-100">
              <p className={`text-xl font-bold ${tc.text}`}>{vehicles.length}+</p>
              <p className="text-[10px] text-gray-500 font-medium">보유 차량</p>
            </Link>
            <Link href={`/branch/${decodedSubdomain}/reviews`} className="py-3 bg-gray-50 rounded-xl active:bg-gray-100">
              <p className={`text-xl font-bold ${tc.text}`}>{avgRating}</p>
              <p className="text-[10px] text-gray-500 font-medium">고객 평점</p>
            </Link>
            <Link href={`/branch/${decodedSubdomain}/location`} className="py-3 bg-gray-50 rounded-xl active:bg-gray-100">
              <p className={`text-base font-bold text-gray-800`}>{branch.region}</p>
              <p className="text-[10px] text-gray-500 font-medium">오시는 길</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 서비스 특징 */}
      <section className={`py-12 md:py-20 ${tc.bg} relative overflow-hidden`}>
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
              { icon: Car, title: '다양한 차량', description: '경차부터 SUV까지', color: 'bg-blue-500' },
              { icon: Shield, title: '완벽한 보험', description: '대인/대물/자차 보장', color: 'bg-green-500' },
              { icon: Award, title: '품질 보증', description: '깨끗한 차량 제공', color: 'bg-purple-500' },
              { icon: Users, title: '친절한 서비스', description: '24시간 고객 지원', color: 'bg-orange-500' }
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

      {/* 인기 차량 */}
      {vehicles.length > 0 && (
        <section className="py-10 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between gap-4 mb-6 md:mb-12">
              <div>
                <span className={`inline-block px-3 py-1 ${tc.bgLight} ${tc.text} rounded-full text-xs md:text-sm font-medium mb-2 md:mb-4`}>
                  POPULAR
                </span>
                <h2 className="text-xl md:text-4xl font-bold text-gray-900">
                  인기 차량
                </h2>
              </div>
              <Link
                href={`/branch/${decodedSubdomain}/vehicles`}
                className={`inline-flex items-center gap-1 ${tc.text} font-semibold text-sm md:text-base`}
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
                        sizes="(max-width: 768px) 50vw, 33vw"
                        quality={85}
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
                      <h4 className="text-sm md:text-lg font-bold text-gray-900 truncate">
                        {vehicle.name}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-400">일 렌트</p>
                        <p className={`text-base md:text-xl font-bold ${tc.text}`}>
                          {vehicle.price_per_day.toLocaleString()}
                          <span className="text-xs md:text-sm font-normal text-gray-500">원</span>
                        </p>
                      </div>
                      <div className={`hidden md:flex w-10 h-10 ${tc.bgLight} rounded-full items-center justify-center`}>
                        <ArrowRight className={`w-5 h-5 ${tc.text}`} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 지점 소식 */}
      {news.length > 0 && (
        <section className="py-10 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between gap-4 mb-6 md:mb-12">
              <div>
                <span className={`inline-block px-3 py-1 ${tc.bgLight} ${tc.text} rounded-full text-xs md:text-sm font-medium mb-2 md:mb-4`}>
                  NEWS
                </span>
                <h2 className="text-xl md:text-4xl font-bold text-gray-900">
                  지점 소식
                </h2>
              </div>
              <Link
                href={`/branch/${decodedSubdomain}/news`}
                className={`inline-flex items-center gap-1 ${tc.text} font-semibold text-sm md:text-base`}
              >
                전체보기
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {news.map((item) => (
                <Link
                  key={item.id}
                  href={`/branch/${decodedSubdomain}/news`}
                  className="group bg-gray-50 rounded-xl md:rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                >
                  {item.thumbnail_url && (
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] md:text-xs font-medium rounded-full ${tc.bgLight} ${tc.text}`}>
                        {getCategoryLabel(item.category)}
                      </span>
                      <span className="text-[10px] md:text-xs text-gray-400">
                        {new Date(item.published_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1 line-clamp-2 group-hover:text-gray-700">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 line-clamp-2">{item.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 고객 후기 */}
      <section className={`py-10 md:py-20 ${news.length > 0 ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between gap-4 mb-6 md:mb-12">
            <div>
              <span className={`inline-block px-3 py-1 ${tc.bgLight} ${tc.text} rounded-full text-xs md:text-sm font-medium mb-2 md:mb-4`}>
                REVIEWS
              </span>
              <h2 className="text-xl md:text-4xl font-bold text-gray-900">
                고객 후기
              </h2>
            </div>
            <Link
              href={`/branch/${decodedSubdomain}/reviews`}
              className={`inline-flex items-center gap-1 ${tc.text} font-semibold text-sm md:text-base`}
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
                  className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm"
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
                    &ldquo;{review.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm md:text-base">{maskName(review.customer_name)}</p>
                      {review.vehicle_name && (
                        <p className="text-xs md:text-sm text-gray-400">{review.vehicle_name}</p>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-gray-400">{formatDateShort(review.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 bg-white rounded-xl md:rounded-2xl shadow-sm">
              <Quote className="w-8 h-8 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-500 mb-3 md:mb-4 text-sm md:text-base">아직 등록된 후기가 없습니다.</p>
              <Link
                href={`/branch/${decodedSubdomain}/reviews`}
                className={`inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 ${tc.bg} text-white rounded-lg font-semibold text-sm md:text-base`}
              >
                첫 번째 후기 작성하기
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 보험 및 이용안내 */}
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
                {INSURANCE_INFO.map((item, index) => (
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
                {RENTAL_REQUIREMENTS.map((item, index) => (
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

      {/* CTA Section */}
      <section className={`py-10 md:py-20 ${tc.bg} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className={`absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 ${tc.accentBg} rounded-full blur-3xl translate-x-1/2 translate-y-1/2`} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-4xl font-bold text-white mb-3 md:mb-6">
            지금 바로 예약하세요
          </h2>
          <p className="text-white/80 mb-4 md:mb-8 max-w-xl mx-auto text-sm md:text-lg leading-relaxed font-medium">
            친절한 상담과 합리적인 가격으로 모시겠습니다
          </p>
          <a
            href={`tel:${branch.phone}`}
            className={`inline-flex items-center gap-2 md:gap-3 px-6 py-3 md:px-10 md:py-5 bg-white ${tc.text} rounded-xl font-bold text-lg md:text-xl shadow-xl active:scale-95 transition-transform`}
          >
            <Phone className="w-5 h-5 md:w-6 md:h-6" />
            {branch.phone}
          </a>
          <p className="mt-4 md:mt-6 text-white/80 text-xs md:text-sm font-medium">
            연중무휴 {branch.business_hours || BRANCH_DEFAULTS.businessHours}
          </p>
        </div>
      </section>
    </>
  )
}
