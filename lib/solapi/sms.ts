/**
 * 솔라피(Solapi) SMS 전송 모듈
 *
 * 문의 접수 시 관리자에게 SMS/LMS 알림을 보냅니다.
 * API 문서: https://docs.solapi.com/api-reference/messages
 */

import crypto from 'crypto'

const SOLAPI_API_URL = 'https://api.solapi.com/messages/v4/send'

interface SendSMSOptions {
  receiver: string
  message: string
  subject?: string // LMS일 경우 제목
}

interface SolapiResponse {
  groupId?: string
  messageId?: string
  statusCode?: string
  statusMessage?: string
  to?: string
  errorCode?: string
  errorMessage?: string
}

/**
 * 솔라피 인증 헤더 생성 (HMAC-SHA256)
 */
function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.SOLAPI_API_KEY!
  const apiSecret = process.env.SOLAPI_API_SECRET!
  const date = new Date().toISOString()
  const salt = crypto.randomBytes(32).toString('hex')
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex')

  return {
    'Content-Type': 'application/json',
    Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
  }
}

/**
 * SMS/LMS 전송
 * 메시지 길이가 90바이트를 초과하면 자동으로 LMS로 전송됩니다.
 */
export async function sendSMS({ receiver, message, subject }: SendSMSOptions): Promise<SolapiResponse> {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const sender = process.env.SOLAPI_SENDER

  if (!apiKey || !apiSecret || !sender) {
    console.error('Solapi SMS: 환경변수가 설정되지 않았습니다 (SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER)')
    return { errorCode: 'ENV_MISSING', errorMessage: '환경변수 미설정' }
  }

  // 90바이트 초과 시 LMS
  const byteLength = Buffer.byteLength(message, 'utf-8')
  const type = byteLength > 90 ? 'LMS' : 'SMS'

  const body: Record<string, unknown> = {
    message: {
      to: receiver,
      from: sender,
      text: message,
      type,
      ...(type === 'LMS' && subject ? { subject } : {}),
    },
  }

  try {
    const response = await fetch(SOLAPI_API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })

    const result: SolapiResponse = await response.json()

    if (!response.ok) {
      console.error('Solapi SMS 전송 실패:', result)
    }

    return result
  } catch (error) {
    console.error('Solapi SMS 전송 오류:', error)
    return { errorCode: 'FETCH_ERROR', errorMessage: '전송 중 오류 발생' }
  }
}

/**
 * 문의 접수 알림 SMS 전송
 */
export async function sendInquiryNotification(inquiry: {
  name: string
  phone: string
  email?: string | null
  region?: string | null
  inquiry_type: string
  message: string
}): Promise<void> {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER
  if (!adminPhone) {
    console.error('Solapi SMS: ADMIN_PHONE_NUMBER가 설정되지 않았습니다')
    return
  }

  const typeLabels: Record<string, string> = {
    branch: '지점 개설',
    corporation: '법인 설립',
    camping: '캠핑카 사업',
    other: '기타 문의',
  }

  const lines = [
    '[차놀자] 새 창업문의',
    `이름: ${inquiry.name}`,
    `연락처: ${inquiry.phone}`,
  ]

  if (inquiry.email) {
    lines.push(`이메일: ${inquiry.email}`)
  }
  if (inquiry.region) {
    lines.push(`희망지역: ${inquiry.region}`)
  }
  lines.push(`유형: ${typeLabels[inquiry.inquiry_type] || inquiry.inquiry_type}`)
  lines.push(`내용: ${inquiry.message}`)

  const smsMessage = lines.join('\n')

  await sendSMS({
    receiver: adminPhone,
    message: smsMessage,
    subject: '[차놀자] 새 창업문의',
  })
}
