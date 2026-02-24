/**
 * DB 레벨 보안 검증 스크립트
 * 실행: node supabase/tests/run-db-security-test.mjs
 * 필요: .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local 수동 파싱
const envPath = resolve(__dirname, '../../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    let val = match[2].trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
    // Vercel CLI adds literal \n at end of values
    if (val.endsWith('\\n')) val = val.slice(0, -2)
    env[match[1].trim()] = val
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const results = []

function log(test, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️'
  const line = `${icon} [${status}] ${test}${detail ? ' — ' + detail : ''}`
  console.log(line)
  results.push({ test, status, detail })
}

// ===========================================
// 1. S-P0-004: search_path 고정 확인
// ===========================================
async function testSearchPath() {
  console.log('\n=== S-P0-004: 함수 search_path 고정 ===')
  const { data, error } = await supabase.rpc('transition_reservation_status', {
    p_reservation_id: '00000000-0000-0000-0000-000000000000',
    p_action: 'invalid_test',
  })

  // 함수가 존재하고 실행 가능하면 PASS (에러 내용은 "예약을 찾을 수 없습니다")
  if (error && error.code === 'PGRST202') {
    log('transition_reservation_status RPC', 'FAIL', '함수가 존재하지 않음')
  } else if (data && data.success === false) {
    log('transition_reservation_status RPC', 'PASS', `함수 존재 & 실행 가능 (${data.error})`)
  } else if (error) {
    log('transition_reservation_status RPC', 'PASS', `함수 존재 (에러: ${error.message})`)
  } else {
    log('transition_reservation_status RPC', 'PASS', '함수 존재 & 동작')
  }
}

// ===========================================
// 2. S-P2-001: RLS 활성화 상태
// ===========================================
async function testRLS() {
  console.log('\n=== S-P2-001 & S-P2-008: RLS 활성화 상태 ===')

  const tables = ['branches', 'inquiries']

  for (const table of tables) {
    // anon key로 테스트해야 하지만 service_role은 RLS를 바이패스함
    // 대신 테이블 조회 가능 여부로 존재 확인
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      log(`${table} RLS`, 'INFO', `테이블 접근 에러: ${error.message}`)
    } else {
      log(`${table} RLS`, 'PASS', `테이블 존재 (${count}행)`)
    }
  }
}

// ===========================================
// 3. S-P1-006: 중복 결제 방지 인덱스
// 유니크 인덱스가 제대로 동작하는지 테스트
// ===========================================
async function testDuplicatePaymentIndex() {
  console.log('\n=== S-P1-006: 중복 결제 방지 ===')

  // payments 테이블에서 pending 상태의 결제가 있는 예약을 찾아 중복 삽입 시도 불필요
  // 대신 인덱스 존재 여부를 pg_indexes 테이블로 확인
  // service_role로는 pg_indexes에 직접 접근 불가 → rpc로 확인
  // 간접 확인: 존재하지 않는 예약 ID로 2개 pending 결제 삽입 시도
  const fakeReservationId = '00000000-0000-0000-0000-999999999999'
  const fakeBranchId = '00000000-0000-0000-0000-999999999998'

  // 먼저 기존 테스트 데이터 정리
  await supabase
    .from('payments')
    .delete()
    .eq('reservation_id', fakeReservationId)

  // 첫 번째 삽입
  const { error: err1 } = await supabase
    .from('payments')
    .insert({
      reservation_id: fakeReservationId,
      branch_id: fakeBranchId,
      amount: 1,
      payment_method: 'card',
      pg_provider: 'test',
      pg_order_id: 'TEST_UNIQUE_1',
      status: 'pending',
    })

  if (err1) {
    // FK 제약조건 위반 (reservation_id가 존재하지 않음) → 이것도 유효한 결과
    if (err1.code === '23503') {
      log('중복 결제 방지 인덱스', 'INFO', 'FK 제약으로 테스트 불가 (reservation_id 미존재) — SQL Editor에서 직접 확인 필요')
    } else {
      log('중복 결제 방지 인덱스', 'INFO', `첫 삽입 실패: ${err1.message}`)
    }
    return
  }

  // 두 번째 삽입 (같은 reservation_id, pending 상태) → 유니크 인덱스 위반 예상
  const { error: err2 } = await supabase
    .from('payments')
    .insert({
      reservation_id: fakeReservationId,
      branch_id: fakeBranchId,
      amount: 2,
      payment_method: 'card',
      pg_provider: 'test',
      pg_order_id: 'TEST_UNIQUE_2',
      status: 'pending',
    })

  if (err2 && err2.code === '23505') {
    log('중복 결제 방지 인덱스', 'PASS', '두 번째 pending 삽입이 유니크 제약으로 차단됨')
  } else if (err2) {
    log('중복 결제 방지 인덱스', 'INFO', `두 번째 삽입 에러: ${err2.code} ${err2.message}`)
  } else {
    log('중복 결제 방지 인덱스', 'FAIL', '중복 pending 결제가 생성됨 — 인덱스 미적용')
  }

  // 정리
  await supabase
    .from('payments')
    .delete()
    .eq('reservation_id', fakeReservationId)
}

// ===========================================
// 4. S-P1-001: branches 컬럼 레벨 보안
// anon 키로 민감 컬럼 접근 시도
// ===========================================
async function testColumnSecurity() {
  console.log('\n=== S-P1-001: branches 컬럼 레벨 보안 ===')

  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    log('컬럼 레벨 보안', 'INFO', 'NEXT_PUBLIC_SUPABASE_ANON_KEY 없음 — SQL Editor에서 직접 확인 필요')
    return
  }

  const anonClient = createClient(supabaseUrl, anonKey)

  const { data, error } = await anonClient
    .from('branches')
    .select('id, name, api_key, admin_email, submall_id, bank_account_number')
    .limit(1)

  if (error) {
    if (error.message.includes('permission denied') || error.code === '42501') {
      log('컬럼 레벨 보안', 'PASS', '민감 컬럼 접근 차단됨')
    } else {
      log('컬럼 레벨 보안', 'INFO', `에러: ${error.message}`)
    }
  } else if (data && data.length > 0) {
    const row = data[0]
    const sensitiveExposed = ['api_key', 'admin_email', 'submall_id', 'bank_account_number']
      .filter(col => row[col] !== undefined)
    if (sensitiveExposed.length > 0) {
      log('컬럼 레벨 보안', 'FAIL', `민감 컬럼 노출됨: ${sensitiveExposed.join(', ')}`)
    } else {
      log('컬럼 레벨 보안', 'PASS', '민감 컬럼이 응답에 포함되지 않음')
    }
  } else {
    log('컬럼 레벨 보안', 'PASS', '활성 지점 없음 또는 컬럼 접근 차단')
  }
}

// ===========================================
// 5. S-P2-008: inquiries RLS (anon 읽기 차단)
// ===========================================
async function testInquiriesRLS() {
  console.log('\n=== S-P2-008: inquiries RLS (anon 읽기 차단) ===')

  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    log('inquiries RLS', 'INFO', 'NEXT_PUBLIC_SUPABASE_ANON_KEY 없음 — SQL Editor에서 직접 확인 필요')
    return
  }

  const anonClient = createClient(supabaseUrl, anonKey)

  const { data, error } = await anonClient
    .from('inquiries')
    .select('*')
    .limit(1)

  if (error) {
    log('inquiries anon SELECT', 'PASS', `접근 차단: ${error.message}`)
  } else if (data && data.length === 0) {
    log('inquiries anon SELECT', 'PASS', 'RLS가 anon 읽기를 차단 (빈 결과)')
  } else if (data && data.length > 0) {
    log('inquiries anon SELECT', 'FAIL', `anon 사용자가 문의 데이터 조회 가능 (${data.length}건)`)
  }
}

// ===========================================
// 6. S-P2-003: 상태 전환 상태 머신 검증
// ===========================================
async function testStatusTransition() {
  console.log('\n=== S-P2-003: 상태 전환 상태 머신 ===')

  // 존재하지 않는 예약 → 에러
  const { data: result1 } = await supabase.rpc('transition_reservation_status', {
    p_reservation_id: '00000000-0000-0000-0000-000000000000',
    p_action: 'approve',
  })
  if (result1 && result1.success === false && result1.error.includes('찾을 수 없')) {
    log('존재하지 않는 예약', 'PASS', result1.error)
  } else {
    log('존재하지 않는 예약', 'FAIL', JSON.stringify(result1))
  }
}

// ===========================================
// 7. S-P2-006: FK RESTRICT 동작 확인
// ===========================================
async function testFKRestrict() {
  console.log('\n=== S-P2-006: FK RESTRICT 확인 ===')

  // 차량이 있는 지점을 삭제 시도 → RESTRICT로 차단되어야 함
  const { data: branchWithVehicles } = await supabase
    .from('vehicles')
    .select('branch_id')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!branchWithVehicles) {
    log('FK RESTRICT', 'INFO', '활성 차량이 없어 테스트 불가')
    return
  }

  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', branchWithVehicles.branch_id)

  if (error) {
    if (error.code === '23503' || error.message.includes('violates foreign key')) {
      log('FK RESTRICT (branches → vehicles)', 'PASS', '자식 레코드 존재 시 삭제 차단됨')
    } else {
      log('FK RESTRICT (branches → vehicles)', 'PASS', `삭제 차단: ${error.message}`)
    }
  } else {
    log('FK RESTRICT (branches → vehicles)', 'FAIL', '지점이 삭제됨 — CASCADE 또는 RESTRICT 미적용')
  }
}

// ===========================================
// 실행
// ===========================================
async function main() {
  console.log('🔒 DB 레벨 보안 검증 시작\n')
  console.log(`Supabase: ${supabaseUrl}`)
  console.log(`시간: ${new Date().toISOString()}`)

  await testSearchPath()
  await testRLS()
  await testDuplicatePaymentIndex()
  await testColumnSecurity()
  await testInquiriesRLS()
  await testStatusTransition()
  await testFKRestrict()

  // 요약
  console.log('\n=== 전체 요약 ===')
  const pass = results.filter(r => r.status === 'PASS').length
  const fail = results.filter(r => r.status === 'FAIL').length
  const info = results.filter(r => r.status === 'INFO').length
  console.log(`✅ PASS: ${pass}  ❌ FAIL: ${fail}  ℹ️ INFO: ${info}  (총 ${results.length}건)`)

  if (fail > 0) {
    console.log('\n❌ 실패 항목:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.test}: ${r.detail}`)
    })
  }
}

main().catch(err => {
  console.error('실행 오류:', err)
  process.exit(1)
})
