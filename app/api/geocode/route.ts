import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/with-auth'

// 주소 정규화 - 상세 호수 등 제거
function normalizeAddress(address: string): string {
  // 쉼표 이후 부분 제거 (상세주소)
  let normalized = address.split(',')[0].trim()

  // 괄호 안 내용 제거
  normalized = normalized.replace(/\([^)]*\)/g, '').trim()

  // 층, 호 등 상세 정보 제거
  normalized = normalized.replace(/\s+\d+층.*$/, '').trim()
  normalized = normalized.replace(/\s+\d+-?\d*호.*$/, '').trim()

  return normalized
}

// 카카오 Geocoding API를 사용한 주소 → 좌표 변환
export const POST = withAuth({ auth: 'public', rateLimit: 'default' }, async (request: NextRequest, { user, params }) => {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ success: false, error: '주소가 필요합니다' }, { status: 400 })
    }

    const kakaoApiKey = process.env.KAKAO_REST_API_KEY

    if (!kakaoApiKey) {
      return NextResponse.json(
        { success: false, error: '카카오 API 키가 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // 먼저 원본 주소로 시도
    let response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${kakaoApiKey}`,
        },
      }
    )

    let data = await response.json()

    // 결과가 없으면 정규화된 주소로 재시도
    if (!data.documents || data.documents.length === 0) {
      const normalized = normalizeAddress(address)
      if (normalized !== address) {
        response = await fetch(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(normalized)}`,
          {
            headers: {
              'Authorization': `KakaoAK ${kakaoApiKey}`,
            },
          }
        )
        data = await response.json()
      }
    }

    // 여전히 결과가 없으면 키워드 검색 시도
    if (!data.documents || data.documents.length === 0) {
      const normalized = normalizeAddress(address)
      response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(normalized)}`,
        {
          headers: {
            'Authorization': `KakaoAK ${kakaoApiKey}`,
          },
        }
      )
      data = await response.json()
    }

    if (data.documents && data.documents.length > 0) {
      const { x, y } = data.documents[0]
      return NextResponse.json({
        success: true,
        data: { lat: parseFloat(y), lng: parseFloat(x) },
      })
    }

    return NextResponse.json({ success: true, data: { lat: null, lng: null } })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { success: false, error: '좌표 변환 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
})
