/**
 * 지점 API 토큰 생성/검증 모듈
 * Base64 인코딩 대신 HMAC-SHA256 서명을 사용하여 토큰 위조를 방지
 */

import crypto from 'crypto'

const BRANCH_TOKEN_SECRET = process.env.BRANCH_TOKEN_SECRET

interface BranchTokenPayload {
  branch_id: string
  iat: number // issued at (ms)
  exp: number // expiry (ms)
}

/**
 * 지점 인증 토큰 생성 (HMAC-SHA256 서명)
 */
export function generateBranchToken(branchId: string, expiresInMs = 24 * 60 * 60 * 1000): string {
  if (!BRANCH_TOKEN_SECRET) {
    throw new Error('BRANCH_TOKEN_SECRET 환경변수가 설정되지 않았습니다.')
  }

  const payload: BranchTokenPayload = {
    branch_id: branchId,
    iat: Date.now(),
    exp: Date.now() + expiresInMs,
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', BRANCH_TOKEN_SECRET)
    .update(payloadStr)
    .digest('base64url')

  return `${payloadStr}.${signature}`
}

/**
 * 지점 인증 토큰 검증 (HMAC-SHA256 서명 + 만료 시간)
 * 검증 실패 시 null 반환
 */
export function verifyBranchToken(token: string): string | null {
  if (!BRANCH_TOKEN_SECRET) {
    console.error('BRANCH_TOKEN_SECRET 환경변수가 설정되지 않았습니다.')
    return null
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payloadStr, signature] = parts

    // HMAC-SHA256 서명 재생성
    const expectedSig = crypto
      .createHmac('sha256', BRANCH_TOKEN_SECRET)
      .update(payloadStr)
      .digest('base64url')

    // 타이밍 안전 비교 (타이밍 공격 방지)
    const sigBuffer = Buffer.from(signature, 'base64url')
    const expectedBuffer = Buffer.from(expectedSig, 'base64url')

    if (sigBuffer.length !== expectedBuffer.length) return null
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null

    // 페이로드 디코딩
    const payload: BranchTokenPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString()
    )

    // 만료 확인
    if (payload.exp < Date.now()) return null

    return payload.branch_id
  } catch {
    return null
  }
}

/**
 * HTTP 요청에서 Bearer 토큰 추출 및 검증
 */
export function authenticateBranch(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  return verifyBranchToken(token)
}
