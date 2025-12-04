// 지점 주소를 좌표로 변환하여 Supabase에 업데이트하는 스크립트
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://tfujaxuiifhkxgvhsyuk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdWpheHVpaWZoa3hndmhzeXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzY0NDEsImV4cCI6MjA3OTcxMjQ0MX0.pbU6VS-B4cvfuUE40v-ptpblEXv9-qJzSCWxMEFn1LQ'

// 카카오 API 키
const KAKAO_REST_API_KEY = '1fbeb994239c8409b3c4af5a93ae6f45'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 주소를 좌표로 변환 (카카오 Geocoding API)
async function getCoordinates(address) {
  if (!address) return null

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    )

    const data = await response.json()

    if (data.documents && data.documents.length > 0) {
      return {
        lat: parseFloat(data.documents[0].y),
        lng: parseFloat(data.documents[0].x),
      }
    }
    return null
  } catch (error) {
    console.error(`주소 변환 실패: ${address}`, error.message)
    return null
  }
}

// 딜레이 함수 (API 호출 제한 방지)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function updateBranchCoordinates() {
  console.log('지점 좌표 업데이트 시작...\n')

  // 좌표가 없는 지점 조회
  const { data: branches, error } = await supabase
    .from('branches')
    .select('id, name, address, lat, lng')
    .is('lat', null)
    .not('address', 'is', null)

  if (error) {
    console.error('지점 조회 실패:', error)
    return
  }

  console.log(`좌표가 없는 지점: ${branches.length}개\n`)

  let successCount = 0
  let failCount = 0

  for (const branch of branches) {
    console.log(`처리 중: ${branch.name} - ${branch.address}`)

    const coords = await getCoordinates(branch.address)

    if (coords) {
      const { error: updateError } = await supabase
        .from('branches')
        .update({ lat: coords.lat, lng: coords.lng })
        .eq('id', branch.id)

      if (updateError) {
        console.log(`  ❌ 업데이트 실패: ${updateError.message}`)
        failCount++
      } else {
        console.log(`  ✅ 좌표: ${coords.lat}, ${coords.lng}`)
        successCount++
      }
    } else {
      console.log(`  ⚠️ 좌표 변환 실패`)
      failCount++
    }

    // API 호출 제한 방지를 위해 200ms 대기
    await delay(200)
  }

  console.log(`\n완료! 성공: ${successCount}개, 실패: ${failCount}개`)
}

updateBranchCoordinates()
