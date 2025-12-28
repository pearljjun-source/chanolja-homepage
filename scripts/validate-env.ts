/**
 * 환경 변수 검증 스크립트
 * 실행: npx ts-node scripts/validate-env.ts
 */

interface EnvVar {
  name: string
  required: boolean
  isPublic: boolean
  description: string
  example: string
}

const envVars: EnvVar[] = [
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    isPublic: true,
    description: 'Supabase 프로젝트 URL',
    example: 'https://xxxxx.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    isPublic: true,
    description: 'Supabase 익명 키 (공개용)',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    isPublic: false,
    description: 'Supabase 서비스 역할 키 (관리자용)',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  },

  // Naver Map
  {
    name: 'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID',
    required: true,
    isPublic: true,
    description: '네이버 지도 클라이언트 ID',
    example: 'xxxxxxxxxx',
  },
  {
    name: 'NAVER_MAP_CLIENT_SECRET',
    required: false,
    isPublic: false,
    description: '네이버 지도 클라이언트 시크릿',
    example: 'xxxxxxxxxxxxxxxxxxxx',
  },

  // Kakao
  {
    name: 'KAKAO_REST_API_KEY',
    required: true,
    isPublic: false,
    description: '카카오 REST API 키 (지오코딩용)',
    example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },

  // Toss Payments
  {
    name: 'NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY',
    required: true,
    isPublic: true,
    description: '토스페이먼츠 클라이언트 키',
    example: 'test_ck_xxxxxxxxxxxxxxxx',
  },
  {
    name: 'TOSS_PAYMENTS_SECRET_KEY',
    required: true,
    isPublic: false,
    description: '토스페이먼츠 시크릿 키',
    example: 'test_sk_xxxxxxxxxxxxxxxx',
  },
  {
    name: 'TOSS_PAYMENTS_WEBHOOK_SECRET',
    required: false,
    isPublic: false,
    description: '토스페이먼츠 웹훅 시크릿',
    example: 'your_webhook_secret',
  },

  // Split Payment
  {
    name: 'HQ_SUBMALL_ID',
    required: false,
    isPublic: false,
    description: '본사 서브몰 ID (스플릿 결제)',
    example: 'hq_submall_id',
  },
  {
    name: 'DEFAULT_BRANCH_SUBMALL_ID',
    required: false,
    isPublic: false,
    description: '기본 지점 서브몰 ID (스플릿 결제)',
    example: 'branch_submall_id',
  },

  // Site
  {
    name: 'NEXT_PUBLIC_URL',
    required: false,
    isPublic: true,
    description: '사이트 기본 URL',
    example: 'https://your-domain.com',
  },
]

function validateEnv(): void {
  console.log('\n🔍 환경 변수 검증 시작...\n')
  console.log('=' .repeat(60))

  let hasError = false
  let hasWarning = false

  const results: { name: string; status: string; value: string }[] = []

  for (const envVar of envVars) {
    const value = process.env[envVar.name]
    let status: string
    let displayValue: string

    if (!value) {
      if (envVar.required) {
        status = '❌ 필수 누락'
        hasError = true
      } else {
        status = '⚠️  선택 누락'
        hasWarning = true
      }
      displayValue = '(설정 안됨)'
    } else if (value.includes('placeholder') || value.includes('your_') || value === 'test_ck_placeholder' || value === 'test_sk_placeholder') {
      status = '⚠️  플레이스홀더'
      hasWarning = true
      displayValue = '(실제 값 필요)'
    } else {
      status = '✅ 설정됨'
      // 민감한 정보는 마스킹
      if (!envVar.isPublic && value.length > 10) {
        displayValue = value.substring(0, 5) + '...' + value.substring(value.length - 5)
      } else if (value.length > 30) {
        displayValue = value.substring(0, 20) + '...'
      } else {
        displayValue = value
      }
    }

    results.push({ name: envVar.name, status, value: displayValue })
  }

  // 결과 출력
  for (const result of results) {
    console.log(`${result.status.padEnd(15)} ${result.name}`)
    if (result.value !== '(설정 안됨)') {
      console.log(`${''.padEnd(17)} └─ ${result.value}`)
    }
  }

  console.log('=' .repeat(60))

  // 요약
  const configured = results.filter(r => r.status.includes('✅')).length
  const missing = results.filter(r => r.status.includes('❌')).length
  const warnings = results.filter(r => r.status.includes('⚠️')).length

  console.log(`\n📊 요약: 설정됨 ${configured}개, 누락 ${missing}개, 경고 ${warnings}개\n`)

  if (hasError) {
    console.log('❌ 필수 환경 변수가 누락되었습니다. .env.local 파일을 확인하세요.\n')
    process.exit(1)
  } else if (hasWarning) {
    console.log('⚠️  일부 환경 변수가 누락되거나 플레이스홀더입니다.\n')
    console.log('   프로덕션 배포 전 실제 값으로 설정하세요.\n')
  } else {
    console.log('✅ 모든 환경 변수가 올바르게 설정되었습니다!\n')
  }
}

// 실행
validateEnv()
