import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/with-auth'
import type { UserRole } from '@/lib/auth/rbac'

// Supabase Admin Client (Service Role Key 필요)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const POST = withAuth({ auth: 'super_admin', rateLimit: 'auth' }, async (request: NextRequest) => {
  const { email, password, role = 'user', branch_id } = await request.json() as {
    email: string
    password: string
    role?: UserRole
    branch_id?: string
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: '이메일과 비밀번호를 입력해주세요.' },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
      { status: 400 }
    )
  }

  // 유효한 역할인지 확인
  const validRoles: UserRole[] = ['super_admin', 'admin', 'branch_admin', 'staff', 'user']
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: '유효하지 않은 역할입니다.' },
      { status: 400 }
    )
  }

  // 사용자 생성 (역할 정보 포함)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      branch_id: branch_id || null,
    },
  })

  if (error) {
    // 이미 존재하는 사용자인 경우
    if (error.message.includes('already been registered')) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.', exists: true },
        { status: 400 }
      )
    }
    throw error
  }

  // user_roles 테이블에도 역할 저장 (신뢰할 수 있는 역할 소스)
  if (data.user) {
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: data.user.id,
        role,
        branch_id: branch_id || null,
      }, { onConflict: 'user_id' })

    if (roleError) {
      console.error('Error creating user role:', roleError)
      // 사용자는 생성되었으나 역할 저장 실패 - 로그 남기고 계속 진행
    }
  }

  return NextResponse.json({
    success: true,
    message: '사용자 계정이 생성되었습니다.',
    user: {
      id: data.user?.id,
      email: data.user?.email,
      role,
      branch_id: branch_id || null,
    }
  })
})
