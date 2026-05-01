import { redirect } from 'next/navigation'
import { getCurrentUser, hasMinimumRole } from '@/lib/auth/rbac'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || !hasMinimumRole(user.role, 'staff')) {
    redirect('/')
  }

  return (
    <AdminLayoutClient userEmail={user.email}>
      {children}
    </AdminLayoutClient>
  )
}
